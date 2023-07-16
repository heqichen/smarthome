import React from 'react';
import "./index.css"

import "./button.css"
import GModeManager, { ModeEnum } from '../mode_manager';
import SecurityCountDownPane from './count_down';

type ButtonPropsType = {
    children?: any
    onclick: () => void
};
class Button extends React.Component<ButtonPropsType> {
    constructor(props: ButtonPropsType) {
        super(props);
    }
    readonly render: () => React.ReactNode = (): React.ReactNode => {
        return (<div className="button" onClick={this.props.onclick}>{this.props.children}</div>);
    }
}


export enum SecurityStateEnum {
    IDLE = 0,
    COUNT_DOWN = 1,
    ALARM = 2,
    LOCKED = 3,
    WELCOME = 4
};

export type SecurityPropsType = {
    state: SecurityStateEnum;
};
class SecurityWindow extends React.Component<SecurityPropsType> {
    constructor(props: SecurityPropsType) {
        super(props);
        this.onBackHomeClick = this.onBackHomeClick.bind(this);
        this.handleIdle = this.handleIdle.bind(this);
    }
    private onBackHomeClick: () => void = (): void => {
        GModeManager.changeMode(ModeEnum.SECURITY_AUTHENTICATING);
    }

    private handleIdle: () => React.ReactNode = (): React.ReactNode => {
        return (<React.Fragment>
            <h1>Security</h1>
            <Button onclick={this.onBackHomeClick}>Back home</Button>
        </React.Fragment>);
    }

    private handleCountDown: () => React.ReactNode = (): React.ReactNode => {
        return (<SecurityCountDownPane />);
    }

    readonly render: () => React.ReactNode = (): React.ReactNode => {
        console.log("!!!!!!!!!!!!!!!!change to state: ", this.props.state);
        switch (this.props.state) {
            case (SecurityStateEnum.IDLE): return this.handleIdle();
            case (SecurityStateEnum.COUNT_DOWN): return this.handleCountDown();
            default: return (<div>ERROR</div>);
        }
    }
};

export default SecurityWindow;