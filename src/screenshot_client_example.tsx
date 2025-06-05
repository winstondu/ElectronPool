import React, { useEffect, useRef, useState } from "react";

const API_URL = "http://localhost:3000/api"; // Adjust as needed

interface Screenshot {
  id: string;
  fileName: string;
  creationTime: string | number;
  // Add any other properties your screenshot object has
}

export default function ScreenshotClientExample() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [status, setStatus] = useState("Connecting to Screenshot API...");
  const [isError, setIsError] = useState(true);
  const [connected, setConnected] = useState(false);
  const [newScreenshotIds, setNewScreenshotIds] = useState<Set<string>>(new Set());

  const eventSourceRef = useRef<EventSource | null>(null);
  const timeoutsRef = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    fetchScreenshots();
    return () => {
      disconnectFromStream();
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
    // eslint-disable-next-line
  }, []);

  async function fetchScreenshots() {
    try {
      const response = await fetch(`${API_URL}/screenshots`);
      if (!response.ok) throw new Error("Failed to fetch screenshots");
      const data: Screenshot[] = await response.json();
      setScreenshots(data);
      updateStatus("Fetched screenshots successfully", false);
    } catch (error: any) {
      updateStatus(`Error: ${error.message}`, true);
    }
  }

  function renderScreenshots() {
    // Not needed in React; rendering is handled by JSX below
  }

  function connectToStream() {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    updateStatus("Connecting to screenshot stream...", false);

    const es = new window.EventSource(`${API_URL}/screenshots/stream`);
    eventSourceRef.current = es;

    es.onopen = () => {
      updateStatus("Connected to screenshot stream", false);
      setConnected(true);
    };

    es.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === "connected") {
        updateStatus("Connected to screenshot stream", false);
      } else if (data.type === "screenshot") {
        const newScreenshot: Screenshot = data.data;
        setNewScreenshotIds((prev) => {
          const next = new Set(prev);
          next.add(newScreenshot.id);
          return next;
        });
        setScreenshots((prev) => {
          const updated = [newScreenshot, ...prev];
          return updated.slice(0, 20);
        });
        updateStatus(`New screenshot detected: ${newScreenshot.fileName}`, false);

        // Remove "new" status after 30 seconds
        if (timeoutsRef.current[newScreenshot.id]) {
          clearTimeout(timeoutsRef.current[newScreenshot.id]);
        }
        timeoutsRef.current[newScreenshot.id] = window.setTimeout(() => {
          setNewScreenshotIds((prev) => {
            const next = new Set(prev);
            next.delete(newScreenshot.id);
            return next;
          });
        }, 30000);
      }
    };

    es.onerror = () => {
      updateStatus("Error connecting to screenshot stream", true);
      disconnectFromStream();
    };
  }

  function disconnectFromStream() {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    updateStatus("Disconnected from screenshot stream", true);
    setConnected(false);
  }

  function updateStatus(message: string, isError: boolean) {
    setStatus(message);
    setIsError(isError);
  }

  return (
    <div className="screenshot-client-root">
      <style>{`
        .screenshot-client-root {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f7;
          color: #333;
        }
        h1 {
          color: #333;
          border-bottom: 1px solid #ddd;
          padding-bottom: 10px;
        }
        .status {
          padding: 10px;
          margin: 10px 0;
          border-radius: 5px;
          background-color: #e8f5e9;
          border-left: 5px solid #4caf50;
        }
        .status.disconnected {
          background-color: #ffebee;
          border-left: 5px solid #f44336;
        }
        .screenshot-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        .screenshot-card {
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }
        .screenshot-card:hover {
          transform: translateY(-5px);
        }
        .screenshot-card img {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-bottom: 1px solid #eee;
        }
        .screenshot-info {
          padding: 15px;
        }
        .screenshot-info h3 {
          margin: 0 0 10px 0;
          font-size: 16px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .screenshot-info p {
          margin: 5px 0;
          font-size: 14px;
          color: #666;
        }
        .new-badge {
          background-color: #ff3b30;
          color: white;
          font-size: 12px;
          padding: 3px 8px;
          border-radius: 10px;
          margin-left: 5px;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        .controls {
          margin: 20px 0;
          display: flex;
          gap: 10px;
        }
        button {
          background-color: #0071e3;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }
        button:hover {
          background-color: #005bbd;
        }
        button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
      `}</style>
      <h1>Screenshot Monitor</h1>
      <div className={`status${isError ? " disconnected" : ""}`}>{status}</div>
      <div className="controls">
        <button onClick={fetchScreenshots}>Refresh Screenshots</button>
        <button onClick={connectToStream} disabled={connected}>Connect to Stream</button>
        <button onClick={disconnectFromStream} disabled={!connected}>Disconnect</button>
      </div>
      <div className="screenshot-grid">
        {screenshots.length === 0 ? (
          <p>No screenshots found.</p>
        ) : (
          screenshots.map((screenshot) => (
            <div className="screenshot-card" key={screenshot.id}>
              <img
                src={`${API_URL}/screenshots/${screenshot.id}/file`}
                alt={screenshot.fileName}
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22300%22%20height%3D%22200%22%20fill%3D%22%23cccccc%22%2F%3E%3Ctext%20x%3D%22150%22%20y%3D%22100%22%20font-size%3D%2214%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20fill%3D%22%23333333%22%3EImage%20not%20available%3C%2Ftext%3E%3C%2Fsvg%3E";
                }}
              />
              <div className="screenshot-info">
                <h3>
                  {screenshot.fileName}{" "}
                  {newScreenshotIds.has(screenshot.id) && (
                    <span className="new-badge">NEW</span>
                  )}
                </h3>
                <p>
                  Created: {new Date(screenshot.creationTime).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}