import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

function App() {
  const { getScreenshots, onScreenshotsUpdated, openFile } = window.electron;
  const [shots, setShots] = useState<string[]>([]);

  useEffect(() => {
    // initial load
    getScreenshots().then(setShots).catch(console.error);

    // subscribe to updates
    onScreenshotsUpdated(setShots);
  }, []);

  return (
    <div className="main-container">
      <h2>Latest Screenshots</h2>
      {shots.length === 0 ? (
        <p>No screenshots found.</p>
      ) : (
        <div className="grid">
          {shots.map((p) => (
            <div key={p} className="grid-item" onClick={() => openFile(p)}>
              <img src={`file://${p}`} />
              <span className="name">{p.split(/[/\\]/).pop()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
