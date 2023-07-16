
export enum ModeEnum {
    SECURITY_IDLE = "SECURITY_IDLE",
    SECURITY_AUTHENTICATING = "SECURITY_AUTHENTICATING"
};
export type ModeManagerListenerType = (mode: ModeEnum) => void;

class ModeManager {
    private _id: number = 0;
    private readonly _listenerList: Map<number, ModeManagerListenerType> = new Map<number, ModeManagerListenerType>();
    private _mode: ModeEnum = ModeEnum.SECURITY_IDLE;

    constructor() {
        this.registerListener = this.registerListener.bind(this);
        this.makeId = this.makeId.bind(this);
        this.changeMode = this.changeMode.bind(this);

        this._listenerList.clear();
    }
    readonly registerListener: (listener: ModeManagerListenerType) => void = (listener: ModeManagerListenerType): void => {
        const id = this.makeId();
        console.log(id, " listener registered");
        this._listenerList.set(id, listener);
    }

    readonly changeMode: (newMode: ModeEnum) => void = (newMode: ModeEnum): void => {
        this._mode = newMode;
        console.log("request change mode to ", newMode);
        this._listenerList.forEach((listener: ModeManagerListenerType) => {
            listener(newMode);
        });
    }


    private readonly makeId: () => number = (): number => {
        this._id++;
        return this._id;
    }
};

const GModeManager: ModeManager = new ModeManager();
export default GModeManager;
