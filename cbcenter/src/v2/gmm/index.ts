import CoobocGearManager from "./cooboc_gear/cooboc_gear_manager";

type OnGearConnectedCallback = () => void;
type OnGearDisconnectedCallback = () => void;

export default class GearManager {

    private _onGearConnectedCallback: OnGearConnectedCallback = () => { };
    private _onGearDisconnectedCallback: OnGearDisconnectedCallback = () => { };

    private readonly _coobocGearManager: CoobocGearManager = new CoobocGearManager();

    constructor() {
        this.onGearConnected = this.onGearConnected.bind(this);
        this.onGearDisconnected = this.onGearDisconnected.bind(this);
        this.setOutputValue = this.setOutputValue.bind(this);

    }

    readonly onGearConnected = (callback: OnGearConnectedCallback): void => {
        this._onGearConnectedCallback = callback;
    };
    readonly onGearDisconnected = (callback: OnGearDisconnectedCallback): void => {
        this._onGearDisconnectedCallback = callback;
    };



    // start = (): Promise<void> => {
    //     return new Promise<void>((resolve: () => void, reject: () => void): void => {
    //         this._coobocGearManager.start().then(() => {
    //             resolve();
    //         }).catch(() => {
    //             reject();
    //         })
    //     });
    // }
    readonly start = async (): Promise<void> => {
        await this._coobocGearManager.start();
    }

    readonly setOutputValue = (gearId: string, outputChannel: number, targetValue: number): void => {
        if (this._coobocGearManager.hasGear(gearId)) {
            this._coobocGearManager.setGear(gearId, outputChannel, targetValue);
            console.log("has this id");
        } else {
            console.log("no id");
        }
    }


};