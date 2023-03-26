import net from "net";
import PacketParser, { PacketType, gearProtocol } from "./packet_parser";




export type Payload = Buffer;

// GearTalk is a protocol that communication with Gear and Center
const COMMUNICATION_TIMEOUT: number = 12000;
const AUTHENTICATION_TIMEOUT: number = 2000;
const HEARTBEAT_TIMEOUT: number = 2000;
export default class GearTalk {
    private readonly conn_: net.Socket;
    private packetParser_: PacketParser = new PacketParser();
    private requestTimer_: NodeJS.Timeout | undefined;
    private requestPacketId_: number = -1;
    private requestPacketType_: number = -1;

    private readonly callbackMap_: Map<string, (d: Payload) => void> = new Map<string, (d: Payload) => void>([
        ["auth", (payload: Payload): void => { }],
        ["heartbeat", (payload: Payload): void => { }],
        ["invalidPacket", (reason: Payload): void => { }],
        ["packetTimeout", (reason: Payload): void => { }],
    ]);


    constructor(conn: net.Socket) {
        this.conn_ = conn;
        this.conn_.setTimeout(COMMUNICATION_TIMEOUT);
        this.packetParser_.onPacket(this.onPacket);
        conn.on("data", this.packetParser_.parse);
        conn.on("close", this.onSocketEndHandler);
        conn.on("end", this.onSocketEndHandler);
        conn.on("timeout", this.onSocketEndHandler);
    }

    private onSocketEndHandler(): void {
        console.log("TTTTTTTTTTDOOOOOOOOOO: socket end");
        // TODO
    }

    on(event: string, callback: (d: any | undefined) => void) {
        if (this.callbackMap_.has(event)) {
            this.callbackMap_.set(event, callback);
        } else {
            console.error("cannot register this callback", event);
        }
    }


    private callEvent(event: string, d: any | undefined) {
        const callback = this.callbackMap_.get(event);
        if (callback) callback(d);
    }

    private onPacket: (data: Buffer) => void = (data: Buffer): void => {
        const packetId: number = data.readUint16BE(2);
        const packetType: number = data.readUint16BE(4);

        console.log("got packet", packetType);
        console.log("compare packet id: ", this.requestPacketId_, packetId);

        const isPacketResponse: boolean = (data.readUint8(1) & 0x01) > 0;
        const isPacketIdMatch: boolean = packetId === this.requestPacketId_;
        const packetPayload: Buffer = data.subarray(6, 14);

        if (isPacketResponse && isPacketIdMatch) {
            switch (packetType) {
                case (PacketType.AUTH): {
                    this.callEvent("auth", packetPayload);
                }
                case (PacketType.HEARTBEAT): {
                    // TODO: move payload out;
                    this.callEvent("heartbeat", null);
                }
                default: {
                    this.callEvent("invalidPacket", Buffer.from("unknown packet"));
                }
            }
        } else {
            this.callEvent("invalidPacket", Buffer.from("packet invalid"));
        }

        clearTimeout(this.requestTimer_);
        this.requestPacketId_ = -1;
        this.requestPacketType_ = -1;
    }


    requestAuthenticate(): void {
        // TODO: check timer and request id before send
        // console.log("request authenticate");
        const authRequestPacket: Buffer = gearProtocol.buildServerAuthenticationRequest();
        this.requestTimer_ = setTimeout(() => {
            this.callEvent("packetTimeout", Buffer.from("auth time up"));
        }, AUTHENTICATION_TIMEOUT);
        this.requestPacketId_ = authRequestPacket.readUint16BE(2);

        // Send auth request
        this.conn_.write(authRequestPacket);
    }

    requestHeartbeat(): void {
        // TODO: check timer and request id before send
        const heartbeatRequestPacket: Buffer = gearProtocol.buildHeartbeatRequest();
        console.log("write heartbeat out");
        this.requestTimer_ = setTimeout(() => {
            console.log("packet timeout");
            this.callEvent("packetTimeout", Buffer.from("time out"));
        }, HEARTBEAT_TIMEOUT);
        this.requestPacketId_ = heartbeatRequestPacket.readUInt16BE(2);
        this.conn_.write(heartbeatRequestPacket);
    }
    drop: () => void = (): void => {
        clearTimeout(this.requestTimer_);
        this.conn_.destroy();
    }
};
