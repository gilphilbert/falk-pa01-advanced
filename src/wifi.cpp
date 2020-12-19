#include "wifi.h"
#include "falk-pre-conf.h"

AsyncWebServer server(80);
AsyncEventSource events("/events");

bool shouldReboot = false;
int wifiConnectTimeout = 0;

const char * temp_ssid;
const char * temp_key;
int tryConnect = 0;
short tryConnectTimeout = 12000;
short curMode = -1;

const char* ssid = "FALK-PA01";

void uploadProgress(int val, int total) {
  display.firmwareUpload(val, total);
}

short WiFiManager::loop() {
  short state = FWIFI_IDLE;
  
  if (shouldReboot) {
      yield();
      delay(1000);
      yield();
      esp_task_wdt_init(1,true);
      esp_task_wdt_add(NULL);
      while(true);
  }
  if (wifiConnectTimeout > 0 && millis() > wifiConnectTimeout) {
    wifiConnectTimeout = 0;
    WiFi.mode(WIFI_MODE_STA);
    display.setAPMode(false);
  }

  if (tryConnect > 0) {
    int status = WiFi.status();
    //if (status != curMode) {
    //  curMode = status;
    //  Serial.println(curMode);
    //}
    if (status == WL_CONNECTED) {
      sendEvent("wireless","success");
      sendEvent("ssid",temp_ssid);
      sysSettings.wifi.ssid = temp_ssid;
      sysSettings.wifi.pass = temp_key;
      tryConnect = 0;
      state = FWIFI_COMMIT;
    } else if (millis() > tryConnect + tryConnectTimeout) {
      //disconnect the STA so AP can stabilize again
      WiFi.disconnect();
      temp_ssid = "";
      temp_ssid = "";
      sendEvent("wireless","failed");
      tryConnect = 0;
    }
    // 0 = WL_IDLE_STATUS
    // 1 = WL_NO_SSID_AVAIL
    // 2 = WL_SCAN_COMPLETED
    // 3 = WL_CONNECTED
    // 4 = WL_CONNECT_FAILED
    // 5 = WL_CONNECTION_LOST
    // 6 = WL_DISCONNECTED
    // 255 = WL_NO_SHIELD
    //}
  }
  return state;
}

bool WiFiManager::begin() {
  //static hostname for now, we'll make this editable later
  WiFi.setHostname('falk-pa01');

  if(sysSettings.wifi.ssid == "" || sysSettings.wifi.pass == "") {
    return false;
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(sysSettings.wifi.ssid.c_str(), sysSettings.wifi.pass.c_str());

  Serial.print("Connecting to Wifi");
  int now = millis();
  bool kill = false;
  while (WiFi.isConnected() == false && kill == false) {
    Serial.print(".");
    delay(50);
    if (millis() + 10000 > now) {
      kill = true;
    }
  }
  Serial.println();
  MDNS.begin(HOSTNAME);

  if (kill == true) {
    Serial.println("Couldn't connect to Wifi");
    return false;
  }

  WiFiManager::loadServer();

  return true;
}

void WiFiManager::enableAP() {
  WiFi.mode(WIFI_AP_STA);
  WiFi.disconnect();
  //WiFi.enableSTA(false);
  //WiFi.mode(WIFI_AP);
  WiFi.softAP(ssid);
  IPAddress IP = WiFi.softAPIP();
  MDNS.begin(HOSTNAME);

  Serial.print("AP IP address: ");
  Serial.println(IP);

  display.setAPMode(true);
  display.wifiScreen(ssid);

  WiFiManager::loadServer();

  wifiConnectTimeout = millis() + WIFI_TIMEOUT;
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

String WiFiManager::getNetworks() {
  int numberOfNetworks = WiFi.scanNetworks();
 
  StaticJsonDocument<4000> doc;
  JsonArray retArr = doc.to<JsonArray>();

  for (int i = 0; i < numberOfNetworks; i++) {
    JsonObject obj = retArr.createNestedObject();
    obj["ssid"] = WiFi.SSID(i);
    obj["signal"] = WiFi.RSSI(i);
    obj["mac"] = WiFi.BSSIDstr(i);
    obj["security"] = translateEncryptionType(WiFi.encryptionType(i));
  }
  //generate the string
  String retStr;
  serializeJson(retArr, retStr);
  return retStr;
}

void extendTimeout() {
  if (wifiConnectTimeout > 0) {
    wifiConnectTimeout = millis() + WIFI_TIMEOUT;
  }
}

void WiFiManager::loadServer() {
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
    setObj["wifi_ssid"] = sysSettings.wifi.ssid;
    
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
    JsonObject retObj = doc.to<JsonObject>();

    retObj["max"] = VOL_MAX;
    retObj["current"] = vol;

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

  server.on("/api/networks", HTTP_GET, [&](AsyncWebServerRequest *request){
    extendTimeout();

    String networks = WiFiManager::getNetworks();
    return request->send(200, "application/json", networks);
  });

  server.on("/api/setWireless", HTTP_POST, [](AsyncWebServerRequest *request){
    extendTimeout();

    // handle the instance where no data is provided
  }, NULL, [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total){
    extendTimeout();

    StaticJsonDocument<200> doc;
    deserializeJson(doc, (const char*) data);
    temp_ssid = doc["ssid"];
    temp_key = doc["key"];

    //events.close();
    //server.end();
    Serial.println(temp_ssid);
    Serial.println(temp_key);

    WiFi.begin(temp_ssid, temp_key);
    tryConnect = millis();

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
    display.firmwareUpload(0, 0);

    Update.onProgress(uploadProgress);

    if(!index){
      Serial.printf("Update Start: %s\n", filename.c_str());
      if (filename != "spiffs.bin" && filename != "spiffs.bin.gz" && filename != "firmware.bin") {
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
  //server.serveStatic("/", SPIFFS, "/www/").setDefaultFile("index.html");

  server.begin();
}

/* event stuff */

void WiFiManager::sendEvent(String event, String value) {    // create a JSON object for the response
  StaticJsonDocument<200> doc;
  JsonObject retObj = doc.to<JsonObject>();
  retObj[event] = value;
  String retStr;
  serializeJson(retObj, retStr);
  events.send(retStr.c_str(),"message",millis());
}

void WiFiManager::sendEvent(String event, int value) {
  StaticJsonDocument<200> doc;
  JsonObject retObj = doc.to<JsonObject>();
  retObj[event] = value;
  String retStr;
  serializeJson(retObj, retStr);
  events.send(retStr.c_str(),"message",millis());
}