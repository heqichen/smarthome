import net from "net";
import PacketParser, { PacketType, gearProtocol } from "./packet_parser";


export type Payload = Buffer;

// GearTalk is a protocol that communication with Gear and Center
const COMMUNICATION_TIMEOUT: number = 12000;
const PACKET_TIMEOUT: number = 2000;

export default class GearTalk {
    private readonly conn_: net.Socket;
    private packetParser_: PacketParser = new PacketParser();
    private requestTimer_: NodeJS.Timeout | undefined;
    private requestPacketId_: number = -1;
    private requestPacketType_: number = -1;
    private isConnDied_: boolean = false;

    private readonly callbackMap_: Map<string, (d: Payload) => void> = new Map<string, (d: Payload) => void>([
        ["auth", (payload: Payload): void => { }],
        ["heartbeat", (payload: Payload): void => { }],
        ["userAction", (payload: Payload): void => { }],
        ["invalidPacket", (reason: Payload): void => { }],
        ["packetTimeout", (reason: Payload): void => { }],
        ["validResponse", (reason: Payload): void => { }],
        ["die", (reason: Payload): void => { }],
    ]);


    constructor(conn: net.Socket) {

        this.onSocketEndHandler = this.onSocketEndHandler.bind(this);
        this.on = this.on.bind(this);
        this.clearStatus = this.clearStatus.bind(this);
        this.callEvent = this.callEvent.bind(this);
        this.onPacket = this.onPacket.bind(this);
        this.requestPacket = this.requestPacket.bind(this);
        this.requestAuthenticate = this.requestAuthenticate.bind(this);
        this.requestHeartbeat = this.requestHeartbeat.bind(this);
        this.drop = this.drop.bind(this);
        this.sendSetSingleValue = this.sendSetSingleValue.bind(this);

        this.conn_ = conn;
        this.conn_.setTimeout(COMMUNICATION_TIMEOUT);
        this.packetParser_.onPacket(this.onPacket);


        conn.on("data", this.packetParser_.parse);
        conn.on("close", this.onSocketEndHandler);
        conn.on("end", this.onSocketEndHandler);
        conn.on("timeout", this.onSocketEndHandler);

    }


    private onSocketEndHandler(): void {
        this.isConnDied_ = true;
        this.callEvent("die", "connection end");
    }

    on(event: string, callback: (d: any | undefined) => void) {
        if (this.callbackMap_.has(event)) {
            this.callbackMap_.set(event, callback);
        } else {
            console.error("cannot register this callback", event);
        }
    }

    private clearStatus(): void {
        clearTimeout(this.requestTimer_);
        this.requestPacketId_ = -1;
        this.requestPacketType_ = -1;
    }

    private callEvent(event: string, d: any | undefined) {
        const callback = this.callbackMap_.get(event);
        if (callback) callback(d);
    }

    private onPacket: (data: Buffer) => void = (data: Buffer): void => {
        const packetId: number = data.readUint16BE(2);
        const packetType: number = data.readUint16BE(4);

        const isPacketResponse: boolean = (data.readUint8(1) & 0x01) > 0;
        const isPacketIdMatch: boolean = packetId === this.requestPacketId_;
        const packetPayload: Buffer = data.subarray(6, 14);

        if (isPacketResponse && isPacketIdMatch) {
            switch (packetType) {
                case (PacketType.AUTH): {
                    this.callEvent("auth", packetPayload);
                    break;
                }
                case (PacketType.HEARTBEAT): {
                    // TODO: move payload out;
                    this.callEvent("heartbeat", packetPayload);
                    break;
                }
                case (PacketType.SINGLE_VALUE): {
                    this.callEvent("validResponse", packetPayload);
                    break;
                }
                default: {
                    this.callEvent("invalidPacket", Buffer.from("unknown packet"));
                    break;
                }
            }
        } else {
            this.callEvent("invalidPacket", Buffer.from("packet invalid"));
        }

        if (!isPacketResponse) {
            switch (packetType) {
                case (PacketType.USER_ACTION): {
                    this.callEvent("userAction", packetPayload);
                    break;
                }
                default: {
                    break;
                }
            }
        }

        this.clearStatus();
    }



    private requestPacket(packet: Buffer): void {
        if (this.isConnDied_) {
            this.callEvent("die", "client die");
        } else {
            this.requestTimer_ = setTimeout(() => {
                this.callEvent("packetTimeout", Buffer.from("time up"));
            }, PACKET_TIMEOUT);
            this.requestPacketId_ = packet.readUint16BE(2);
            this.conn_.write(packet);
        }
    }

    requestAuthenticate(): void {
        const authRequestPacket: Buffer = gearProtocol.buildServerAuthenticationRequest();
        this.requestPacket(authRequestPacket);
    }

    requestHeartbeat(): void {
        const heartbeatRequestPacket: Buffer = gearProtocol.buildHeartbeatRequest();
        this.requestPacket(heartbeatRequestPacket);
    }

    drop: () => void = (): void => {
        clearTimeout(this.requestTimer_);
        this.conn_.destroy();
    }

    sendSetSingleValue(port: number, value: number): void {
        const packet: Buffer = gearProtocol.buildSetSingleValue(port, value);
        this.conn_.write(packet);
    }
};
