#include "display-ssd1322.h"

#include "falk-pre-conf.h"

// THIS BLOCK NEEDED FOR THE DISPLAY
#include <SPI.h>
#include "U8g2lib.h"
// ^^ \libraries\U8g2\src\clib\u8g2.h <-- uncomment #define U8G2_16BIT


#include "rubik.h"

// for the display
// this uses the default SPI interface as defined by the manufacturer
// NOTE: for the Adafruit HUZZAH32, use the *labelled pins*, not the standard ones for the ESP32
U8G2_SSD1322_NHD_256X64_F_4W_HW_SPI u8g2(U8G2_R2, SCREEN_CS, SCREEN_DC, SCREEN_RST);
uint32_t screenTimer = 0;

#define SCREEN_HEIGHT 64
#define SCREEN_WIDTH 256

void Display::begin() {
//start the screen object
  u8g2.begin();
}

void Display::loop() {
  if ((screenTimer > 0) && (millis() > screenTimer + SCREEN_TIMEOUT)) {
    Display::dimScreen();
  }
}

//function that puts the input and volume on the screen
void Display::updateScreen() {
  char volume [5];
  if ((muteState == 0) && sysSettings.volume > 0) {
    uint16_t v;
    if (sysSettings.absoluteVol == false) {
      v = round(((float)sysSettings.volume / (float)VOL_MAX) * 100);
      itoa(v, volume, 10);
      strcat(volume, "%");
    } else {
      v = sysSettings.volume;
      itoa(v, volume, 10);
    }
  } else {
    String s = "MUTE";
    strcpy(volume, s.c_str());
  }
  u8g2.clearBuffer();					// clear the internal memory

  //u8g2.setFont(u8g2_font_fub25_tf);
  //u8g2.setFont(u8g2_font_logisoso22_tf);
  u8g2.setFont(rubik_medium_26);

  //vertically centers the text
  uint16_t y = 40;
  //left starting position for the volume (so it's right-aligned)
  uint16_t x = SCREEN_WIDTH - u8g2.getStrWidth(volume);

  u8g2.drawStr(0, y, sysSettings.inputs[sysSettings.input - 1].name.c_str());
  u8g2.drawStr(x, y, volume);

  u8g2.setFont(u8g2_font_crox1h_tr);
  x = SCREEN_WIDTH - u8g2.getStrWidth("VOLUME");
  u8g2.drawStr(0, SCREEN_HEIGHT, "INPUT");
  u8g2.drawStr(x, SCREEN_HEIGHT, "VOLUME");
  

  //include an icon for the wifi access point / wifi_connected
  if (_access_point == true) { 
    u8g2.setFont(u8g2_font_open_iconic_www_1x_t);
    u8g2.drawGlyph(124,62,0x48);
  }

  //max brightness
  u8g2.setContrast(255);
  //write data to screen
  u8g2.sendBuffer();
  //dim the display in 10s
  if (sysSettings.dim == 1) {
    screenTimer = millis();
  }
}

void Display::wifiScreen(const char* ssid) {
  u8g2.clearBuffer();					// clear the internal memory

  u8g2.setFont(u8g2_font_open_iconic_www_2x_t);
  u8g2.drawGlyph(120,19,0x48);

  u8g2.setFont(u8g2_font_crox1h_tr);
  String string = "Search for this WiFi network";
  const char* str = string.c_str();
  uint16_t x = 128 - (u8g2.getStrWidth(str) / 2);
  uint16_t y = 45;
  u8g2.drawStr(x, y, str);

  //u8g2.setFont(u8g2_font_Born2bSportyV2_tr);
  x = 128 - (u8g2.getStrWidth(ssid) / 2);
  y = SCREEN_HEIGHT;
  u8g2.drawStr(x, y, ssid);

  u8g2.setContrast(255);
  u8g2.sendBuffer();
}

void Display::firmwareUpdate(int val, int total) {
  u8g2.clearBuffer();

  u8g2.setFont(u8g2_font_crox2h_tr);
  String string = "Updating firmware";
  uint16_t x = 128 - (u8g2.getStrWidth(string.c_str()) / 2);
  u8g2.drawStr(x, 14, string.c_str());

  u8g2.drawFrame(80, 28, 96, 12);
  if (val > 0) {
    short w = round(((float)val / (float)total) * 96);
    u8g2.drawBox(80, 28, w, 12);
  }

  u8g2.setFont(u8g2_font_crox1h_tr);
  string = "Do not power off";
  x = 128 - (u8g2.getStrWidth(string.c_str()) / 2);
  u8g2.drawStr(x, SCREEN_HEIGHT - 5, string.c_str());

  u8g2.setContrast(255);
  u8g2.sendBuffer();
}

void Display::firmwareUpload(int val, int total) {
  u8g2.clearBuffer();					// clear the internal memory

  u8g2.setFont(u8g2_font_crox1h_tr);
  String string = "Downloading Firmware";
  uint16_t x = 128 - (u8g2.getStrWidth(string.c_str()) / 2);
  u8g2.drawStr(x, 14, string.c_str());

  u8g2.drawFrame(80, 28, 96, 12);
  if (val > 0) {
    short w = round(((float)val / (float)total) * 96);
    u8g2.drawBox(80, 28, w, 12);
  }

  string = "Do not power off";
  x = 128 - (u8g2.getStrWidth(string.c_str()) / 2);
  u8g2.drawStr(x, SCREEN_HEIGHT, string.c_str());

  u8g2.setContrast(255);
  u8g2.sendBuffer();
}

//called after the timeout elapses, drops screen brightness
void Display::dimScreen() {
  u8g2.setContrast(1);
  screenTimer = 0;
}

void Display::off() {
  u8g2.setPowerSave(1);
}

void Display::setAPMode(bool mode) {
  _access_point = mode;
  if (mode == false) {
    Display::updateScreen();
  }
}

void Display::wifiConnected(bool state) {
  _wifi_state = state;
}