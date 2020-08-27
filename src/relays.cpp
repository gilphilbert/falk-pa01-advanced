#include <Arduino.h>
#include <Wire.h>

#include "falk-pre-conf.h"
#include "relays.h"

int InputRelayPulseTime = 0;
int VolumeRelayPulseTime = 0;

void RelayController::inpEncLoop(int m) {
  if ((InputRelayPulseTime > 0) && (m > InputRelayPulseTime + RELAY_PULSE)) {
    endInputPulse();
  }
}

void RelayController::volEncLoop(int m) {
  if ((VolumeRelayPulseTime > 0) && (m > VolumeRelayPulseTime + RELAY_PULSE)) {
    endVolumePulse();
  }
}

void RelayController::begin() {
  Wire.begin();

  // configure volume
  Wire.beginTransmission(MCP_VOLUME_ADDRESS);  //select the first device (volume relays)
  Wire.write(MCP_PORTA);  //select the "A" bank
  Wire.write(MCP_OUTPUT);  //set to outputs
  Wire.endTransmission();  //kill the connection

  Wire.beginTransmission(MCP_VOLUME_ADDRESS);
  Wire.write(MCP_PORTB);  //select the "B" bank
  Wire.write(MCP_OUTPUT);  //set to outputs
  Wire.endTransmission();  //kill the connection

  Wire.beginTransmission(MCP_INPUT_ADDRESS);
  Wire.write(MCP_PORTA);  //select the "A" bank
  Wire.write(MCP_OUTPUT);  //set to outputs
  Wire.endTransmission();  //kill the connection

  Wire.beginTransmission(MCP_INPUT_ADDRESS);
  Wire.write(MCP_PORTB);  //select the "A" bank
  Wire.write(MCP_OUTPUT);  //set to outputs
  Wire.endTransmission();  //kill the connection
};

void RelayController::setInput(int input) {
  Serial.print("Setting volume to");
  Serial.println(input);
  uint8_t setVal = 1;
  for (uint8_t i = 1; i < input; i++) {
    setVal = setVal * 2;
  }

  Serial.println(setVal);
  //select the volume GPIOs
  Wire.beginTransmission(MCP_INPUT_ADDRESS);
  Wire.write(MCP_PORTA_PINS);
  Wire.write(setVal);
  Wire.endTransmission();  //kill the connection

  Serial.println(255-setVal);
  Wire.beginTransmission(MCP_INPUT_ADDRESS);
  Wire.write(MCP_PORTB_PINS);
  Wire.write(255 - setVal);
  Wire.endTransmission();  //kill the connection
  InputRelayPulseTime = millis();
}

void RelayController::endInputPulse() {
  //select the volume GPIOs
  Wire.beginTransmission(MCP_INPUT_ADDRESS);
  //select the "A" bank
  Wire.write(MCP_PORTA_PINS);
  //set volume
  Wire.write(0);
  //kill session
  Wire.endTransmission();
  //select the volume GPIOs
  Wire.beginTransmission(MCP_INPUT_ADDRESS);
  //select the "B" bank
  Wire.write(MCP_PORTB_PINS);
  //set volume
  Wire.write(0);
  //kill session
  Wire.endTransmission();
  //stop this running again
  InputRelayPulseTime = 0;
};

void RelayController::setVolume() {
  //select the volume GPIOs
  Wire.beginTransmission(MCP_VOLUME_ADDRESS);
  //select the "A" bank pins
  Wire.write(MCP_PORTA_PINS);
  //set volume
  Wire.write(sysSettings.volume);
  //kill session
  Wire.endTransmission();
  //select the volume GPIOs
  Wire.beginTransmission(MCP_VOLUME_ADDRESS);
  //select the "A" bank pins
  Wire.write(MCP_PORTB_PINS);
  //set volume
  Wire.write(VOL_MAX - sysSettings.volume);
  //kill session
  Wire.endTransmission();
  VolumeRelayPulseTime = millis();
}

void RelayController::setVolume(int volume) {
  //select the volume GPIOs
  Wire.beginTransmission(MCP_VOLUME_ADDRESS);
  //select the "A" bank pins
  Wire.write(MCP_PORTA_PINS);
  //set volume
  Wire.write(volume);
  //kill session
  Wire.endTransmission();
  //select the volume GPIOs
  Wire.beginTransmission(MCP_VOLUME_ADDRESS);
  //select the "A" bank pins
  Wire.write(MCP_PORTB_PINS);
  //set volume
  Wire.write(VOL_MAX - volume);
  //kill session
  Wire.endTransmission();
  VolumeRelayPulseTime = millis();
}

void RelayController::endVolumePulse() {
  //select the volume GPIOs
  Wire.beginTransmission(MCP_VOLUME_ADDRESS);
  //select the "A" bank pins
  Wire.write(MCP_PORTA_PINS);
  //set volume
  Wire.write(0);
  //kill session
  Wire.endTransmission();
  //select the volume GPIOs
  Wire.beginTransmission(MCP_VOLUME_ADDRESS);
  //select the "B" bank pins
  Wire.write(MCP_PORTB_PINS);
  //set volume
  Wire.write(0);
  //kill session
  Wire.endTransmission();
  //stop this running again
  VolumeRelayPulseTime = 0;
};

void RelayController::loop() {
  int m = millis();
  RelayController::inpEncLoop(m);
  RelayController::volEncLoop(m);
}