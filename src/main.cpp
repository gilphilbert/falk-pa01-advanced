#include <Arduino.h>
#include <ESP32Encoder.h>
#include <driver/gpio.h>
#include <Wire.h>

#include <Preferences.h>

#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <ESPmDNS.h>
#include <Update.h>
#include <SPIFFS.h>
#include "esp_task_wdt.h"
#include "esp_int_wdt.h"
#include "Arduino_JSON.h"

// for the display
#include <SPI.h>
#include <U8g2lib.h>
// ^^ \libraries\U8g2\src\clib\u8g2.h <-- uncomment #define U8G2_16BIT

#include "relays.h"
#include "falk-pre-conf.h"

String fw_version = "0.1.5";

#define COMMIT_TIMEOUT          400

#define BUTTON_DEBOUNCE_DELAY   50
#define BUTTON_LONG_PRESS       2000

Preferences preferences;
uint32_t FlashCommit = 0;

RelayController relays;

// for the volume rotary encoder
#define VOL_ENCODER_A           27
#define VOL_ENCODER_B           14
ESP32Encoder volEnc;

// for the input rotary encoder
#define INP_ENCODER_A           25
#define INP_ENCODER_B           26
ESP32Encoder inpEnc;

// to handle mute state
#define MUTE_BUTTON             35
#define MUTE_SET                32
#define MUTE_RESET              33
int muteState = 0;
int muteButtonState;
int lastmuteButtonState = HIGH;
unsigned long muteDebounceTime = 0;
uint32_t MuteRelayPulseTime = 0;

typedef struct {
  int16_t volume = 26;
  int16_t input = 1;
  String inputNames [INP_MAX];
  uint16_t saved = 0;
  uint8_t dim = 1;
} Settings;
Settings settings;

// for the display
#define SCREEN_CS               5
#define SCREEN_DC               15
#define SCREEN_RST              13
#define SCREEN_TIMEOUT          10000
//this uses the default SPI interface as defined by the manufacturer
//NOTE: for the Adafruit HUZZAH32, use the *labelled pins*, not the standard ones for the ESP32
U8G2_SSD1322_NHD_256X64_F_4W_HW_SPI u8g2(U8G2_R0, SCREEN_CS, SCREEN_DC, SCREEN_RST);
uint32_t screenTimer = 0;

//wifi settings
#define WIFI_BUTTON             34
#define WIFI_TIMEOUT            60000
#define HOSTNAME                "falk.local"
const char* ssid = "FALK-PRE";
uint32_t wifiButtonPressTime = 0;
uint32_t wifiConnectTimeout = 0;
uint8_t wifibuttonstate = HIGH;
AsyncWebServer server(80);
bool shouldReboot = false;

//function that puts the input and volume on the screen
void updateScreen() {
  char volume [5];
  if (muteState == 0) {
    uint16_t v = round(((float)settings.volume / (float)VOL_MAX) * 100);
    itoa(v, volume, 10);
    strcat(volume, "%");
  } else {
    String s = "MUTE";
    strcpy(volume, s.c_str());
  }
  u8g2.clearBuffer();					// clear the internal memory

  u8g2.setFont(u8g2_font_fub25_tf);

  //vertically centers the text
  uint16_t y = 49;
  //left starting position for the volume (so it's right-aligned)
  uint16_t x = 256 - u8g2.getStrWidth(volume);

  u8g2.drawStr(0, y, settings.inputNames[settings.input - 1].c_str());
  u8g2.drawStr(x, y, volume);

  u8g2.setFont(u8g2_font_crox1h_tr);
  x = 256 - u8g2.getStrWidth("VOLUME");
  u8g2.drawStr(0, 9, "INPUT");
  u8g2.drawStr(x, 9, "VOLUME");

  //max brightness
  u8g2.setContrast(255);
  //write data to screen
  u8g2.sendBuffer();
  //dim the display in 10s
  if (settings.dim == 1) {
    screenTimer = millis();
  }
}

//called after the timeout elapses, drops screen brightness
void dimScreen() {
  u8g2.setContrast(1);
  screenTimer = 0;
}

