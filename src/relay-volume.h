#ifndef FALK_RELAY_VOLUME
#define FALK_RELAY_VOLUME

//how to find the two MCP23017s
#define MCP_PORTA               0x00
#define MCP_PORTB               0x01
#define MCP_OUTPUT              0x00
#define MCP_INPUT               0x01

#define MCP_PORTA_PINS          0x12
#define MCP_PORTB_PINS          0x13

#define MCP_VOLUME_ADDRESS      0x20

#define RELAY_PULSE             50

class VolumeController {
  private:
    void volEncLoop(int m);
    void endVolumePulse();
  public:
    void begin(short min, short max);
    void setVolume();
    void setVolume(int volume);
    void loop();
};

#endif