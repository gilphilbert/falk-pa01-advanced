/*
To do:
* Input switching (and resetting)
* Wifi hotspot (no need to join wifi) or bluetooth app, perhaps
* Finish documenting
*/
#include <Arduino.h>
#include <ESP32Encoder.h>
#include <driver/gpio.h>
#include <Wire.h>
#include <Preferences.h>
#include <WiFi.h>

// for the display
#include <SPI.h>
#include <U8g2lib.h>
// ^^ \libraries\U8g2\src\clib\u8g2.h <-- uncomment #define U8G2_16BIT

#define COMMIT_TIMEOUT          400

#define BUTTON_DEBOUNCE_DELAY   50
#define RELAY_PULSE             50


//how to find the two MCP23017s
#define MCP_PORTA               0x00
#define MCP_PORTB               0x01
#define MCP_OUTPUT              0x00
#define MCP_INPUT               0x01

#define MCP_PORTA_PINS          0x12
#define MCP_PORTB_PINS          0x13

#define MCP_VOLUME_ADDRESS      0x20
#define MCP_INPUT_ADDRESS       0x21

Preferences preferences;

// for the volume rotary encoder
#define VOL_ENCODER_A           21
#define VOL_ENCODER_B           4
#define VOL_MIN                 0
#define VOL_MAX                 255
ESP32Encoder volEnc;
uint32_t VolumeRelayPulseTime = 0;
uint32_t FlashCommit = 0;

// for the input rotary encoder
#define INP_ENCODER_A           15
#define INP_ENCODER_B           12
#define INP_MIN                 1
#define INP_MAX                 4
ESP32Encoder inpEnc;
uint32_t InputRelayPulseTime = 0;

// to handle mute state
#define MUTE_BUTTON             14
int muteState = 0;
int muteButtonState;
int lastmuteButtonState = HIGH;
unsigned long muteDebounceTime = 0;

typedef struct {
  uint16_t volume = 26;
  uint16_t input = 1;
  String inputNames [INP_MAX];
  uint16_t saved = 0;
  uint8_t dim = 1;
} Settings;
Settings settings;

// for the display
#define SCREEN_CS               13
#define SCREEN_DC               27
#define SCREEN_RST              32
#define SCREEN_TIMEOUT          10000
//this uses the default SPI interface as defined by the manufacturer
//NOTE: for the Adafruit HUZZAH32, use the *labelled pins*, not the standard ones for the ESP32
U8G2_SSD1322_NHD_256X64_F_4W_HW_SPI u8g2(U8G2_R0, SCREEN_CS, SCREEN_DC, SCREEN_RST);
uint32_t screenTimer = 0;

//wifi settings
#define WIFI_BUTTON             33
#define WIFI_TIMEOUT            60000
const char* ssid = "FALK-PRE";
uint32_t wifiConnectTimeout = 0;
uint8_t wifibuttonstate = HIGH;
WiFiServer server(80);


//this really configures the two MCP27103s for the correct input/outputs
void configureRelays() {
  Wire.begin();

  // configure volume
  Wire.beginTransmission(MCP_VOLUME_ADDRESS);  //select the first device (volume relays)
  Wire.write(MCP_PORTA);  //select the "A" bank
  Wire.write(MCP_OUTPUT);  //set to outputs
  Wire.endTransmission();  //kill the connection

  Wire.beginTransmission(MCP_VOLUME_ADDRESS);
  Wire.write(MCP_PORTB);  //select the "B" bank
  Wire.write(MCP_OUTPUT);  //set to outputs
  Wire.endTransmission();  //kill the connection

  // configure inputs
  Wire.beginTransmission(MCP_INPUT_ADDRESS);
  Wire.write(MCP_PORTA);  //select the "A" bank
  Wire.write(MCP_OUTPUT);  //set to outputs

  Wire.endTransmission();  //kill the connection
}

void setInputRelays(uint16_t input) {
  //select the volume GPIOs
  Wire.beginTransmission(MCP_INPUT_ADDRESS);
  //select the "A" bank
  Wire.write(MCP_PORTA);
  Wire.write(11100001); //resets relays 1,2,3 and sets relay 4
}

void setVolumeRelays(uint16_t volume) {
  //select the volume GPIOs
  Wire.beginTransmission(MCP_VOLUME_ADDRESS);
  //select the "A" bank
  Wire.write(MCP_PORTA_PINS);
  //set volume
  Wire.write(volume);
  //kill session
  Wire.endTransmission();
  //select the volume GPIOs
  Wire.beginTransmission(MCP_VOLUME_ADDRESS);
  //select the "A" bank
  Wire.write(MCP_PORTB);
  //set volume
  Wire.write(VOL_MAX - volume);
  //kill session
  Wire.endTransmission();
  VolumeRelayPulseTime = millis();
}

