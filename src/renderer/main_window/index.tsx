import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';

function App() {
  return (
    <div className="main-container">
      <h2>Main Window</h2>
      <p>This is the main Electron window rendered with React</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
