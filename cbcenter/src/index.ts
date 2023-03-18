import * as net from 'net';
import { getHeapStatistics } from 'v8';


const COMMUNICATION_TIMEOUT: number = 12000;
const AUTHENTICATION_TIMEOUT: number = 2000;
const PACKET_TIMEOUT_THRESHOLD: number = 400;
const PACKET_LENGTH: number = 16;
const PACKET_HEADER: number = 0xA5;

interface CoobocGear { };
// ['None','1-Button','2-Button','3-Button','4-Button','Slot','Human Existence Sensor','PIR Sensor','Water Sensor','Door Sensor'];

class CoobocGearNone implements CoobocGear { };
const placeholderGear: CoobocGear = new CoobocGearNone();
class CoobocGear1Button implements CoobocGear {
    constructor(idStr: string) { }
};



function buildCoobocGear(type: number, id: string): CoobocGear {
    if (type == 0) {
        throw "type invalid";
    }
    return new CoobocGear1Button(id);
}

const PACKET_AUTH_TYPE: number = 0x0203;



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
     *     0   1   2      3  4        5   6       ...      13   14 15
        ┌────┬────┬─────────┬───────────┬──────────┬──────────┬──────┐
        │0xA5│ATTR│PackID(2)│PackType(2)│PayloadLen│Payload(7)│CRC(2)│
        └────┴────┴─────────┴───────────┴──────────┴──────────┴──────┘
    **/


    buildServerAuthenticationRequest(): Buffer {
        const buf: Buffer = Buffer.alloc(PACKET_LENGTH);
        buf.fill(0);
        const packetId = this.makePacketId();
        buf[0] = PACKET_HEADER; // head
        buf[1] = 0x00; // packet attribute
        buf.writeUint16BE(packetId, 2);
        buf.writeUint16BE(PACKET_AUTH_TYPE, 4);
        // buf[6] = 0;
        // ...
        const crc: number = calculateCrc(buf);

        buf.writeUint16BE(crc, 14);
        return buf;
    }
};

const gearProtocol = new GearProtocol();

class PacketParser {
    private lastCommMillis_: number = 0;
    private packetOffset_: number = 0;
    private packetBuffer_: Buffer = Buffer.alloc(PACKET_LENGTH);
    private onPacketCallback_: ((buffer: Buffer) => void) | undefined = undefined;

    private millis(): number {
        const time: [number, number] = process.hrtime();
        return time[0] * 1000 + time[1] / 1000;
    }

    onPacket(callback: ((buffer: Buffer) => void)) {
        this.onPacketCallback_ = callback;
    }

    parse: (data: Buffer) => void = (data: Buffer): void => {
        const currentMillis: number = this.millis();
        if ((currentMillis - this.lastCommMillis_) > PACKET_TIMEOUT_THRESHOLD) {
            this.packetOffset_ = 0;
        }
        this.lastCommMillis_ = currentMillis;

        for (let i = 0; i < data.length; ++i) {
            const byte: number = data[i];
            if (this.packetOffset_ == 0) {
                // Search for packet header
                if (byte === PACKET_HEADER) {
                    this.packetBuffer_[0] = byte;
                    this.packetOffset_++;
                }
            } else {
                this.packetBuffer_[this.packetOffset_] = byte;
                this.packetOffset_++;
                if (this.packetOffset_ == PACKET_LENGTH) {
                    this.packetOffset_ = 0;
                    this.decodePacket();
                }
            }
        }
    }

    private decodePacket() {
        let actualCrc: number = this.packetBuffer_.readUint16BE(14);
        this.packetBuffer_.writeUint16BE(0, 14);
        const expectCrc: number = calculateCrc(this.packetBuffer_);
        console.log("actual crc: ", actualCrc, "  expect crc: ", expectCrc);
        if (actualCrc === expectCrc) {
            if (this.onPacketCallback_) this.onPacketCallback_(this.packetBuffer_);
        }
    }
};

class SocketClient {
    private conn_: net.Socket;
    private packetParser_: PacketParser = new PacketParser();

    // For Authentication
    private isClientAuthed_: boolean = false;
    private authPacketId_: number = -1;
    private authTimer_: NodeJS.Timeout | undefined;
    private authResolve_: () => void = () => { };
    private authReject_: (reason: any) => void = () => { };

    private coobocGear_: CoobocGear = placeholderGear;


    private onSocketEndHandler(): void {
        // TODO
    }

    private onPacket: (data: Buffer) => void = (data: Buffer): void => {
        const packetId: number = data.readUint16BE(2);
        const packetType: number = data.readUint16BE(4);

        console.log("got packet", packetType);
        console.log("compare packetid: ", this.authPacketId_, packetId);

        const isPacketResponse: boolean = (data.readUint8(1) & 0x01) > 0;
        const isPacketTypeAuth: boolean = packetType === PACKET_AUTH_TYPE;
        const deviceType: number = data.readUint8(6);
        const deviceId: string = data.toString("utf8", 7, 14);


        if (this.isClientAuthed_) {
            // TODO: do the normal process
        } else {
            if (isPacketResponse && isPacketTypeAuth) {
                try {
                    this.coobocGear_ = buildCoobocGear(deviceType, deviceId);
                    this.acceptClient();
                } catch (e: any) {
                    this.rejectClient(e);
                }
            } else {
                // Invalid authenticate packet, drop it
                this.rejectClient("auth data error");
            }
        }

    }

    private acceptClient: () => void = (): void => {
        this.isClientAuthed_ = true;
        clearTimeout(this.authTimer_);
        this.authResolve_();
    }

    private rejectClient: (reason: string) => void = (reason: string): void => {
        this.isClientAuthed_ = false;
        clearTimeout(this.authTimer_);
        this.authReject_(reason);
    }

    constructor(conn: net.Socket) {
        this.conn_ = conn;
        this.packetParser_.onPacket(this.onPacket);
        conn.on("data", this.packetParser_.parse);
        conn.on("close", this.onSocketEndHandler);
        conn.on("end", this.onSocketEndHandler);
        conn.on("timeout", this.onSocketEndHandler);

    }

    authenticate: () => Promise<void> = (): Promise<void> => {
        return new Promise<void>((resolve: () => void, reject: (reason: any) => void) => {
            this.authResolve_ = resolve;
            this.authReject_ = reject;
            this.authTimer_ = setTimeout(() => {
                this.rejectClient("auth time up");
            }, AUTHENTICATION_TIMEOUT);
            // Send auth request
            const authRequestPacket: Buffer = gearProtocol.buildServerAuthenticationRequest();
            this.authPacketId_ = authRequestPacket.readUint16BE(2);
            this.conn_.write(authRequestPacket);
        });
    };

    drop: () => void = (): void => {
        clearTimeout(this.authTimer_);
        this.authResolve_ = () => { };
        this.authReject_ = () => { };
        this.conn_.destroy();
    }

};

// Setup Server
const server: net.Server = net.createServer();
server.on('connection', (conn: net.Socket): void => {
    const remoteAddress = conn.remoteAddress + ':' + conn.remotePort;
    conn.setTimeout(COMMUNICATION_TIMEOUT);
    const socketClient: SocketClient = new SocketClient(conn);

    socketClient.authenticate().then(() => {
        // TODO
    }).catch((reason: any) => {
        console.log(`client ${remoteAddress} not allowed ${reason}`);
        socketClient.drop();
    });
});



server.listen(8113, () => {
    console.log('server listening to %j', server.address());
});

