#include "falk-pre-conf.h"

Settings sysSettings;

String fw_version = "0.1.36";

int muteState = 0;

RelayController relays;
Display display;

// for the volume rotary encoder
ESP32Encoder volEnc;

// for the input rotary encoder
ESP32Encoder inpEnc;