#ifndef __CS_CLIENT_H__
#define __CS_CLIENT_H__

#include <stdint.h>

class CsClient {
public:
  void setup();
  void loop();
private:
  uint64_t lastConnectedTime = 0U;
  void connect();
  void onConnected();
};

#endif
