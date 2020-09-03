/*
TO DO:
* Update UI
* All settings (UI)
* Join local wifi instead of AP
*/
#include <Arduino.h>
#include <driver/gpio.h>
#include <Wire.h>

#include <Preferences.h>

// OTHER INTERNAL CLASSES

// OUR SYSTEM CONFIGURATION
#include "falk-pre-conf.h"

#include "wifi.h"
WiFiManager wifi;

Preferences preferences;
int FlashCommit = 0;

// to handle mute state
int muteButtonState;
int lastmuteButtonState = HIGH;
int muteDebounceTime = 0;

// wifi settings
int wifiButtonPressTime = 0;
int wifiConnectTimeout = 0;
uint8_t wifibuttonstate = HIGH;

void setup(){	
	Serial.begin(9600);
  Serial.println("Booting...");
  //use the pullup resistors, this means we can connect ground to the encoders
	ESP32Encoder::useInternalWeakPullResistors=UP;

  //configure the MCP27013 ICs
  relays.begin();

  //start preferences
  preferences.begin("falk-pre", false);
  //preferences.clear();
  preferences.getBytes("settings", &sysSettings, sizeof(DeviceSettings));

  //add some default values if this is our first boot
  if (sysSettings.saved == 0) {
    sysSettings.saved = 1;
    for (int i = 0; i < INP_MAX; i++) {
      sysSettings.inputs[i].name = "Input " + (String)(i+1);
    }
  }

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
  relays.setVolume(sysSettings.volume);
  relays.setInput(sysSettings.input);

  display.begin();
  display.updateScreen();

  //this is the input rotary encoder button. Needed to handle wifi enable
  //pinMode(WIFI_BUTTON, INPUT_PULLUP);
  pinMode(WIFI_BUTTON, INPUT);

  wifi.enable();
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
        } else {
          muteState = 0;
          volEnc.resumeCount();
          volEnc.setCount(sysSettings.volume);
          //write to the screen
          display.updateScreen();
          //set the relays
          relays.setVolume(sysSettings.volume);
        }
      }
    }
  }
  lastmuteButtonState = reading;
}

void wifiLoop(int m) {
  int reading = digitalRead(WIFI_BUTTON);
  if (reading != wifibuttonstate) {
    Serial.println(reading);
    if (reading == LOW) {
      wifiButtonPressTime = m;
    } else {
      wifiButtonPressTime = 0;
    }
    wifibuttonstate = reading;
  } else if ((reading == LOW) && (wifiButtonPressTime > 0) && (m > wifiButtonPressTime + BUTTON_LONG_PRESS)) {
    wifi.enable();
    wifiButtonPressTime = 0;
  }

  if ((wifiConnectTimeout > 0) && (m > wifiConnectTimeout + WIFI_TIMEOUT)) {
    wifiConnectTimeout = 0;
    WiFi.mode(WIFI_MODE_STA);
    display.updateScreen();
  }
}

void inputLoop(int m) {
  int count = inpEnc.getCount();
  if (count != sysSettings.input) {
    if (count > INP_MAX) {
      count = INP_MIN;
      inpEnc.setCount(INP_MIN);
    } else if (count < INP_MIN) {
      count = INP_MAX;
      inpEnc.setCount(INP_MAX);
    }
    relays.setInput(count);
    sysSettings.input = count;
    display.updateScreen();
    //set a delayed commit (this prevents us from wearing out the flash with each detent)
    FlashCommit = m;
  }
}

void volumeLoop(int m) {
  //gets the current volume, checks to see if it's changed and sets the new volume
  int count = volEnc.getCount();
  if (count != sysSettings.volume) {
    //if we're outside the limts, override with the limits
    if (count > VOL_MAX) {
      //restore back to the maximum volume
      volEnc.setCount(VOL_MAX);
      count = VOL_MAX;
    } else if (count < VOL_MIN) {
      //restore back to the minimum volume
      volEnc.setCount(VOL_MIN);
      count = VOL_MIN;
    }
    //check again (in case we reset to be inside the limits)
    if (count != sysSettings.volume) {
      //save the new volume, as long as we're not going into mute
      if (muteState == 0) {
        sysSettings.volume = count;
      }
      //write to the screen
      display.updateScreen();
      //set the relays
      relays.setVolume(count);
      //set a delayed commit (this prevents us from wearing out the flash with each detent)
      FlashCommit = m;
    } else {
      //just save the new volume
      sysSettings.volume = count;
    }
  }
}

void loop() {
  int m = millis();

  inputLoop(m);
  volumeLoop(m);
  muteLoop(m);
  wifiLoop(m);

  if ((FlashCommit > 0) && (m > FlashCommit + COMMIT_TIMEOUT)) {
      preferences.putBytes("settings", &sysSettings, sizeof(DeviceSettings));
      FlashCommit = 0;
  }

  relays.loop();
  display.loop();
  wifi.loop();
}