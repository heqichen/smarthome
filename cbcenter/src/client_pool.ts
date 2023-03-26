import SocketClient, { GearSignature } from "./socket_client";

type ClientStatus = {
    id: string;
    talkFailedNum: number;
    isDirty: boolean;
};

export default class ClientPool {
    private readonly clientList_: SocketClient[] = [];
    private readonly heartbeatTimer_: NodeJS.Timer
    constructor() {
        this.heartbeatTimer_ = setInterval(() => {
            for (let i = 0; i < this.clientList_.length; ++i) {
                this.clientList_[i].heartbeat().then(() => {
                    console.log("heartbeat success");
                }).catch((reason: any) => {
                    console.log("heartbeat failed", reason)
                });
            }
        }, 3000);
    }

    push: (socketClient: SocketClient, signature: GearSignature) => void = (socketClient: SocketClient, signature: GearSignature): void => {
        this.clientList_.push(socketClient);
        // const status:ClientStatus = {
        //     id: socketClient.
        // };
    }
};