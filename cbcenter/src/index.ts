import * as net from 'net';
import { buffer } from 'stream/consumers';


const COMMUNICATION_TIMEOUT: number = 12000;
const AUTHENTICATION_TIMEOUT: number = 2000;

class CoobocGear { };


const PACK_AUTH_TYPE_LOW: number = 0x02;
const PACK_AUTH_TYPE_HIGH: number = 0x03;


function calculateCrc(buf: Buffer): number {
    let crc: number = 0;
    for (let i = 0; i < buf.length; ++i) {
        const byte: number = buf[i];
        crc ^= byte;
        if (crc & 0x01) {
            crc = (crc << 1) ^ 0xA001;
        } else {
            crc = (crc << 1);
        }
        crc = crc & 0x00FFFF;
    }
    return crc;
}


class GearProtocol {
    private packetId: number = 0;
    private makePacketId(): number {
        return this.packetId++;
    }

    /**
        ┌────┬────┬─────────┬───────────┬──────────┬──────────┬──────┐
        │0xA5│ATTR│PackID(2)│PackType(2)│PayloadLen│Payload(7)│CRC(2)│
        └────┴────┴─────────┴───────────┴──────────┴──────────┴──────┘
    **/


    buildServerAuthenticationRequest(): Buffer {
        const buf: Buffer = Buffer.alloc(16);
        buf.fill(0);
        const packetId = this.makePacketId();
        buf[0] = 0xA5; // head
        buf[1] = 0x00; // packet attribute
        buf[2] = (packetId >> 8) & 0x00FF;
        buf[3] = packetId & 0x00FF;
        buf[4] = PACK_AUTH_TYPE_LOW;
        buf[5] = PACK_AUTH_TYPE_HIGH;
        buf[6] = 0;
        // ...
        const crc: number = calculateCrc(buf);
        buf[14] = (crc >> 8) & 0x00FF;
        buf[15] = crc & 0x00FF;


        for (let i = 0; i < buf.length; ++i) {
            const by: number = buf[i];
            console.log(by);
        }
        return buf;
    }
};

const gearProtocol = new GearProtocol();



class ClientAuthenticator {
    authenticate(conn: net.Socket): Promise<CoobocGear> {
        return new Promise<CoobocGear>((resolve: (coobocGear: CoobocGear) => void, reject: (reason: any) => void) => {
            const authTimerId: NodeJS.Timeout = setTimeout(() => {
                reject("auth timeout");
            }, AUTHENTICATION_TIMEOUT);
            const authRequestPacket: Buffer = gearProtocol.buildServerAuthenticationRequest();
            conn.write(authRequestPacket);
            conn.once('data', (data: Buffer): void => {
                // clearTimeout(authTimerId);
                console.log("got data", data, data.length);
            });
            conn.once("close", () => {
                clearTimeout(authTimerId);
                console.log("connection closed");
                reject("conn closed");
            });

            conn.once("end", () => {
                clearTimeout(authTimerId);
                console.log("connection timeout");
                reject("conn end");
            });
            conn.once("timeout", () => {
                clearTimeout(authTimerId);
                reject("conn timeout");
            });

        });
    };
};

const ca = new ClientAuthenticator();



// Setup Server
const server: net.Server = net.createServer();
server.on('connection', (conn: net.Socket): void => {
    var remoteAddress = conn.remoteAddress + ':' + conn.remotePort;
    console.log('new client connection from %s', remoteAddress);
    conn.setTimeout(COMMUNICATION_TIMEOUT);
    ca.authenticate(conn).then((coobocGear: CoobocGear) => {
        // TODO
    }).catch((reason: any) => {
        conn.end();
    });



    // conn.on('data', (data: Buffer):void => {
    //     console.log("got data", data);
    // });
    // conn.on("close", () => {
    //     console.log("connection closed");
    // });
    // conn.on("end", () => {
    //     console.log("connection timeout");
    // });
    // conn.on("timeout", () => {
    //     conn.end();
    // })
});



server.listen(8113, () => {
    console.log('server listening to %j', server.address());
});

