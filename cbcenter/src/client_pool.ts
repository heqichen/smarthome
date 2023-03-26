import { Payload } from "./gear_talk";
import SocketClient, { GearSignature } from "./socket_client";

type ClientStatus = {
    id: string;
    talkFailedNum: number;
    isDirty: boolean;
};

const CLIENT_FAILED_NUM_THRESHOLD: number = 3;


export default class ClientPool {
    private readonly clientList_: Map<string, SocketClient> = new Map<string, SocketClient>();
    private readonly clientStatusList_: Map<string, ClientStatus> = new Map<string, ClientStatus>();
    private readonly dirtyClient_: Set<string> = new Set<string>;
    private readonly heartbeatTimer_: NodeJS.Timer;
    constructor() {
        this.push = this.push.bind(this);
        this.heartbeatRoutine = this.heartbeatRoutine.bind(this);

        this.clientList_.clear();
        this.clientStatusList_.clear();
        this.dirtyClient_.clear();
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
        socketClient.setClientEndCallback((reason: string) => {
            console.log("client end ", signature.id, reason);
            socketClient.drop();
            this.dirtyClient_.add(signature.id);
        });
    }

    heartbeatRoutine: () => void = (): void => {
        // delete dirty clients
        this.dirtyClient_.forEach((id: string) => {
            this.clientList_.get(id)?.drop();
            this.clientList_.delete(id);
            this.clientStatusList_.delete(id);
            console.log(id, " has been removed");
        });

        this.dirtyClient_.clear();


        // copy a name list from client list;
        const clientIdList: string[] = JSON.parse(JSON.stringify(Array.from(this.clientList_.keys()))) as string[]
        console.log("client list: ", clientIdList);

        clientIdList.forEach((id: string) => {
            this.clientList_.get(id)?.heartbeat().then((payload: Payload) => {
                console.log("heartbeat good who you are?", id);
                // update status
                const clientStatus: ClientStatus = this.clientStatusList_.get(id) as ClientStatus;
                clientStatus.talkFailedNum = 0;
                this.clientStatusList_.set(id, clientStatus);
            }).catch((reason: string) => {
                console.log("heartbeat error, ", id);
                // Update status
                const clientStatus: ClientStatus = this.clientStatusList_.get(id) as ClientStatus;
                clientStatus.talkFailedNum++;
                this.clientStatusList_.set(id, clientStatus);
                if (clientStatus.talkFailedNum >= CLIENT_FAILED_NUM_THRESHOLD) {
                    this.dirtyClient_.add(id);
                }
            });
        });
    }
};