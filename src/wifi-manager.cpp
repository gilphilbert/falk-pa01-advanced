#include "wifi-manager.h"
#include "falk-pre-conf.h"

#include <Preferences.h>
Preferences pref;

AsyncWebServer server(80);
AsyncEventSource events("/events");

bool shouldReboot = false;
int wifiConnectTimeout = 0;

String temp_ssid;
String temp_key;

bool scanning = false;

bool disconnected = false;

const char* ap_ssid = "FALK-PA01";

/* wrapper to pass Update.onProgress to the display */
void uploadProgress(int val, int total) {
  display.firmwareUpload(val, total);
}

/* loop detects reboot needs, implements the AP timeout and detects whether we're connected during setup */
void WiFiManager::loop() {
  int status = WiFi.status();

  // if we're trying to reconnect and it's failed, try again
  if (disconnected && status == WL_CONNECT_FAILED) {
    WiFi.reconnect();
  }
  
  // if we need to reboot as part of an update, do it now
  if (shouldReboot) {
      yield();
      delay(1000);
      yield();
      esp_task_wdt_init(1, true);
      esp_task_wdt_add(NULL);
      while(true);
  }

  // this detects whether anyone is connected to the access point (in AP mode)
  if (wifiConnectTimeout > 0 && millis() > wifiConnectTimeout) {
    wifiConnectTimeout = 0;
    WiFi.mode(WIFI_MODE_STA);
    display.setAPMode(false);
  }
}

void WiFiStationConnected(WiFiEvent_t event, WiFiEventInfo_t info){
  Serial.println("Connected to AP successfully!");
}

void WiFiGotIP(WiFiEvent_t event, WiFiEventInfo_t info){
  Serial.print("WiFi connected: ");
  Serial.println(WiFi.localIP());

  StaticJsonDocument<800> doc;
  JsonObject retObj = doc.to<JsonObject>();
  retObj["status"] = true;
  retObj["ssid"] = temp_ssid;
  retObj["ipaddr"] = WiFi.localIP().toString();
  String retStr;
  serializeJson(retObj, retStr);
  _sendEvent("wireless", retStr);

  MDNS.begin(sysSettings.hostname.c_str());
  loadServer();
  disconnected = false;

  display.wifiConnected(true);

  if (temp_ssid != "") {
    sysSettings.ssid = temp_ssid;
    sysSettings.pass = temp_key;
    temp_ssid = "";
    temp_key = "";
    saveSettings();
    WiFi.softAPdisconnect();
    display.setAPMode(false);
  }
}

void WiFiStationDisconnected(WiFiEvent_t event, WiFiEventInfo_t info){
  if (info.wifi_sta_disconnected.reason == 202) {
    Serial.println("Incorrect password");

    _sendEvent("wireless", "{\"status\":\"false\"}");

    //disconnect the STA so AP can stabilize again
    WiFi.disconnect();
    temp_ssid = "";
    temp_ssid = "";
  }

  display.wifiConnected(false);

  Serial.println("Disconnected from WiFi access point. Reason:");
  Serial.println(info.wifi_sta_disconnected.reason);
  Serial.println("Trying to Reconnect");
  disconnected = true;
  WiFi.reconnect();
}

void ScanDone(WiFiEvent_t event, WiFiEventInfo_t info){
  getNetworks();
}

void WiFiManager::begin() {
  WiFi.setHostname(sysSettings.hostname.c_str());

  //setup our events
  WiFi.onEvent(WiFiStationConnected, WiFiEvent_t::ARDUINO_EVENT_WIFI_STA_CONNECTED);
  WiFi.onEvent(WiFiGotIP, WiFiEvent_t::ARDUINO_EVENT_WIFI_STA_GOT_IP);
  WiFi.onEvent(WiFiStationDisconnected, WiFiEvent_t::ARDUINO_EVENT_WIFI_STA_DISCONNECTED);
  WiFi.onEvent(ScanDone, WiFiEvent_t::ARDUINO_EVENT_WIFI_SCAN_DONE);

  Serial.print("Attempting to connect to wifi network: ");
  Serial.println(sysSettings.ssid);
  if(sysSettings.ssid == "" || sysSettings.pass == "") {
    return;
  }

  disconnected = true;

  WiFi.mode(WIFI_STA);
  WiFi.begin(sysSettings.ssid.c_str(), sysSettings.pass.c_str());
  Serial.println("Connecting to WiFi");
}

