#!/usr/bin/env node

/**
 * screenshot_api.js - API server that monitors for new screenshots and provides endpoints
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const chokidar = require('chokidar');
const cors = require('cors');
const { EventEmitter } = require('events');

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Event emitter for screenshot events
const screenshotEvents = new EventEmitter();

// Get the path to the user's desktop directory
function getDesktopPath() {
  return path.join(os.homedir(), 'Desktop');
}

// Store recent screenshots
const recentScreenshots = [];
const MAX_STORED_SCREENSHOTS = 50;

// Set up file watcher for the desktop
const desktopPath = getDesktopPath();
const watcher = chokidar.watch(desktopPath, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 100
  }
});

// Function to check if a file is a screenshot
function isScreenshot(filePath) {
  const fileName = path.basename(filePath);
  return fileName.startsWith('Screenshot') && fileName.endsWith('.png');
}

// Handle new files
watcher.on('add', filePath => {
  if (isScreenshot(filePath)) {
    const stats = fs.statSync(filePath);
    const screenshot = {
      id: Date.now().toString(),
      filePath,
      fileName: path.basename(filePath),
      creationTime: stats.birthtime,
      timestamp: new Date()
    };
    
    console.log(`New screenshot detected: ${screenshot.fileName}`);
    
    // Add to recent screenshots
    recentScreenshots.unshift(screenshot);
    
    // Trim the list if it gets too long
    if (recentScreenshots.length > MAX_STORED_SCREENSHOTS) {
      recentScreenshots.pop();
    }
    
    // Emit event
    screenshotEvents.emit('new-screenshot', screenshot);
  }
});

// API Routes

// Get recent screenshots
app.get('/api/screenshots', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  res.json(recentScreenshots.slice(0, limit));
});

// Get a specific screenshot by ID
app.get('/api/screenshots/:id', (req, res) => {
  const screenshot = recentScreenshots.find(s => s.id === req.query.id);
  
  if (!screenshot) {
    return res.status(404).json({ error: 'Screenshot not found' });
  }
  
  res.json(screenshot);
});

// Stream screenshots (Server-Sent Events)
app.get('/api/screenshots/stream', (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send initial data
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
  
  // Handler for new screenshots
  const newScreenshotHandler = (screenshot) => {
    res.write(`data: ${JSON.stringify({ type: 'screenshot', data: screenshot })}\n\n`);
  };
  
  // Register event listener
  screenshotEvents.on('new-screenshot', newScreenshotHandler);
  
  // Clean up when client disconnects
  req.on('close', () => {
    screenshotEvents.removeListener('new-screenshot', newScreenshotHandler);
  });
});

// Serve screenshot files
app.get('/api/screenshots/:id/file', (req, res) => {
  const screenshot = recentScreenshots.find(s => s.id === req.params.id);
  
  if (!screenshot) {
    return res.status(404).json({ error: 'Screenshot not found' });
  }
  
  res.sendFile(screenshot.filePath);
});

// Start the server
app.listen(port, () => {
  console.log(`Screenshot API server running on port ${port}`);
  console.log(`Monitoring for screenshots on: ${desktopPath}`);
});
