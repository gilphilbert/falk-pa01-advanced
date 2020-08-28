#include "falk-pre-conf.h"

DeviceSettings sysSettings;

String fw_version = "0.1.41";

int muteState = 0;

RelayController relays;
Display display;

// for the volume rotary encoder
ESP32Encoder volEnc;

// for the input rotary encoder
ESP32Encoder inpEnc;