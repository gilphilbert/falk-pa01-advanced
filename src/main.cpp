/*
TO DO:
* Update UI
* All settings (UI)
* Join local wifi instead of AP
*/
#include <Arduino.h>
#include "ArduinoJson.h"
#include <driver/gpio.h>
#include <Wire.h>

// OTHER INTERNAL CLASSES

// OUR SYSTEM CONFIGURATION
#include "falk-pre-conf.h"

#include "relay-input.h"
InputController input;

#include "relay-volume.h"
VolumeController volume;

#include "wifi-manager.h"
WiFiManager wifi;

// to handle mute state
int muteButtonState;
int lastmuteButtonState = HIGH;
int muteDebounceTime = 0;

// wifi settings
int wifiButtonPressTime = 0;
uint8_t wifibuttonstate = HIGH;

void displayUpdateProgress(int progress, int total) {
  display.firmwareUpdate(progress, total);
}

void spiffsUpdate() {
  const char* fwfile = "/firmware.bin";

  // try to open SPIFFS
  if(!SPIFFS.begin(true)){
    Serial.println("Can't open SPIFFS");
    return;
  }

  // check to see if there's a firmware file
  if(!SPIFFS.exists(fwfile)) {
    Serial.println("No firmware available");
    return;
  }

  // try to open the file
  File file = SPIFFS.open(fwfile);
  if(!file){
    Serial.println("Can't open firmware");
    return;
  }

  // check to see if the update was accurate
  size_t fileSize = file.size();
  Serial.println(fileSize);
  if(!Update.begin(fileSize)){
    Serial.println("Not enough space to update");
    return;
  }

  Update.onProgress(displayUpdateProgress);

  display.firmwareUpdate(0, 0);

  // update the firmware
  Update.writeStream(file);

  // check to see if the update was successful
  if(Update.end()){
    Serial.println("Update complete");
  } else {
    Serial.println("Update failed");
  }
  file.close();

  // remove the firmware we've updated
  delay(200);
  SPIFFS.remove(fwfile);

  // delay seems to help with file removal
  delay(200);

  // restart the MCU
  ESP.restart();
}

void setup(){	
	Serial.begin(9600);
  Serial.setDebugOutput(true);
  Serial.println("Booting...");

  //start the display controller
  display.begin();

  spiffsUpdate();

  //setup the power control elements
  pinMode(POWER_CONTROL, OUTPUT); //this is the power control for the 5V circuit
  digitalWrite(POWER_CONTROL, HIGH); //set it high to power the 5V elements
  pinMode(POWER_BUTTON, INPUT_PULLDOWN); //configure the power button
  esp_sleep_enable_ext0_wakeup(POWER_BUTTON, 1); //let the power button wake the MCU

  delay(250);

  //configure the MCP27013 ICs
  input.begin(INP_MAX);
  volume.begin(VOL_MIN, VOL_MAX);

  //turn everything off, this gives us a chance to correctly set the volume to the max startup volume, if set
  input.set(0);
  delay(5);

  restoreSettings();

  //add some default values if this is our first boot
  if (sysSettings.saved == 0) {
    sysSettings.saved = 1;
    for (int i = 0; i < INP_MAX; i++) {
      sysSettings.inputs[i].name = "Input " + (String)(i+1);
    }
  }

  if (sysSettings.volume > sysSettings.maxStartVol) {
    sysSettings.volume = sysSettings.maxStartVol;
  }

  //use the pullup resistors, this means we can connect ground to the encoders
	ESP32Encoder::useInternalWeakPullResistors=UP;

  //configure the input encoder
  inpEnc.attachSingleEdge(INP_ENCODER_A, INP_ENCODER_B);
  inpEnc.setCount(sysSettings.input);

  //configure the volume encoder
	volEnc.attachFullQuad(VOL_ENCODER_A, VOL_ENCODER_B);
  volEnc.setCount(sysSettings.volume);

  //configure the mute button
  pinMode(MUTE_BUTTON, INPUT);

  //the relays *should* match our stored values (since they're latching) but we can't be sure
  //so we set them to these values so the screen and relays match
  //relays.set(sysSettings.volume);
  volume.set(sysSettings.volume);
  input.set(sysSettings.input);

  //this is the input rotary encoder button. Needed to handle wifi enable
  pinMode(WIFI_BUTTON, INPUT);

  //update the display
  display.updateScreen();

  wifi.begin();
}

