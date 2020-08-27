#ifndef FALK_RELAYS
#define FALK_RELAYS

//how to find the two MCP23017s
#define MCP_PORTA               0x00
#define MCP_PORTB               0x01
#define MCP_OUTPUT              0x00
#define MCP_INPUT               0x01

#define MCP_PORTA_PINS          0x12
#define MCP_PORTB_PINS          0x13

#define MCP_VOLUME_ADDRESS      0x20
#define MCP_INPUT_ADDRESS       0x21

#define RELAY_PULSE             50

class RelayController {
  private:
    void inpEncLoop(int m);
    void volEncLoop(int m);
    void endInputPulse();
    void endVolumePulse();
  public:
    void begin();
    void setInput(int input);
    void setVolume();
    void setVolume(int volume);
    void loop();
};

#endif