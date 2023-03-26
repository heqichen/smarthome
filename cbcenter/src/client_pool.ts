import { Payload } from "./gear_talk";
import SocketClient, { GearSignature } from "./socket_client";

type ClientStatus = {
    id: string;
    talkFailedNum: number;
    isDirty: boolean;
};

export default class ClientPool {

    private readonly clientList_: Map<string, SocketClient> = new Map<string, SocketClient>();
    private readonly clientStatusList_: Map<string, ClientStatus> = new Map<string, ClientStatus>();
    private readonly heartbeatTimer_: NodeJS.Timer;
    constructor() {
        this.clientList_.clear();
        this.clientStatusList_.clear();
        this.heartbeatTimer_ = setInterval(this.heartbeatRoutine, 3000);
    }

    push: (socketClient: SocketClient, signature: GearSignature) => void = (socketClient: SocketClient, signature: GearSignature): void => {
        if (this.clientList_.has(signature.id)) {
            console.error(signature.id, " already in the pool, close the coming one");
            socketClient.drop();
        }
        this.clientList_.set(signature.id, socketClient);
        this.clientStatusList_.set(signature.id, {
            id: signature.id,
            talkFailedNum: 0,
            isDirty: false
        });
        // this.clientList_.push(socketClient);
        // const status:ClientStatus = {
        //     id: socketClient.
        // };
    }

    heartbeatRoutine: () => void = (): void => {
        // copy a name list from client list;

        const clientIdList: string[] = JSON.parse(JSON.stringify(Array.from(this.clientList_.keys()))) as string[]
        console.log("client list: ", clientIdList);

        clientIdList.forEach((id: string) => {
            this.clientList_.get(id)?.heartbeat().then((payload: Payload) => {
                console.log("heartbeat good who you are?", id);
            }).catch((reason: string) => {
                console.log("hearbeat error, ", id);
            });
        });

        // () => {
        //     for (let i = 0; i < this.clientList_.length; ++i) {
        //         this.clientList_[i].heartbeat().then(() => {
        //             console.log("heartbeat success");
        //         }).catch((reason: any) => {
        //             console.log("heartbeat failed", reason)
        //         });
        //     }
        // }

    }
};