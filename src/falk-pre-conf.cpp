#include "falk-pre-conf.h"

DeviceSettings sysSettings;

String fw_version = "0.1.11";

int FlashCommit = 0;

int muteState = 0;

//the following need to be widely available since we need to be able to access them from wifi.cpp
Display display;

// for the volume rotary encoder
ESP32Encoder volEnc;

// for the input rotary encoder
ESP32Encoder inpEnc;