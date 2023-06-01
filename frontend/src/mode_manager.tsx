
export enum ModeEnum {
    SECURITY = 0,
};
export type ModeManagerListenerType = (mode: ModeEnum) => void;

class _ModeManager {
    private _id: number = 0;
    private readonly _listenerList: Map<number, ModeManagerListenerType> = new Map<number, ModeManagerListenerType>();
    private _mode: ModeEnum = ModeEnum.SECURITY;

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
        this._listenerList.forEach((listener: ModeManagerListenerType) => {
            listener(newMode);
        });
    }


    private readonly makeId: () => number = (): number => {
        this._id++;
        return this._id;
    }


};

const ModeManager: _ModeManager = new _ModeManager();
export default ModeManager;
