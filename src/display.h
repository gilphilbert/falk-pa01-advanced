#include "falk-pre-conf.h"

class Display {
  public:
    void begin();
    void loop();
    void updateScreen(Settings settings, bool muteState);
    void wifiScreen(const char* ssid);
    void dimScreen();
};