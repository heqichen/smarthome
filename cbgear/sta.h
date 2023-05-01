#ifndef __STA_H__
#define __STA_H__

#include <stdint.h>

class Sta {
public:
  void setup();
  void loop();
  void sendUserAction(const uint8_t* payload);
};

#endif
