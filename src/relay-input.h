#ifndef FALK_RELAYS
#define FALK_RELAYS

//how to find the two MCP23017s
#define MCP_PORTA               0x00
#define MCP_PORTB               0x01
#define MCP_OUTPUT              0x00
#define MCP_INPUT               0x01

#define MCP_PORTA_PINS          0x12
#define MCP_PORTB_PINS          0x13

#define MCP_INPUT_ADDRESS       0x21

#define RELAY_PULSE             50

class InputController {
  private:
    void inpEncLoop(int m);
    void endPulse();
  public:
    void begin(short max);
    void set(int input);
    void loop();
};

#endif