bool WiFiManager::enableAP() {
  WiFi.mode(WIFI_AP_STA);
  WiFi.disconnect();
  WiFi.softAP(ap_ssid);
  IPAddress IP = WiFi.softAPIP();
  MDNS.begin(sysSettings.hostname.c_str());

  Serial.print("AP IP address: ");
  Serial.println(IP);

  display.setAPMode(true);
  display.wifiScreen(ap_ssid);

  loadServer();

  wifiConnectTimeout = millis() + WIFI_TIMEOUT;

  return true;
}

String WiFiManager::translateEncryptionType(wifi_auth_mode_t encryptionType) {
  String encType = "Unknown";
  switch (encryptionType) {
    case (WIFI_AUTH_OPEN):
      encType = "OPEN";
    case (WIFI_AUTH_WEP):
      encType = "WEP";
    case (WIFI_AUTH_WPA_PSK):
      encType = "WPA_PSK";
    case (WIFI_AUTH_WPA2_PSK):
      encType = "WPA2_PSK";
    case (WIFI_AUTH_WPA_WPA2_PSK):
      encType = "WPA_WPA2_PSK";
    case (WIFI_AUTH_WPA2_ENTERPRISE):
      encType = "WPA2_ENTERPRISE";
    case (WIFI_AUTH_MAX):
      encType = "MAX";
  }
  return encType;
}

void getNetworks() {
  int numberOfNetworks = WiFi.scanComplete();
  if(numberOfNetworks == -2){
    Serial.println("No networks yet...");
    WiFi.scanNetworks(true);
    return;
  }

  scanning = false;

  String json = "[";
  for (int i = 0; i < numberOfNetworks; i++) {
    if(i) json += ",";
    json += "{";
    json += "\"ssid\":\""+WiFi.SSID(i)+"\"";
    json += ",\"signal\":"+String(WiFi.RSSI(i));
    json += ",\"mac\":\""+WiFi.BSSIDstr(i)+"\"";
    json += ",\"security\":"+String(WiFi.encryptionType(i));
    json += "}";
  }
  json += "]";

  WiFi.scanDelete();

  //generate the string
  events.send(json.c_str(), "scan");
}

void extendTimeout() {
  if (wifiConnectTimeout > 0) {
    wifiConnectTimeout = millis() + WIFI_TIMEOUT;
  }
}