void muteLoop(int m) {
  int reading = digitalRead(MUTE_BUTTON);

  if (reading != lastmuteButtonState) {
    muteDebounceTime = m;
  }

  if ((m - muteDebounceTime) > BUTTON_DEBOUNCE_DELAY) {
    if (reading != muteButtonState) {
      muteButtonState = reading;

      if (muteButtonState == LOW) {
        if (muteState == 0) {
          muteState = 1;
          volEnc.setCount(0);
          volEnc.pauseCount();
          //write to the screen
          display.updateScreen();
          wifi.sendEvent("mute", true);
        } else {
          muteState = 0;
          volEnc.resumeCount();
          volEnc.setCount(sysSettings.volume);
          //write to the screen
          display.updateScreen();
          //set the relays
          volume.set(sysSettings.volume);
          wifi.sendEvent("mute", false);
        }
      }
    }
  }
  lastmuteButtonState = reading;
}

void wifiLoop(int m) {
  int reading = digitalRead(WIFI_BUTTON);
  if (reading != wifibuttonstate) {
    if (reading == LOW) {
      wifiButtonPressTime = m;
    } else {
      wifiButtonPressTime = 0;
    }
    wifibuttonstate = reading;
  } else if ((reading == LOW) && (wifiButtonPressTime > 0) && (m > wifiButtonPressTime + BUTTON_LONG_PRESS)) {
    //bool success = wifi.enableAP();
    wifi.enableAP();
    wifiButtonPressTime = 0;
  }
  wifi.loop();
}


void inputLoop(int m) {
  int count = inpEnc.getCount(); //get count from rotary encoder
  if (count != sysSettings.input) { //if it's not our current setting
    if (count > INP_MAX) { //make sure it's not out of bounds (upper, if so, set to min)
      count = INP_MIN;
    } else if (count < INP_MIN) { //make sure it's not out of bounds (lower, if so, set to max)
      count = INP_MAX;
    }
    while (sysSettings.inputs[count - 1].enabled == false) { //is the input enabled? If not...
      count++; //check the next one
      if (count > INP_MAX) { //are we out of bounds? go to the min
        count = INP_MIN;
      }
    }
    inpEnc.setCount(count); //set the encoder (failsafe)
    input.set(count); //set the input
    sysSettings.input = count; //update system settings
    display.updateScreen(); //paint the screen
    //set a delayed commit (this prevents us from wearing out the flash with each detent)
    wifi.sendEvent("input", count);
    FlashCommit = m;
  }
  input.loop();
}

void volumeLoop(int m) {
  if (muteState == 0) {
    //gets the current volume, checks to see if it's changed and sets the new volume
    int count = volEnc.getCount();
    if (count != sysSettings.volume) {
      //if we're outside the limts, override with the limits
      //we don't use VOL_MAX here, because we want to use the user-set limit
      if (count > sysSettings.maxVol) {
        //restore back to the maximum volume
        volEnc.setCount(sysSettings.maxVol);
        count = sysSettings.maxVol;
      } else if (count < VOL_MIN) {
        //restore back to the minimum volume
        volEnc.setCount(VOL_MIN);
        count = VOL_MIN;
      }
      //check again (in case we reset to be inside the limits)
      if (count != sysSettings.volume) {
        //save the new volume, as long as we're not going into mute
        sysSettings.volume = count;
        //write to the screen
        display.updateScreen();
        //set the relays
        volume.set(count);
        wifi.sendEvent("volume", count);
        //set a delayed commit (this prevents us from wearing out the flash with each detent)
        FlashCommit = m;
      } else {
        //just save the new volume
        sysSettings.volume = count;
      }
    }
  }
  volume.loop();
}

int lastPowerButtonState = LOW;
int powerButtonState = LOW;
int powerDebounceTime = 0;
void powerLoop(int m) {
  int reading = digitalRead(POWER_BUTTON);

  if (reading != lastPowerButtonState) {
    powerDebounceTime = m;
  }

  if ((m - powerDebounceTime) > BUTTON_DEBOUNCE_DELAY) {
    if (reading != powerButtonState) {
      powerButtonState = reading;

      if (powerButtonState == HIGH) {
        //need to power down...
        Serial.println("Going into sleep mode...");

        // power off the 5V circuit
        digitalWrite(POWER_CONTROL, LOW);
        // put the display to sleep
        display.off();
        // wait quarter second (helps with debounce, otherwise the MCU wakes again...)
        delay(250);
        // zzzzzzzzzz
        esp_deep_sleep_start();
      }
    }
  }
  lastPowerButtonState = reading;
}

void loop() {
  int m = millis();

  inputLoop(m);
  volumeLoop(m);
  muteLoop(m);
  wifiLoop(m);
  powerLoop(m);

  if ((FlashCommit > 0) && (m > FlashCommit + COMMIT_TIMEOUT)) {
    saveSettings();
    FlashCommit = 0;
  }

  display.loop();
}