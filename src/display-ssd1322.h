#ifndef FALK_DISP
#define FALK_DISP

class Display {
  private:
    bool _access_point = false;
    bool _wifi_state = false;
  public:
    void begin();
    void loop();
    void updateScreen();
    void wifiScreen(const char* ssid);
    void dimScreen();
    void off();
    void setDisplay(bool);
    void setAPMode(bool);
    void wifiConnected(bool);
};

#endif