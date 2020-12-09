#include <Arduino.h>
#include <Wire.h>

#include "relay-volume.h"

int VolumeRelayPulseTime = 0;
short vol_max = 0;
short vol_min = 0;

void VolumeController::volEncLoop(int m) {
  if ((VolumeRelayPulseTime > 0) && (m > VolumeRelayPulseTime + RELAY_PULSE)) {
    endPulse();
  }
}

void VolumeController::begin(short min, short max) {
  vol_min = min;
  vol_max = max;

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
}

void VolumeController::set(int volume) {
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
  Wire.write(vol_max - volume);
  //kill session
  Serial.println(Wire.endTransmission());
  VolumeRelayPulseTime = millis();
}

void VolumeController::endPulse() {
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
}

void VolumeController::loop() {
  int m = millis();
  VolumeController::volEncLoop(m);
}