void configureServer() {
  if(!SPIFFS.begin(true)){
    Serial.println("An Error has occurred while mounting SPIFFS");
    return;
  }
  server.on("/update", HTTP_POST, [&](AsyncWebServerRequest *request){
    shouldReboot = !Update.hasError();
    AsyncWebServerResponse *response = request->beginResponse(200, "text/plain", shouldReboot?"OK":"FAIL");
    response->addHeader("Connection", "close");
    request->send(response);
  },[&](AsyncWebServerRequest *request, String filename, size_t index, uint8_t *data, size_t len, bool final){
    if(!index){
      Serial.printf("Update Start: %s\n", filename.c_str());
      int cmd = (filename == "spiffs.bin") ? U_SPIFFS : U_FLASH;
      if(!Update.begin(UPDATE_SIZE_UNKNOWN, cmd)){
        Update.printError(Serial);
        return request->send(200, "text/plain", "OTA could not begin");
      }
    }
    if(!Update.hasError()){
      if(Update.write(data, len) != len){
        Update.printError(Serial);
        return request->send(200, "text/plain", "OTA could not start");
      }
    }
    if(final){
      if(Update.end(true)){
        Serial.printf("Update Success: %uB\n", index+len);
        return request->send(200, "text/plain", "Success");
      } else {
        Update.printError(Serial);
        return request->send(200, "text/plain", "OTA could not end");
      }
    } else {
      return;
    }
  });

  // API CONTENT
  server.on("/api/dashboard", HTTP_GET, [&](AsyncWebServerRequest *request){
    JSONVar volObj;
    volObj["max"] = VOL_MAX;
    volObj["current"] = settings.volume;
    JSONVar retObj;
    retObj["volume"] = volObj;
    //things to return:
    // volume (max, current)
    // list of inputs, selected input
    // settings?
    String retStr = JSON.stringify(retObj);
    return request->send(200, "application/json", retStr);
  });
  server.on("/api/volume", HTTP_GET, [&](AsyncWebServerRequest *request){
    JSONVar retObj;
    retObj["max"] = VOL_MAX;
    retObj["current"] = settings.volume;
    String retStr = JSON.stringify(retObj);
    return request->send(200, "application/json", retStr);
  });
  server.on("/api/volume", HTTP_POST, [&](AsyncWebServerRequest *request){
    if(request->hasParam("value", true)) {
      AsyncWebParameter* rawJSON = request->getParam("data", -1);
      JSONVar jsnObj = JSON.parse((const char*) rawJSON);
      settings.volume = (int) jsnObj["volume"];
      relays.setVolume(settings.volume);
    }
    JSONVar retObj;
    retObj["max"] = VOL_MAX;
    retObj["current"] = settings.volume;
    String retStr = JSON.stringify(retObj);
    return request->send(200, "application/json", retStr);
  });
  server.on("/api/firmware", HTTP_GET, [&](AsyncWebServerRequest *request){
    File appFile = SPIFFS.open("/version", "r");
    String app_version = appFile.readString();
    app_version = app_version.substring(0, app_version.length() -1);
    JSONVar retObj;
    retObj["fw"] = fw_version;
    retObj["app"] = app_version;
    String retStr = JSON.stringify(retObj);
    return request->send(200, "application/json", retStr);
  });


  server.serveStatic("/", SPIFFS, "/www/").setDefaultFile("index.html");

  server.begin();
}

void enableWifi() {
  WiFi.softAP(ssid);
  IPAddress IP = WiFi.softAPIP();
  MDNS.begin(HOSTNAME);

  Serial.print("AP IP address: ");
  Serial.println(IP);

  u8g2.clearBuffer();					// clear the internal memory

  u8g2.setFont(u8g2_font_open_iconic_www_2x_t);
  u8g2.drawGlyph(120,19,0x51);

  u8g2.setFont(u8g2_font_crox1h_tr);
  String string = "Search for this WiFi network";
  const char* str = string.c_str();
  uint16_t x = 128 - (u8g2.getStrWidth(str) / 2);
  uint16_t y = 45;
  u8g2.drawStr(x, y, str);

  u8g2.setFont(u8g2_font_tenthinnerguys_tr);
  x = 128 - (u8g2.getStrWidth(ssid) / 2);
  y = 61;
  u8g2.drawStr(x, y, ssid);

  u8g2.setContrast(255);
  u8g2.sendBuffer();

  configureServer();

  //wifiConnectTimeout = millis();
}

void setup(){	
	Serial.begin(9600);
  Serial.println("Booting...");
  //use the pullup resistors, this means we can connect ground to the encoders
	ESP32Encoder::useInternalWeakPullResistors=UP;

  //configure the MCP27013 ICs
  relays.begin();

  //start preferences
  preferences.begin("falk-pre", false);
  //preferences.clear();
  preferences.getBytes("settings", &settings, sizeof(Settings));

  //add some default values if this is our first boot
  if (settings.saved == 0) {
    settings.saved = 1;
    for (int i = 0; i < INP_MAX; i++) {
      settings.inputNames[i] = "Input " + (String)(i+1);
    }
  }

  //configure the input encoder
  inpEnc.attachSingleEdge(INP_ENCODER_A, INP_ENCODER_B);
  inpEnc.setCount(settings.input);

  //configure the volume encoder
	volEnc.attachFullQuad(VOL_ENCODER_A, VOL_ENCODER_B);
  volEnc.setCount(settings.volume);

  //configure the mute button
  pinMode(MUTE_BUTTON, INPUT);
  pinMode(MUTE_SET, OUTPUT);
  pinMode(MUTE_RESET, OUTPUT);

  //the relays *should* match our stored values (since they're latching) but we can't be sure
  //so we set them to these values so the screen and relays match
  relays.setVolume(settings.volume);
  relays.setInput(settings.input);
  updateScreen();

  //this is the input rotary encoder button. Needed to handle wifi enable
  //pinMode(WIFI_BUTTON, INPUT_PULLUP);
  pinMode(WIFI_BUTTON, INPUT);

  //start the screen object
  u8g2.begin();

  enableWifi();
}

