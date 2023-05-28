import moment from "moment";
import Action, { ActionType } from "../action"

type CoobocTimeType = {
    hour: number,
    minute: number,
    second: number
};


type TimedActionType = {
    time: CoobocTimeType,
    action: ActionType
};

type MomentTimedActionType = {
    moment: moment.Moment,
    timedAction: TimedActionType
};



export default class Cosh {
    private _schedule: Map<number, TimedActionType> = new Map<number, TimedActionType>();
    private _todoList: Map<number, MomentTimedActionType> = new Map<number, MomentTimedActionType>();
    private _lastTickDate: number = -1;

    constructor() {
        console.log("hey?");
        this.addTimeAutomation = this.addTimeAutomation.bind(this);
        this.timeTick = this.timeTick.bind(this);
        this.willTriggerToday = this.willTriggerToday.bind(this);
        this.triggerAction = this.triggerAction.bind(this);
        this.checkAndAddTodoList = this.checkAndAddTodoList.bind(this);
        this.debug = this.debug.bind(this);


        this._schedule.clear();
        this._lastTickDate = moment().date();

        setInterval(this.timeTick, 100);

    }

    private readonly willTriggerToday: (actionTime: moment.Moment) => boolean = (actionTime: moment.Moment): boolean => {
        const now: moment.Moment = moment();
        return now.isBefore(actionTime);
    }

    private readonly timeTick: () => void = () => {
        // 1. fetch current date
        const currentTime: moment.Moment = moment();
        if (currentTime.date() === this._lastTickDate) {
            const keys: number[] = Array.from(this._todoList.keys());
            for (let i = 0; i < keys.length; ++i) {
                const key: number = keys[i];
                const momentTimedAction: MomentTimedActionType = this._todoList.get(key) as MomentTimedActionType;
                if (currentTime.isSameOrAfter(momentTimedAction.moment)) {
                    // trigger this action
                    this.triggerAction(key, momentTimedAction.timedAction.action);
                    this._todoList.delete(key);
                }
            }
            console.log(this._todoList);
        } else {
            // 1. trigger clear all todo list
            // 2. put action from item to list
            this._todoList.forEach((momentAction: MomentTimedActionType, key: number): void => {
                this.triggerAction(key, momentAction.timedAction.action);
            });
            this._todoList.clear();

            // reform todo list
            this._schedule.forEach((timedAction: TimedActionType, key: number): void => {
                if (!this.checkAndAddTodoList(timedAction, key)) {
                    this.triggerAction(key, timedAction.action);
                }
            });

            // update date
            this._lastTickDate = currentTime.date();
        }
    }

    private readonly triggerAction: (key: number, action: ActionType) => void = (key: number, action: ActionType): void => {
        console.log("action trigger");
    }

    private readonly checkAndAddTodoList: (timedAction: TimedActionType, key: number) => boolean = (timedAction: TimedActionType, key: number): boolean => {
        const actionTime: moment.Moment = moment().hour(timedAction.time.hour).minute(timedAction.time.minute).second(timedAction.time.second);
        if (this.willTriggerToday(actionTime)) {
            this._todoList.set(key, { moment: actionTime, timedAction: timedAction });
            return true;
        }
        return false;
    }


    readonly addTimeAutomation: (key: number, time: CoobocTimeType, action: ActionType) => void = (key: number, time: CoobocTimeType, action: ActionType) => {
        const timedAction: TimedActionType = { "time": time, "action": action }
        // add to schedule list
        this._schedule.set(key, timedAction);
        // check whether the time is already passed
        this.checkAndAddTodoList(timedAction, key);
    }

    debug() {
        this._lastTickDate = -1;
    }
}