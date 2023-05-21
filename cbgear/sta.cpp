#include "sta.h"
#include <Arduino_BuiltIn.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include "config.h"
#include "cs_client.h"
#include "packet_parser.h"





static ESP8266WebServer server(80);
static CsClient csClient;
static PacketEncoder packetEncoder;

static wl_status_t lastWifiStatus;

String webString = "";

void Sta::setup() {
  // start WiFI
  WiFi.mode(WIFI_STA);
  WiFi.begin(g_config.essid, g_config.password);
  // allow to address the device by the given name e.g. http://webserver
  WiFi.setHostname(g_hostname);

  Serial.println("Connect to WiFi...\n");
  Serial.print(g_config.essid);
  Serial.print(" | ");
  Serial.print(g_config.password);
  Serial.print(" : ");
  Serial.println(g_config.host);
  lastWifiStatus = WiFi.status();

  server.on("/reset", HTTP_GET, []() {
    g_config.type = 0;
    writeEepromConfig();
    ESP.restart();
  });

  server.on("/test", HTTP_GET, []() {
    server.send(200, "text/plain", webString);  // send to someones browser when asked
  });
  // handle cases when file is not found
  server.onNotFound([]() {
    // standard not found in browser.
    server.send(404, "text/html", "Not Found");
  });

  server.begin();
  csClient.setup();
}



void Sta::loop() {
  wl_status_t currentWifiStatus = WiFi.status();
  if ((lastWifiStatus != currentWifiStatus) && (currentWifiStatus == WL_CONNECTED)) {
    Serial.println("wifi connected.\n");
  }
  lastWifiStatus = currentWifiStatus;

  if (currentWifiStatus == WL_CONNECTED) {
    // For HTTP
    server.handleClient();

    // For TCP Client
    csClient.loop();
  }
}

void Sta::sendUserAction(const uint8_t *payload) {
  const uint8_t *packet = packetEncoder.EncodeUserAction(payload);
  csClient.write(packet, PACKET_LENGTH);
}
