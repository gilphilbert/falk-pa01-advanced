#include "falk-pre-conf.h"

DeviceSettings sysSettings;

String fw_version = "0.3.14";

Preferences preferences;
int FlashCommit = 0;

int muteState = 0;

//the following need to be widely available since we need to be able to access them from wifi.cpp
Display display;

// for the volume rotary encoder
ESP32Encoder volEnc;

// for the input rotary encoder
ESP32Encoder inpEnc;

void saveSettings() {
  // create a JSON object for the response
  StaticJsonDocument<800> doc;
  JsonObject settings = doc.to<JsonObject>();

  settings["volume"] = sysSettings.volume;
  settings["input"] = sysSettings.input;
  JsonArray settings_inputs = settings.createNestedArray("inputs");
  for (int i = 0; i < INP_MAX; i++) {
    JsonObject io = settings_inputs.createNestedObject();
    io["name"] = sysSettings.inputs[i].name;
    io["icon"] = sysSettings.inputs[i].icon;
    io["enabled"] = sysSettings.inputs[i].enabled;
  }
  settings["saved"] = sysSettings.saved;
  settings["dim"] = sysSettings.dim;
  settings["maxVol"] = sysSettings.maxVol;
  settings["maxStartVol"] = sysSettings.maxStartVol;
  settings["absoluteVol"] = sysSettings.absoluteVol;
  settings["ssid"] = sysSettings.ssid;
  settings["pass"] = sysSettings.pass;
  settings["hostname"] = sysSettings.hostname;  

  //generate the string
  String retStr;
  serializeJson(settings, retStr);

  //write the settings
  preferences.putString("settingsString", retStr);
}

void restoreSettings() {
  //start preferences
  preferences.begin("falk-pre", false);
  //preferences.clear();

  String str = preferences.getString("settingsString");
  if (str=="") {
    return;
  }
  StaticJsonDocument<800> doc;
  DeserializationError error = deserializeJson(doc, str);
  JsonObject settings = doc.as<JsonObject>();

  if (error) {
    Serial.println("Failed to open settings");
    return;
  }
  sysSettings.volume = settings["volume"];
  sysSettings.input = settings["input"];
  for(int i=0; i<INP_MAX; i++) {
    sysSettings.inputs[i].enabled = settings["inputs"][i]["enabled"];
    sysSettings.inputs[i].name = settings["inputs"][i]["name"].as<String>();
    sysSettings.inputs[i].icon = settings["inputs"][i]["icon"].as<String>();
  }
  sysSettings.saved = settings["saved"];
  sysSettings.dim = settings["dim"];
  sysSettings.maxVol = settings["maxVol"];
  sysSettings.maxStartVol = settings["maxStartVol"];
  sysSettings.absoluteVol = settings["absoluteVol"];
  sysSettings.ssid = settings["ssid"].as<String>();
  sysSettings.pass = settings["pass"].as<String>();
  sysSettings.hostname = settings["hostname"].as<String>();
}