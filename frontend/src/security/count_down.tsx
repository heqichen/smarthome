import React from 'react';


type SecurityCountDownPanePropsType = {};
type SecurityCountDownPaneStateType = {
    countDownSeconds: number;
};


export default class SecurityCountDownPane extends React.Component<SecurityCountDownPanePropsType, SecurityCountDownPaneStateType> {
    private _countDownSeconds: number = 15;



    constructor(props: SecurityCountDownPanePropsType) {
        super(props);
        this.setState({
            countDownSeconds: this._countDownSeconds
        });

        this.handleCountTime = this.handleCountTime.bind(this);

        setInterval(this.handleCountTime, 1000);
    }

    private readonly handleCountTime: () => void = (): void => {
        console.log("down")
        this._countDownSeconds--;
        this.setState({
            countDownSeconds: this._countDownSeconds
        });
    }

    render: () => React.ReactNode = (): React.ReactNode => {
        console.log(this._countDownSeconds);
        return (<div>请在{this.state.countDownSeconds}秒内输入正确的密码</div>)
    }
};