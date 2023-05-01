#include "sta.h"
#include <Arduino_BuiltIn.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include "config.h"
#include "cs_client.h"


static ESP8266WebServer server(80);
static CsClient csClient;

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
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.println(".");
  }
  Serial.println("connected.\n");

  server.on("/reset", HTTP_GET, []() {
    g_config.type = 0;
    writeEepromConfig();
    ESP.restart();
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
  
  // For HTTP
  server.handleClient();

  // For TCP Client
  csClient.loop();

  // Check wifi status
  // if (WiFi.status() != WL_CONNECTED) {
  //   Serial.println("hoho hohoh");
  // }
}
