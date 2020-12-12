#ifndef FALK_WIFI
#define FALK_WIFI

// THIS BLOCK NEEDED FOR WIFI / OTA UPDATES
#include <WiFi.h>
#include "ESPAsyncWebServer.h"
#include <ESPmDNS.h>
#include <Update.h>
#include <SPIFFS.h>
#include "esp_task_wdt.h"
#include "esp_int_wdt.h"
#include "ArduinoJson.h"

#define WIFI_TIMEOUT            300000 // timeout for 5 minutes

class WiFiManager {
  private:
    String translateEncryptionType(wifi_auth_mode_t encryptionType);
    String getNetworks();
    void loadServer();
  public:
    bool begin();
    void loop();
    void enableAP();
    void sendEvent(String event, String value);
    void sendEvent(String event, int value);
};

#endif