void endVolumePulse() {
  //select the volume GPIOs
  Wire.beginTransmission(MCP_VOLUME_ADDRESS);
  //select the "A" bank
  Wire.write(MCP_PORTA_PINS);
  //set volume
  Wire.write(0);
  //kill session
  Wire.endTransmission();
  //select the volume GPIOs
  Wire.beginTransmission(MCP_VOLUME_ADDRESS);
  //select the "B" bank
  Wire.write(MCP_PORTB);
  //set volume
  Wire.write(0);
  //kill session
  Wire.endTransmission();
  //stop this running again
  VolumeRelayPulseTime = 0;
}

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

void enableWifi() {
  WiFi.softAP(ssid);
  IPAddress IP = WiFi.softAPIP();
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

  wifiConnectTimeout = millis();
}

void setup(){	
	Serial.begin(9600);
  //use the pullup resistors, this means we can connect ground to the encoders
	ESP32Encoder::useInternalWeakPullResistors=UP;

  //configure the MCP27013 ICs
  configureRelays();

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
  inpEnc.attachHalfQuad(INP_ENCODER_A, INP_ENCODER_B);
  inpEnc.setCount(settings.input);

  //configure the volume encoder
	volEnc.attachFullQuad(VOL_ENCODER_A, VOL_ENCODER_B);
  volEnc.setCount(settings.volume);

  //configure the mute button
  pinMode(MUTE_BUTTON, INPUT_PULLUP);

  //the relays *should* match our stored values (since they're latching) but we can't be sure
  //so we set them to these values so the screen and relays match
  setVolumeRelays(settings.volume);
  setInputRelays(settings.input);
  updateScreen();

  //this is the input rotary encoder button. Needed to handle wifi enable
  pinMode(WIFI_BUTTON, INPUT_PULLUP);

  //start the screen object
  u8g2.begin();
}

void inpEncLoop(uint32_t m) {
  uint16_t count = inpEnc.getCount();
  if (count != settings.input) {
    if (count > INP_MAX) {
      count = INP_MIN;
      inpEnc.setCount(INP_MIN);
    } else if (count < INP_MIN) {
      count = INP_MAX;
      inpEnc.setCount(INP_MAX);
    }
    settings.input = count;
    updateScreen();
    //set a delayed commit (this prevents us from wearing out the flash with each detent)
    FlashCommit = m;
  }
}

/*
This function gets the current value from the rotary encoder (via the PM library)
It then checks to see if it's in the correct range and sets it to the min/max if it's outside the boundaries.
We also update the pulse counter since we want to catch the next rotation
Finally, if the value really has changed, we call a function to set the relays, upddate the screen and save the new volume level
*/
void volEncLoop(uint32_t m) {
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
      setVolumeRelays(count);
      //set a delayed commit (this prevents us from wearing out the flash with each detent)
      FlashCommit = m;
    } else {
      //just save the new volume
      settings.volume = count;
    }
  }
  if ((VolumeRelayPulseTime > 0) && (m > VolumeRelayPulseTime + RELAY_PULSE)) {
    endVolumePulse();
  }
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
        } else {
          muteState = 0;
          volEnc.resumeCount();
          updateScreen();
        }
      }
    }
  }
  lastmuteButtonState = reading;
}

void wifiLoop(uint32_t m) {
  int reading = digitalRead(WIFI_BUTTON);
  if (reading != wifibuttonstate) {
    Serial.println(reading);
    if (reading == LOW) {
      enableWifi();
    }
    wifibuttonstate = reading;
  }

  if ((wifiConnectTimeout > 0) && (m > wifiConnectTimeout + WIFI_TIMEOUT)) {
    wifiConnectTimeout = 0;
    WiFi.mode(WIFI_MODE_STA);
    updateScreen();
  }
}

void loop() {
  uint32_t m = millis();

  volEncLoop(m);
  muteHandler(m);
  inpEncLoop(m);
  wifiLoop(m);

  if ((screenTimer > 0) && (m > screenTimer + SCREEN_TIMEOUT)) {
    dimScreen();
  }
  if ((FlashCommit > 0) && (m > FlashCommit + COMMIT_TIMEOUT)) {
      preferences.putBytes("settings", &settings, sizeof(Settings));
      Serial.println("Commited preferences");
      FlashCommit = 0;
  }
}