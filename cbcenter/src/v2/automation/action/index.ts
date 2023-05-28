

export type ActionType = {
    channelId: string,
    value: number
};
export type OnActionCallback = () => void



// This is a interface for gear that can connect automation with gear nodule

export default class Action {
    private _onActionCallback: OnActionCallback = () => { };

    constructor() {
        this.onAction = this.onAction.bind(this);
    }


    readonly onAction: (callback: OnActionCallback) => void = (callback: OnActionCallback) => {
        this._onActionCallback = callback;
    }
};