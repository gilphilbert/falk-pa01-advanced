#include "display.h"

// THIS BLOCK NEEDED FOR THE DISPLAY
#include <SPI.h>
#include <U8g2lib.h>
// ^^ \libraries\U8g2\src\clib\u8g2.h <-- uncomment #define U8G2_16BIT

// for the display
// this uses the default SPI interface as defined by the manufacturer
// NOTE: for the Adafruit HUZZAH32, use the *labelled pins*, not the standard ones for the ESP32
U8G2_SSD1322_NHD_256X64_F_4W_HW_SPI u8g2(U8G2_R0, SCREEN_CS, SCREEN_DC, SCREEN_RST);
uint32_t screenTimer = 0;

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
void Display::updateScreen(Settings settings, bool muteState) {
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

void Display::wifiScreen(const char* ssid) {
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
}

//called after the timeout elapses, drops screen brightness
void Display::dimScreen() {
  u8g2.setContrast(1);
  screenTimer = 0;
}