void muteHandler(uint32_t m) {
  int reading = digitalRead(MUTE_BUTTON);

  if (reading != lastmuteButtonState) {
    muteDebounceTime = m;
  }

  if ((m - muteDebounceTime) > BUTTON_DEBOUNCE_DELAY) {
    if (reading != muteButtonState) {
      muteButtonState = reading;

      if (muteButtonState == LOW) {
        if (muteState == 0) {
          muteState = 1;
          volEnc.pauseCount();
          updateScreen();
          digitalWrite(MUTE_SET, 1);
          MuteRelayPulseTime = millis();
        } else {
          muteState = 0;
          volEnc.resumeCount();
          updateScreen();
          digitalWrite(MUTE_RESET, 1);
          MuteRelayPulseTime = millis();
        }
      }
    }
  }
  lastmuteButtonState = reading;

  if ((MuteRelayPulseTime > 0) && (m > MuteRelayPulseTime + RELAY_PULSE)) {
    digitalWrite(MUTE_SET, 0);
    digitalWrite(MUTE_RESET, 0);
  }
}

void wifiLoop(uint32_t m) {
  int reading = digitalRead(WIFI_BUTTON);
  if (reading != wifibuttonstate) {
    Serial.println(reading);
    if (reading == LOW) {
      wifiButtonPressTime = m;
    } else {
      wifiButtonPressTime = 0;
    }
    wifibuttonstate = reading;
  } else if ((reading == LOW) && (wifiButtonPressTime > 0) && (m > wifiButtonPressTime + BUTTON_LONG_PRESS)) {
    enableWifi();
    wifiButtonPressTime = 0;
  }

  if ((wifiConnectTimeout > 0) && (m > wifiConnectTimeout + WIFI_TIMEOUT)) {
    wifiConnectTimeout = 0;
    WiFi.mode(WIFI_MODE_STA);
    updateScreen();
  }
}

void inputLoop(int m) {
  uint16_t count = inpEnc.getCount();
  if (count != settings.input) {
    if (count > INP_MAX) {
      count = INP_MIN;
      inpEnc.setCount(INP_MIN);
    } else if (count < INP_MIN) {
      count = INP_MAX;
      inpEnc.setCount(INP_MAX);
    }
    relays.setInput(count);
    settings.input = count;
    updateScreen();
    //set a delayed commit (this prevents us from wearing out the flash with each detent)
    FlashCommit = m;
  }
}

void volumeLoop(int m) {
  //gets the current volume, checks to see if it's changed and sets the new volume
  uint16_t count = volEnc.getCount();
  if (count != settings.volume) {
    //if we're outside the limts, override with the limits
    if (count > VOL_MAX) {
      //restore back to the maximum volume
      volEnc.setCount(VOL_MAX);
      count = VOL_MAX;
    } else if (count < VOL_MIN) {
      //restore back to the minimum volume
      volEnc.setCount(VOL_MIN);
      count = VOL_MIN;
    }
    //check again (in case we reset to be inside the limits)
    if (count != settings.volume) {
      //save the new volume
      settings.volume = count;
      //write to the screen
      updateScreen();
      //set the relays
      relays.setVolume(count);
      //set a delayed commit (this prevents us from wearing out the flash with each detent)
      FlashCommit = m;
    } else {
      //just save the new volume
      settings.volume = count;
    }
  }
}

void loop() {
  int m = millis();

  inputLoop(m);
  volumeLoop(m);
  muteHandler(m);
  wifiLoop(m);

  if ((screenTimer > 0) && (m > screenTimer + SCREEN_TIMEOUT)) {
    dimScreen();
  }
  if ((FlashCommit > 0) && (m > FlashCommit + COMMIT_TIMEOUT)) {
      preferences.putBytes("settings", &settings, sizeof(Settings));
      FlashCommit = 0;
  }
  if(shouldReboot) {
    yield();
    delay(1000);
    yield();
    esp_task_wdt_init(1,true);
    esp_task_wdt_add(NULL);
    while(true);
  }
  relays.loop();
}