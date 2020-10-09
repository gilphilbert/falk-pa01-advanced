#include <Arduino.h>
#include <Wire.h>

#include "relay-input.h"

short inp_max;
int InputRelayPulseTime = 0;

void InputController::inpEncLoop(int m) {
  if ((InputRelayPulseTime > 0) && (m > InputRelayPulseTime + RELAY_PULSE)) {
    endPulse();
  }
}

void InputController::begin(short max) {
  inp_max = max;

  Wire.begin();

  Wire.beginTransmission(MCP_INPUT_ADDRESS);
  Wire.write(MCP_PORTA);  //select the "A" bank
  Wire.write(MCP_OUTPUT);  //set to outputs
  Wire.endTransmission();  //kill the connection

  Wire.beginTransmission(MCP_INPUT_ADDRESS);
  Wire.write(MCP_PORTB);  //select the "A" bank
  Wire.write(MCP_OUTPUT);  //set to outputs
  Wire.endTransmission();  //kill the connection
};

void InputController::set(int input) {
  Serial.print("Setting input to");
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

void InputController::endPulse() {
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

void InputController::loop() {
  int m = millis();
  InputController::inpEncLoop(m);
}