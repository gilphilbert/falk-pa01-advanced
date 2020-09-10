#include "wifi.h"
#include "falk-pre-conf.h"

AsyncWebServer server(80);
bool shouldReboot = false;

const char* ssid = "FALK-PA01";

void WiFiManager::begin() {
  if(!SPIFFS.begin(true)) {
    Serial.println("An Error has occurred while mounting SPIFFS");
    return;
  }

  // API CONTENT
  server.on("/api/status", HTTP_GET, [&](AsyncWebServerRequest *request){
    // create a JSON object for the response
    StaticJsonDocument<800> doc;
    JsonObject retObj = doc.to<JsonObject>();

    //generate the volume object
    JsonObject volObj = retObj.createNestedObject("volume");
    volObj["max"] = VOL_MAX;
    volObj["current"] = sysSettings.volume;
    
    //generate the inputs object
    JsonObject inpObj = retObj.createNestedObject("inputs");
    inpObj["selected"] = sysSettings.input - 1;
    JsonArray inpList = inpObj.createNestedArray("list");
    for (int i = 0; i < INP_MAX; i++) {
      if (sysSettings.inputs[i].enabled == 1) {
        JsonObject io = inpList.createNestedObject();
        io["id"] = i + 1;
        io["name"] = sysSettings.inputs[i].name;
        io["icon"] = sysSettings.inputs[i].icon;
      }
    }

    //generate the string
    String retStr;
    serializeJson(retObj, retStr);
    //return the request
    return request->send(200, "application/json", retStr);
  });
  
  server.on("/api/volume", HTTP_GET, [&](AsyncWebServerRequest *request){
    // create a JSON object for the response
    StaticJsonDocument<200> doc;
    JsonObject retObj = doc.to<JsonObject>();

    // write the volume variables
    retObj["max"] = VOL_MAX;
    retObj["current"] = sysSettings.volume;

    //generate the string
    String retStr;
    serializeJson(retObj, retStr);
    return request->send(200, "application/json", retStr);
  });
  
  server.on("/api/volume", HTTP_POST, [](AsyncWebServerRequest *request){
    // handle the instance where no data is provided
  }, NULL, [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total){
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

  server.on("/api/inputs", HTTP_GET, [&](AsyncWebServerRequest *request){
    // create a JSON object for the response
    StaticJsonDocument<800> doc;
    JsonObject retObj = doc.to<JsonObject>();

    //generate the inputs object
    JsonArray inpList = retObj.createNestedArray("list");
    for (int i = 0; i < INP_MAX; i++) {
      JsonObject io = inpList.createNestedObject();
      io["id"] = i + 1;
      io["name"] = sysSettings.inputs[i].name;
      io["icon"] = sysSettings.inputs[i].icon;
      io["enabled"] = sysSettings.inputs[i].enabled;
    }

    //generate the string
    String retStr;
    serializeJson(retObj, retStr);
    //return the request
    return request->send(200, "application/json", retStr);
  });
  server.on("/api/input", HTTP_POST, [](AsyncWebServerRequest *request){
    // handle the instance where no data is provided
  }, NULL, [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total){
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
    // handle the instance where no data is provided
  }, NULL, [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total){
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

  server.on("/api/firmware", HTTP_GET, [&](AsyncWebServerRequest *request){
    File appFile = SPIFFS.open("/version", "r");
    String app_version = appFile.readString();
    app_version = app_version.substring(0, app_version.length() -1);
    
    // create a JSON object for the response
    StaticJsonDocument<200> doc;
    JsonObject retObj = doc.to<JsonObject>();
    retObj["fw"] = fw_version;
    retObj["app"] = app_version;

    //generate the string
    String retStr;
    serializeJson(retObj, retStr);
    return request->send(200, "application/json", retStr);
  });

  server.on("/api/networks", HTTP_GET, [&](AsyncWebServerRequest *request){
    String networks = WiFiManager::getNetworks();
    return request->send(200, "application/json", networks);
  });
  
  server.on("/update", HTTP_POST, [&](AsyncWebServerRequest *request){
    shouldReboot = !Update.hasError();
    AsyncWebServerResponse *response = request->beginResponse(200, "text/plain", shouldReboot?"OK":"FAIL");
    response->addHeader("Connection", "close");
    request->send(response);
  },[&](AsyncWebServerRequest *request, String filename, size_t index, uint8_t *data, size_t len, bool final){
    if(!index){
      Serial.printf("Update Start: %s\n", filename.c_str());
      if (filename != "spiffs.bin" && filename != "firmware.bin") {
        return request->send(200, "text/plain", "Invalid firmware");
      }
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


  //server.serveStatic("/", SPIFFS, "/www/").setCacheControl("max-age=86400").setDefaultFile("index.html");
  server.serveStatic("/", SPIFFS, "/www/").setDefaultFile("index.html");

  server.begin();
}

void WiFiManager::loop() {
    if(shouldReboot) {
        yield();
        delay(1000);
        yield();
        esp_task_wdt_init(1,true);
        esp_task_wdt_add(NULL);
        while(true);
    }
}

void WiFiManager::enable() {
  WiFi.mode(WIFI_AP_STA);
  WiFi.enableSTA(false);
  WiFi.mode(WIFI_AP);
  WiFi.softAP(ssid);
  IPAddress IP = WiFi.softAPIP();
  MDNS.begin(HOSTNAME);

  Serial.print("AP IP address: ");
  Serial.println(IP);

  display.wifiScreen(ssid);

  WiFiManager::begin();

  //wifiConnectTimeout = millis();
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
 
  //Serial.print("Number of networks found: ");
  //Serial.println(numberOfNetworks);
  StaticJsonDocument<4000> doc;
  JsonArray retArr = doc.to<JsonArray>();

  for (int i = 0; i < numberOfNetworks; i++) {
    JsonObject obj = retArr.createNestedObject();
    //Serial.print("Network name: ");
    //Serial.println(WiFi.SSID(i));
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
