import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';

// Define the electron API exposed from preload.ts
declare global {
  interface Window {
    electron: {
      openBrowser: (browser: string) => void;
      openVSCode: () => void;
      openHome: () => void;
      openGitHub: () => void;
      quitApp: () => void;
    };
  }
}

const browsers = ['Firefox', 'Librewolf', 'Brave Browser', 'Google Chrome', 'Microsoft Edge'];

function App(): React.ReactElement {
  const { openBrowser, openVSCode, openHome, openGitHub, quitApp } = window.electron;
  
  return (
    <div className="container">
      <h3>Menu Barmaid</h3>
      
      <div className="group">
        {browsers.map(browser => (
          <button key={browser} onClick={() => openBrowser(browser)}>
            {browser}
          </button>
        ))}
      </div>
      
      <hr />
      
      <div className="group">
        <button onClick={openVSCode}>VS Code</button>
        <button onClick={openHome}>Home</button>
        <button onClick={openGitHub}>GitHub</button>
      </div>
      
      <hr />
      
      <button className="quit" onClick={quitApp}>
        Quit
      </button>
    </div>
  );
}

// Create React root and render the App
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
