compile the project
> npx tsc

TODO: 
[#] use Buffer.readUInt16LE instead of directly reading.
[#] Reject client if timeout
[#] Reject client if wrong data
[#] Parse the gear from auth reply
[#] Accept client if all good
[ ] handle if client disconnect from server
[ ] Put authed client to pool and send heartbeat
[#] Check the spec of socket
[#] make all pin input
[ ] make the pin to correct config when initialized
[ ] push the button to toggle the relay status
[ ] Release the button to send the status out
[#] Make a programmer for socket
[#] test to blink the LED on socket
[#] Gear can response auth packet
[ ] refactor about packet builder and packet parser
[#] refactor GearTalk's callback map parameter, any, undefined or something
[#] Request heartbeat to Gear
[#] handle heartbeat not response
[ ] Mock Gear can return heartbeat
[#] Can receive heartbeat payload
[#] Can set single value
[ ] Can set all value
[ ] Can set mask on heartbeat
[#] Move all process.env to config object
[/] Refactor the v2
[#] Can add to todo list depends on time
[#] Can run todo list depends on todo list
[#] refresh todo list when new day coming
[#] run all todo list when day finished
[#] add todo list when day finished


-- For gear
[X] Wite Socket config if config is not right
[#] config page add host config
[#] config add version number.
[#] If version number in config mismatch with application, make the config invalid.
[#] Bug: When connect TCP server. It takes long time and no response to physical button.
[#] Remove hardware setup code
[#] Configure pinMode using config 
[#] Read mode and write debounce
[#] Send notification to server
[#] Bug: gear dirty after startup
[#] Fatal: crash if send out something
[#] Implement heartbeat status report
[#] Bug, block while connecting wifi
[#] Can receive single value
[ ] Can receive all value
[ ] Can receive mask
[#] html add dht11 ＆dht22
[#] Can send out DHT11
[#] integration DHT11 into program
[#] For DHT11 interval read status and send out buffer directly by querying
[#] Soldering the SHT40
[#] Wiring SHT40
[#] A dummy programming for SHT40
[ ] Integrating SHT40
[ ] Bug gear will disconnect
[ ] payload length mismatch gear with center
[ ] Fix length of payload on gear to 8, match ceter         const uint8_t *payload = g_gears.getStatusBuffer();


--- For Documentation
[#] Add test module, photo, version or config
[ ] Documentation sensor



heartbeat occur 3s once
heartbeat timeout is 2 seconds


Gears 

0-Test
ESP-01
GPIO02 as input internal pullup



6 - SLOT
GPIO4 - RELAY
GPIO12 BUTTON, internal pull up
GPIO13 - LED


['None','0-Test','1-Button','2-Button','3-Button','4-Button','Slot','Human Existence Sensor','PIR Sensor','Water Sensor','Door Sensor','DHT11','DHT22']