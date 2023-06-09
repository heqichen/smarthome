import * as net from "net";
import GearTalk, { Payload } from "./gear_talk";

export type GearSignature = {
    type: number,
    id: string
};

class SocketClient {


    private readonly talk_: GearTalk;

    private isRequesting_: boolean = false;
    private packetResolve_: (payload: Payload) => void = (payload: Payload) => { };
    private packetReject_: (reason: string) => void = () => { };
    private isClientAuthed_: boolean = false;
    private clientDiedCallback_: (reason: string) => void = () => { };

    constructor(conn: net.Socket) {
        this.onAuth = this.onAuth.bind(this);
        this.onInvalidPacket = this.onInvalidPacket.bind(this);
        this.onHeartbeat = this.onHeartbeat.bind(this);
        this.onPacketTimeout = this.onPacketTimeout.bind(this);
        this.onUserAction = this.onUserAction.bind(this);
        this.acceptPacket = this.acceptPacket.bind(this);
        this.rejectPacket = this.rejectPacket.bind(this);
        this.requestPacket = this.requestPacket.bind(this);
        this.authenticate = this.authenticate.bind(this);
        this.heartbeat = this.heartbeat.bind(this);
        this.drop = this.drop.bind(this);
        this.onClientDied = this.onClientDied.bind(this);
        this.setClientEndCallback = this.setClientEndCallback.bind(this);
        this.setSingleValue = this.setSingleValue.bind(this);

        this.isRequesting_ = false;
        this.talk_ = new GearTalk(conn);
        this.talk_.on("auth", this.onAuth);
        this.talk_.on("invalidPacket", this.onInvalidPacket);
        this.talk_.on("validResponse", this.onValidResponse);
        this.talk_.on("packetTimeout", this.onPacketTimeout);
        this.talk_.on("heartbeat", this.onHeartbeat);
        this.talk_.on("die", this.onClientDied);
        this.talk_.on("userAction", this.onUserAction);
    }

    setClientEndCallback: (callback: (reason: string) => void) => void = (callback: (reason: string) => void): void => {
        this.clientDiedCallback_ = callback;
    }

    private onAuth: (payload: Payload) => void = (payload: Payload): void => {
        // TODO
        this.isClientAuthed_ = true;
        this.acceptPacket(payload);
    }

    private onInvalidPacket: (reason: string) => void = (reason: string): void => {
        if (!this.isClientAuthed_) {
            this.rejectPacket(reason);
        }
    }

    private onHeartbeat: (payload: Payload) => void = (payload: Payload): void => {
        if (this.isClientAuthed_) {
            this.acceptPacket(payload);
        } else {
            this.rejectPacket("not authed");
        }
    }

    private onUserAction: (payload: Payload) => void = (payload: Payload): void => {
        console.log("user action: ");
        console.log(payload);
    }

    private onPacketTimeout: (reason: string) => void = (reason: string): void => {
        this.rejectPacket(reason);
    }

    private onClientDied: (reason: string) => void = (reason: string): void => {
        this.clientDiedCallback_(reason);
    }

    private onValidResponse: (payload: Payload) => void = (payload: Payload): void => {
        this.isRequesting_ = false;
        this.packetResolve_(payload);
        this.packetResolve_ = () => { };
        this.packetReject_ = () => { };
    }

    private acceptPacket: (payload: Payload) => void = (payload: Payload): void => {
        this.isRequesting_ = false;
        this.packetResolve_(payload);
        this.packetResolve_ = () => { };
        this.packetReject_ = () => { };
    }

    private rejectPacket: (reason: string) => void = (reason: string): void => {
        this.isRequesting_ = false;
        this.packetReject_(reason);
        this.packetResolve_ = () => { };
        this.packetReject_ = () => { };
    }

    private requestPacket: (workCallback: (() => void)) => Promise<Payload> = (workCallback: (() => void)): Promise<Payload> => {
        return new Promise<Payload>((resolve: (payload: Payload) => void, reject: (reason: any) => void) => {
            if (this.isRequesting_) {
                reject("packet requesting...");
            } else {
                this.isRequesting_ = true;
                this.packetResolve_ = resolve;
                this.packetReject_ = reject;
                workCallback();
            }
        });
    }

    authenticate: () => Promise<Payload> = (): Promise<Payload> => {
        return this.requestPacket((): void => {
            this.talk_.requestAuthenticate();
        });
    };

    heartbeat: () => Promise<Payload> = (): Promise<Payload> => {
        return this.requestPacket((): void => {
            this.talk_.requestHeartbeat();
        });
    }

    setSingleValue: (port: number, value: number) => void = (port: number, value: number): void => {
        this.talk_.sendSetSingleValue(port, value);
    }



    drop: () => void = (): void => {
        this.talk_.drop();
    }


};

export default SocketClient;