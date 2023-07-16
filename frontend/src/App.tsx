import React from 'react';
import './App.css';
import SecurityWindow, { SecurityPropsType, SecurityStateEnum } from './security';
import GModeManager, { ModeEnum, ModeManagerListenerType } from './mode_manager';



// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.tsx</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }



type AppPropsType = {

};

type AppStateType = {
  securityProps: SecurityPropsType
}

class App extends React.Component<AppPropsType, AppStateType> {
  private _isSecurityWindow: boolean = true;
  private _securityProps: SecurityPropsType = {
    state: SecurityStateEnum.IDLE
  }

  constructor(props: AppPropsType) {
    super(props);
    this.onModeChanged = this.onModeChanged.bind(this);
    this.renderWindow = this.renderWindow.bind(this);

    GModeManager.registerListener(this.onModeChanged);
  }
  private readonly onModeChanged: ModeManagerListenerType = (mode: ModeEnum): void => {
    console.log("mode changed to ", mode);
    switch (mode) {
      case (ModeEnum.SECURITY_IDLE): {
        this._isSecurityWindow = true;
        this._securityProps = {
          state: SecurityStateEnum.IDLE
        }
        break;
      }
      case (ModeEnum.SECURITY_AUTHENTICATING): {
        this._isSecurityWindow = true;
        this._securityProps = {
          state: SecurityStateEnum.COUNT_DOWN
        }
        break;
      }
      default: {
        console.error("ERROR, no mode detected");
      }
    }
    this.setState({ securityProps: this._securityProps });
  }

  componentWillUnmount(): void {
    console.log("app unmount");
  }

  private readonly renderWindow: () => React.ReactNode = (): React.ReactNode => {
    if (this._isSecurityWindow) {
      return <SecurityWindow {...this._securityProps} />
    } else {
      return (<div>ERROR</div>)
    }
  }

  render(): React.ReactNode {
    return (
      <div className="App">
        {this.renderWindow()}
      </div>
    );
  }
};

export default App;