void loadServer() {
  if(!SPIFFS.begin(true)) {
    Serial.println("An Error has occurred while mounting SPIFFS");
    return;
  }

  // API CONTENT
  server.on("/api/status", HTTP_GET, [&](AsyncWebServerRequest *request){
    extendTimeout();

    // create a JSON object for the response
    StaticJsonDocument<800> doc;
    JsonObject retObj = doc.to<JsonObject>();

    retObj["ipaddr"] = "";

    //generate the volume object
    JsonObject volObj = retObj.createNestedObject("volume");
    volObj["current"] = sysSettings.volume;
    volObj["max"] = VOL_MAX;
    volObj["maxAllowedVol"] = sysSettings.maxVol;
    volObj["maxStartVol"] = sysSettings.maxStartVol;
    
    JsonArray inpList = retObj.createNestedArray("inputs");
    for (int i = 0; i < INP_MAX; i++) {
      JsonObject io = inpList.createNestedObject();
      io["id"] = i + 1;
      io["name"] = sysSettings.inputs[i].name;
      io["icon"] = sysSettings.inputs[i].icon;
      io["selected"] = (sysSettings.input == i + 1) ? true : false;
      io["enabled"] = sysSettings.inputs[i].enabled;
    }

    //generate the inputs object
    JsonObject setObj = retObj.createNestedObject("settings");
    setObj["dim"] = sysSettings.dim;
    setObj["absoluteVol"] = sysSettings.absoluteVol;
    setObj["wifi_ssid"] = sysSettings.ssid;
    
    JsonObject fwObj = retObj.createNestedObject("firmware");
    fwObj["fw"] = fw_version;

    //generate the string
    String retStr;
    serializeJson(retObj, retStr);
    //return the request
    return request->send(200, "application/json", retStr);
  });
  
  server.on("/api/volume", HTTP_POST, [](AsyncWebServerRequest *request){
    extendTimeout();
    // handle the instance where no data is provided
  }, NULL, [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total){
    extendTimeout();

    StaticJsonDocument<200> doc;
    deserializeJson(doc, (const char*) data);

    int vol = sysSettings.volume;
    if (doc.containsKey("volume")) {
      vol = doc["volume"].as<int>();
      volEnc.setCount(vol);
    }
    // create a JSON object for the response
    doc.clear();
    
    //generate the string
    String retStr;
    serializeJson(doc, retStr);
    return request->send(200, "application/json", retStr);
  });

  server.on("/api/input", HTTP_POST, [](AsyncWebServerRequest *request){
    extendTimeout();

    // handle the instance where no data is provided
  }, NULL, [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total){
    extendTimeout();

    StaticJsonDocument<200> doc;
    deserializeJson(doc, (const char*) data);

    int inp = sysSettings.input;
    if (doc.containsKey("input")) {
      inp = doc["input"].as<int>();
      inpEnc.setCount(inp);
    }
    // create a JSON object for the response
    doc.clear();
    JsonObject retObj = doc.to<JsonObject>();

    retObj["selected"] = inp;

    //generate the string
    String retStr;
    serializeJson(doc, retStr);
    return request->send(200, "application/json", retStr);
  });
  server.on("/api/input", HTTP_PUT, [](AsyncWebServerRequest *request){
    extendTimeout();

    // handle the instance where no data is provided
  }, NULL, [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total){
    extendTimeout();

    StaticJsonDocument<200> doc;
    deserializeJson(doc, (const char*) data);

    StaticJsonDocument<200> retDoc;
    JsonObject retObj = retDoc.to<JsonObject>();

    if (doc.containsKey("input")) {
      int inp = doc["input"].as<int>();
      inp = inp - 1; // we use zero indexing, but the api uses 1 indexing
      if (inp >= (INP_MIN - 1) && inp < INP_MAX) {
        if(doc.containsKey("name")) {
          sysSettings.inputs[inp].name = doc["name"].as<String>();
        }
        if(doc.containsKey("icon")) {
          sysSettings.inputs[inp].icon = doc["icon"].as<String>();
        }
        if(doc.containsKey("enabled")) {
          sysSettings.inputs[inp].enabled = doc["enabled"].as<int>();
        }
        FlashCommit = millis();
        retObj["id"] = inp;
        retObj["name"] = sysSettings.inputs[inp].name;
        retObj["icon"] = sysSettings.inputs[inp].icon;
        retObj["enabled"] = sysSettings.inputs[inp].enabled;
        retObj["status"] = "ok";
      } else {
        retObj["status"] = "fail";
        retObj["message"] = "out of range (" + doc["input"].as<String>() + ")";
      }
    } else {
      retObj["status"] = "fail";
      retObj["message"] = "no input supplied";
    }
    //generate the string
    String retStr;
    serializeJson(retDoc, retStr);
    return request->send(200, "application/json", retStr);
  });

  server.on("/api/settings/dim", HTTP_POST, [](AsyncWebServerRequest *request){
    extendTimeout();

    // handle the instance where no data is provided
  }, NULL, [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total){
    extendTimeout();

    StaticJsonDocument<200> doc;
    deserializeJson(doc, (const char*) data);

    if (doc.containsKey("state")) {
      sysSettings.dim = doc["state"];
      doc.clear();
      doc["state"] = "success";
    } else {
      doc.clear();
      doc["state"] = "failed";
      doc["message"] = "data missing: state";
    }

    display.updateScreen();

    //generate the string
    String retStr;
    serializeJson(doc, retStr);
    return request->send(200, "application/json", retStr);
  });

  server.on("/api/settings/absoluteVol", HTTP_POST, [](AsyncWebServerRequest *request){
    extendTimeout();

    // handle the instance where no data is provided
  }, NULL, [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total){
    extendTimeout();

    StaticJsonDocument<200> doc;
    deserializeJson(doc, (const char*) data);

    if (doc.containsKey("state")) {
      sysSettings.absoluteVol = doc["state"];
      doc.clear();
      doc["state"] = "success";
    } else {
      doc.clear();
      doc["state"] = "failed";
      doc["message"] = "data missing: state";
    }

    display.updateScreen();

    //generate the string
    String retStr;
    serializeJson(doc, retStr);
    return request->send(200, "application/json", retStr);
  });

  server.on("/api/settings/maxVol", HTTP_POST, [](AsyncWebServerRequest *request){
    extendTimeout();

    // handle the instance where no data is provided
  }, NULL, [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total){
    extendTimeout();
    bool success = false;
    String message = "";

    StaticJsonDocument<200> doc;
    deserializeJson(doc, (const char*) data);

    if (doc.containsKey("value")) {
      int v = doc["value"];
      if (v > 0 && v <= VOL_MAX) {
        sysSettings.maxVol = v;
        success = true;
        if (sysSettings.volume > v) {
          sysSettings.volume = v;
          volEnc.count = v;
          //display.updateScreen();
        }
      } else {
        message = "invalid: value";
      }
    } else {
      message = "missing: value";
    }
    doc.clear();
    doc["state"] = success;
    doc["message"] = message;

    //generate the string
    String retStr;
    serializeJson(doc, retStr);
    return request->send(200, "application/json", retStr);
  });

  server.on("/api/settings/maxStartupVol", HTTP_POST, [](AsyncWebServerRequest *request){
    extendTimeout();

    // handle the instance where no data is provided
  }, NULL, [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total){
    extendTimeout();
    bool success = false;
    String message = "";

    StaticJsonDocument<200> doc;
    deserializeJson(doc, (const char*) data);

    if (doc.containsKey("value")) {
      int v = doc["value"];
      if (v > 0 && v <= VOL_MAX) {
        sysSettings.maxStartVol = v;
        success = true;
      } else {
        message = "invalid: value";
      }
    } else {
      message = "missing: value";
    }
    doc.clear();
    doc["state"] = success;
    doc["message"] = message;

    //generate the string
    String retStr;
    serializeJson(doc, retStr);
    return request->send(200, "application/json", retStr);
  });

  server.on("/api/networks", HTTP_GET, [&](AsyncWebServerRequest *request){
    extendTimeout();

    WiFi.scanNetworks();
    scanning = true;
    Serial.println("Start scanning...");
    return request->send(200, "application/json", "");

  });

  server.on("/api/setWireless", HTTP_POST, [](AsyncWebServerRequest *request){
    extendTimeout();

    // handle the instance where no data is provided
  }, NULL, [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total){
    extendTimeout();

    StaticJsonDocument<200> doc;
    deserializeJson(doc, (const char*) data);
    JsonObject obj = doc.as<JsonObject>();

    temp_ssid = obj["ssid"].as<String>();
    temp_key = obj["key"].as<String>();

    WiFi.begin(temp_ssid.c_str(), temp_key.c_str());

    //no response from this function
    String retStr = "{}";
    return request->send(200, "application/json", retStr);
  });

  server.on("/api/factoryReset", HTTP_POST, [](AsyncWebServerRequest *request){
    extendTimeout();
    // handle the instance where no data is provided
  }, NULL, [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total){
    extendTimeout();

    StaticJsonDocument<200> doc;
    deserializeJson(doc, (const char*) data);
    bool check = doc["check"];

    if (check == true) {
      pref.begin("falk-pre", false);
      pref.clear();
      ESP.restart();
      //clear the preferences, probably need to send a message back to main via the loop
      //todo
    }

    //no response from this function
    String retStr = "{}";
    return request->send(200, "application/json", retStr);
  });
  
  server.on("/update", HTTP_POST, [&](AsyncWebServerRequest *request){
    extendTimeout();

    shouldReboot = !Update.hasError();
    AsyncWebServerResponse *response = request->beginResponse(200, "text/plain", shouldReboot?"OK":"FAIL");
    response->addHeader("Connection", "close");
    request->send(response);
  },[&](AsyncWebServerRequest *request, String filename, size_t index, uint8_t *data, size_t len, bool final){
    extendTimeout();

    Update.onProgress(uploadProgress);

    if(!index){
      Serial.printf("Update Start: %s\n", filename.c_str());
      if (filename != "spiffs.bin" && filename != "firmware.bin") {
        return request->send(200, "text/plain", "Invalid firmware");
      }
      int cmd = (filename == "spiffs.bin" || filename == "spiffs.bin.gz") ? U_SPIFFS : U_FLASH;
      if(!Update.begin(UPDATE_SIZE_UNKNOWN, cmd)){
        Update.printError(Serial);
        return request->send(200, "text/plain", "OTA could not begin");
      }
    }
    //switch off power to peripherals
    inpEnc.pauseCount();
    volEnc.pauseCount();
    digitalWrite(POWER_CONTROL, LOW);

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

  server.addHandler(&events);

  server.serveStatic("/", SPIFFS, "/www/").setCacheControl("max-age=86400").setDefaultFile("index.html");

  server.begin();
}

/* event stuff */
void WiFiManager::sendEvent(String event, String value) {
  _sendEvent(event, value);
}

void WiFiManager::sendEvent(String event, int value) {
  _sendEvent(event, value);
}

void _sendEvent(String event, String value) {    // create a JSON object for the response
  StaticJsonDocument<200> doc;
  JsonObject retObj = doc.to<JsonObject>();
  retObj[event] = value;
  String retStr;
  serializeJson(retObj, retStr);
  events.send(retStr.c_str(),"message",millis());
}

void _sendEvent(String event, int value) {
  StaticJsonDocument<200> doc;
  JsonObject retObj = doc.to<JsonObject>();
  retObj[event] = value;
  String retStr;
  serializeJson(retObj, retStr);
  events.send(retStr.c_str(),"message",millis());
}