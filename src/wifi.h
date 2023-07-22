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

#define FWIFI_IDLE              0
#define FWIFI_COMMIT            1

void getNetworks();
void loadServer();
void _sendEvent(String event, String value);
void _sendEvent(String event, int value);

class WiFiManager {
  private:
    String translateEncryptionType(wifi_auth_mode_t encryptionType);
    //void loadServer();
    //void WiFiStationConnected(WiFiEvent_t event, WiFiEventInfo_t info);
    //void WiFiGotIP(WiFiEvent_t event, WiFiEventInfo_t info);
    //void WiFiStationDisconnected(WiFiEvent_t event, WiFiEventInfo_t info);

  public:
    void begin();
    void loop();
    bool enableAP();
    void sendEvent(String event, String value);
    void sendEvent(String event, int value);
};

#endif