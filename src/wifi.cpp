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
    StaticJsonDocument<200> doc;
    JsonObject retObj = doc.to<JsonObject>();

    //generate the volume object
    JsonObject volObj = retObj.createNestedObject("volume");
    volObj["max"] = VOL_MAX;
    volObj["current"] = sysSettings.volume;
    
    //generate the inputs object
    JsonObject inpObj = retObj.createNestedObject("inputs");
    inpObj["selected"] = sysSettings.input;
    JsonArray inpList = inpObj.createNestedArray("list");
    for (int i = 0; i < INP_MAX; i++) {
      inpList.add(sysSettings.inputNames[i]);
    }
    //things to return:
    // settings?

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
  
  server.on("/update", HTTP_POST, [&](AsyncWebServerRequest *request){
    shouldReboot = !Update.hasError();
    AsyncWebServerResponse *response = request->beginResponse(200, "text/plain", shouldReboot?"OK":"FAIL");
    response->addHeader("Connection", "close");
    request->send(response);
  },[&](AsyncWebServerRequest *request, String filename, size_t index, uint8_t *data, size_t len, bool final){
    if(!index){
      Serial.printf("Update Start: %s\n", filename.c_str());
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
  WiFi.softAP(ssid);
  IPAddress IP = WiFi.softAPIP();
  MDNS.begin(HOSTNAME);

  Serial.print("AP IP address: ");
  Serial.println(IP);

  display.wifiScreen(ssid);

  WiFiManager::begin();

  //wifiConnectTimeout = millis();
}