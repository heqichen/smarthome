#include <Arduino_BuiltIn.h>
#include "portal.h"
#include <ESP8266WiFi.h>
#include <DNSServer.h>
#include <ESP8266WebServer.h>
#include "config.h"
#include "html_fregments.h"

const byte DNS_PORT = 53;
IPAddress apIP(172, 217, 28, 1);
DNSServer dnsServer;
ESP8266WebServer webServer(80);

Portal::Portal() {
}

void handleRoot() {
  constexpr size_t totalLenght = sizeof(htmlHeader1) - 1 + sizeof(htmlHeader3) - 1 + sizeof(htmlSetupBody1) - 1 + sizeof(htmlSetupBody2) - 1 + 7;

  webServer.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  webServer.sendHeader("Pragma", "no-cache");
  webServer.sendHeader("Expires", "-1");
  webServer.setContentLength(totalLenght);
  // here begin chunked transfer
  webServer.send(200, "text/html", "");
  webServer.sendContent(FPSTR(htmlHeader1));
  webServer.sendContent(FPSTR(htmlHeader3));
  webServer.sendContent(FPSTR(htmlSetupBody1));
  webServer.sendContent(FPSTR(g_idStr));
  webServer.sendContent(FPSTR(htmlSetupBody2));
  webServer.client().stop();
}

void Portal::setup() {

  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));
  WiFi.softAP(g_wifiName);

  // if DNSServer is started with "*" for domain name, it will reply with
  // provided IP to all DNS request
  dnsServer.start(DNS_PORT, "*", apIP);

  webServer.on("/set", HTTP_POST, []() {
    static const char updStr[] = "updating...</body></html>";
    constexpr size_t totalLenght = sizeof(htmlHeader1) - 1 + sizeof(htmlHeader2) - 1 + sizeof(htmlHeader3) - 1 + sizeof(updStr) - 1;
    webServer.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    webServer.sendHeader("Pragma", "no-cache");
    webServer.sendHeader("Expires", "-1");
    webServer.setContentLength(totalLenght);
    webServer.send(200, "text/html", "");
    webServer.sendContent(FPSTR(htmlHeader1));
    webServer.sendContent(FPSTR(htmlHeader2));
    webServer.sendContent(FPSTR(htmlHeader3));
    webServer.sendContent(updStr);
    webServer.client().stop();

    // Save essid to config
    webServer.arg("s").toCharArray(g_config.essid, sizeof(g_config.essid) - 1);
    // Save password to config
    webServer.arg("p").toCharArray(g_config.password, sizeof(g_config.password) - 1);
    // Save type to config
    g_config.type = webServer.arg("t").toInt();
    
    writeEepromConfig();
  });

  // replay to all requests with same HTML
  webServer.on("/fwlink", handleRoot);        // For Microsoft
  webServer.on("/generate_204", handleRoot);  // For Android device
  webServer.onNotFound(handleRoot);
  webServer.begin();


  Serial.println("setup wifi");
  Serial.print("size of head1: ");
  Serial.println(sizeof(htmlHeader1));
}

void Portal::loop() {
  dnsServer.processNextRequest();
  webServer.handleClient();
}