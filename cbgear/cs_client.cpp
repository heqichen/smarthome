#include "cs_client.h"
#include "config.h"
#include "packet_parser.h"

static PacketParser packetParser;


// set a small time to debug
constexpr uint64_t RECONECT_TIMEOUT = 7000U;  // reconnect after lost connection, this value is to avoid high frequency reconnect
constexpr uint64_t RX_TIMEOUT = 5U;           // data timeout,
constexpr uint64_t ACK_TIMEOUT = 400U;

// constexpr uint64_t RECONECT_TIMEOUT = 20000U;  // reconnect after lost connection, this value is to avoid high frequency reconnect
// constexpr uint64_t RX_TIMEOUT = 10U;           // data timeout,
// constexpr uint64_t ACK_TIMEOUT = 400U;


static void onConnectCallback(void *arg, AsyncClient *client) {
  static_cast<CsClient *>(arg)->onConnect(client);
}

static void onDisconnectedCallback(void *arg, AsyncClient *client) {
  static_cast<CsClient *>(arg)->onDisconnected(client);
}

static void onErrorCallback(void *arg, AsyncClient *client, err_t error) {
  static_cast<CsClient *>(arg)->onError(client, error);
}

static void onDataCallback(void *arg, AsyncClient *client, void *data, size_t len) {
  static_cast<CsClient *>(arg)->onData(client, data, len);
}

static void onTimeoutCallback(void *arg, AsyncClient *client, uint32_t time) {
  static_cast<CsClient *>(arg)->onTimeout(client, time);
}

static void onPollCallback(void *arg, AsyncClient *client) {
  static_cast<CsClient *>(arg)->onPoll(client);
}

void CsClient::onConnect(AsyncClient *client) {
  Serial.print("onConnect: ");
  Serial.print(client->getLocalPort());
  Serial.print(" ");
  Serial.println(_client->getLocalPort());
  if (_client != client) {
    Serial.println("onConnected, client updated");
  }
}

void CsClient::onDisconnected(AsyncClient *client) {
  Serial.println("onDisconnected");
  delete _client;
  _client = nullptr;
}

void CsClient::onError(AsyncClient *client, err_t error) {
  Serial.println("onError");
  if (_client != client) {
    Serial.println("Fatal: Error client mismatch.");
    _client->close(true);
    client->close(true);
  } else {
    client->close();
  }
}

void CsClient::onData(AsyncClient *client, void *data, size_t len) {
  if (_client != client) {
    Serial.println("FATAL: client mismatch from onData");
    _client->close(true);
    client->close(true);
  } else {
    packetParser.parse(data, len, client);
  }
}

void CsClient::onTimeout(AsyncClient *client, uint32_t time) {
  if (_client != client) {
    Serial.println("FATAL: client mismatch from onTimeout");
    _client->close(true);
    client->close(true);
  } else {
    client->close();
  }
}

void CsClient::onPoll(AsyncClient *client) {
  if (_client != client) {
    Serial.println("FATAL: client mismatch from onPoll.");
    _client->close(true);
    client->close(true);
  } else {
    _lastConnectTime = millis();
  }
}

void CsClient::setup() {

  // _client->onAck([](void *, AsyncClient *, size_t len, uint32_t time) {
  //   Serial.println("onAck");
  // },
  //                this);


  Serial.print(g_config.host);
  Serial.println(":8113");
}

void CsClient::loop() {
  // case 0: return "Closed";
  // case 1: return "Listen";
  // case 2: return "SYN Sent";
  // case 3: return "SYN Received";
  // case 4: return "Established";
  // case 5: return "FIN Wait 1";
  // case 6: return "FIN Wait 2";
  // case 7: return "Close Wait";
  // case 8: return "Closing";
  // case 9: return "Last ACK";
  // case 10: return "Time Wait";

  if (_client == nullptr) {
    if ((millis() - _lastConnectTime) > RECONECT_TIMEOUT) {
      _lastConnectTime = millis();
      connect();
    }
  }
}

void CsClient::connect() {
  if (_client != nullptr) {
    Serial.println("FATAL, client is not clean.");
  }
  Serial.println("try to connect");
  _client = new AsyncClient();
  _client->setAckTimeout(ACK_TIMEOUT);
  _client->setRxTimeout(RX_TIMEOUT);
  _client->onConnect(onConnectCallback, this);
  _client->onDisconnect(onDisconnectedCallback, this);
  _client->onError(onErrorCallback, this);
  _client->onData(onDataCallback, this);
  _client->onTimeout(onTimeoutCallback, this);
  _client->onPoll(onPollCallback, this);
  _client->connect(g_config.host, 8113);
}
bool CsClient::write(const uint8_t *data, const uint32_t len) {
  if (_client == nullptr) {
    return false;
  } else {
    _client->write((const char *)data, len);
  }
  return true;
}
