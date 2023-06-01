import React from 'react';
import './App.css';
import SecurityWindow from './security';
import ModeManager, { ModeEnum, ModeManagerListenerType } from './mode_manager';



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

class App extends React.Component<AppPropsType> {
  constructor(props: AppPropsType) {
    super(props);
    this.onModeChanged = this.onModeChanged.bind(this);

    ModeManager.registerListener(this.onModeChanged);
  }
  private readonly onModeChanged: ModeManagerListenerType = (mode: ModeEnum): void => {
    console.log("mode changed to ", mode);
  }

  componentWillUnmount(): void {
    console.log("app unmount");
  }

  render(): React.ReactNode {
    return (
      <div className="App">
        <SecurityWindow />
      </div>
    );
  }
};

export default App;
