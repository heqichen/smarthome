#ifndef __CS_CLIENT_H__
#define __CS_CLIENT_H__

#include <stdint.h>
#include <ESPAsyncTCP.h>



class CsClient {
public:
  void setup();
  void loop();
  void write(uint8_t *data, uint32_t len);

  void onConnect(AsyncClient *client);
  void onDisconnected(AsyncClient *client);
  void onError(AsyncClient *client, err_t error);
  void onData(AsyncClient * client, void *data, size_t len);
  void onTimeout(AsyncClient *client, uint32_t time);
  void onPoll(AsyncClient *client);
private:
  AsyncClient *_client = nullptr;
  uint64_t _lastConnectTime = 0U;
  void connect();
};

#endif
