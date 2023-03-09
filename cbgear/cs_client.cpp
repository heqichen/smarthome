#include "cs_client.h"
#include "config.h"
#include <ESP8266WiFi.h>

static WiFiClient client;
constexpr uint64_t RECONECT_TIMEOUT = 2000U;


void CsClient::setup() {
  connect();
}
void CsClient::loop() {
  if (client.status() == tcp_state::ESTABLISHED) {
    lastConnectedTime = millis();
  }
  if ((millis() - lastConnectedTime) > RECONECT_TIMEOUT) {
    client.stop();
    connect();
  }
}

void CsClient::connect() {
  lastConnectedTime = millis();
  if (client.connect("10.99.1.3", 8113)) {
    onConnected();
    client.setTimeout(RECONECT_TIMEOUT);
  }
}


void CsClient::onConnected() {
  client.write("KK\r\n", 4);
}
