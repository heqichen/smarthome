
import * as net from "net";
import PacketParser, { PacketType, gearProtocol } from "./packet_parser";

type GearSignature = {
    type: number,
    id: string
};


// GearTalk is a protocol that communication with Gear and Center
const COMMUNICATION_TIMEOUT: number = 12000;
const AUTHENTICATION_TIMEOUT: number = 2000;
class GearTalk {
    private readonly conn_: net.Socket;
    private packetParser_: PacketParser = new PacketParser();
    private requestTimer_: NodeJS.Timeout | undefined;
    private requestPacketId_: number = -1;
    private requestPacketType_: number = -1;

    private readonly callbackMap_: Map<string, (d: any | undefined) => void> = new Map<string, ((d: any) => void)>([
        ["auth", () => { }],
        ["authFailed", () => { }],
        ["invalidPacket", (reason: string) => { }],
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
        const isPacketTypeMatch: boolean = packetType === PacketType.AUTH;
        const isPacketIdMatch: boolean = packetId === this.requestPacketId_;



        if (isPacketResponse && isPacketTypeMatch && isPacketIdMatch) {
            const deviceType: number = data.readUint8(6);
            const deviceId: string = data.toString("utf8", 7, 14);
            const gearSig: GearSignature = {
                type: deviceType,
                id: deviceId,
            };
            this.callEvent("auth", gearSig);
        } else {
            this.callEvent("invalidPacket", "packet invalid");
        }

        clearTimeout(this.requestTimer_);
        this.requestPacketId_ = -1;
        this.requestPacketType_ = -1;
    }


    requestAuthenticate(): void {
        const authRequestPacket: Buffer = gearProtocol.buildServerAuthenticationRequest();
        this.requestTimer_ = setTimeout(() => {
            this.callEvent("authFailed", "auth time up");
        }, AUTHENTICATION_TIMEOUT);
        this.requestPacketId_ = authRequestPacket.readUint16BE(2);

        // Send auth request
        this.conn_.write(authRequestPacket);
    }

    drop: () => void = (): void => {
        clearTimeout(this.requestTimer_);
        this.conn_.destroy();
    }
};

class SocketClient {
    private readonly talk_: GearTalk;
    private authResolve_: () => void = () => { };
    private authReject_: (reason: string) => void = () => { };
    private isClientAuthed_: boolean = false;

    constructor(conn: net.Socket) {
        this.talk_ = new GearTalk(conn);
        this.talk_.on("auth", this.onAuth);
        this.talk_.on("authFailed", this.onAuthFailed);
        this.talk_.on("invalidPacket", this.onInvalidPacket);
    }

    private onAuth: (gear:GearSignature) => void = (gear:GearSignature): void => {
        // TODO
        console.log("gear id is: ", gear.id);


        this.acceptClient();
    }

    private onAuthFailed: (reason: string) => void = (reason: string): void => {
        this.rejectClient(reason);
    }

    private onInvalidPacket: (reason: string) => void = (reason: string): void => {
        if (!this.isClientAuthed_) {
            this.rejectClient(reason);
        }
    }

    private acceptClient: () => void = (): void => {
        this.isClientAuthed_ = true;
        this.authResolve_();
    }

    private rejectClient: (reason: string) => void = (reason: string): void => {
        this.isClientAuthed_ = false;
        this.authReject_(reason);
    }

    authenticate: () => Promise<void> = (): Promise<void> => {
        return new Promise<void>((resolve: () => void, reject: (reason: any) => void) => {
            this.authResolve_ = resolve;
            this.authReject_ = reject;
            this.talk_.requestAuthenticate();
        });
    };

    drop: () => void = (): void => {
        this.talk_.drop();
    }

};

export default SocketClient;