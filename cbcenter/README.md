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
[/] make the pin to correct config when initialized
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

-- For gear
[X] Wite Socket config if config is not right
[#] config page add host config
[#] config add version number.
[#] If version number in config mismatch with application, make the config invalid.
[#] Bug: When connect TCP server. It takes long time and no response to physical button.

--- For Documentation
[ ] Add test module, photo, version or config



heartbeat occur 3s once
heartbeat timeout is 2 seconds


Gears 

0-Test
ESP-01
GPIO02 as input internal pullup



