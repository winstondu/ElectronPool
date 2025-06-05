#!/usr/bin/env node

/**
 * get_latest_screenshots.js - Find the latest screenshots on macOS desktop
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { program } = require('commander');

/**
 * Get the path to the user's desktop directory
 * @returns {string} Path to the desktop directory
 */
function getDesktopPath() {
  return path.join(os.homedir(), 'Desktop');
}

/**
 * Find screenshot files on the desktop and return them with their creation times
 * @param {string} desktopPath - Path to the desktop directory
 * @param {number} limit - Maximum number of screenshots to return
 * @returns {Array} Array of objects containing {filePath, fileName, creationTime} sorted by creation time (newest first)
 */
function findScreenshots(desktopPath, limit = 5) {
  try {
    // Read all files in the desktop directory
    const files = fs.readdirSync(desktopPath);
    
    // Filter for screenshot files
    const screenshotFiles = files.filter(file => 
      file.startsWith('Screenshot') && file.endsWith('.png')
    );
    
    // Get creation time for each screenshot
    const screenshotsWithTime = screenshotFiles.map(file => {
      const filePath = path.join(desktopPath, file);
      const stats = fs.statSync(filePath);
      
      // On macOS, birthtime is the creation time
      const creationTime = stats.birthtime;
      
      return {
        filePath,
        fileName: file,
        creationTime
      };
    });
    
    // Sort by creation time (newest first) and limit the results
    screenshotsWithTime.sort((a, b) => b.creationTime - a.creationTime);
    return screenshotsWithTime.slice(0, limit);
  } catch (error) {
    console.error(`Error finding screenshots: ${error.message}`);
    return [];
  }
}

/**
 * Copy screenshots to a destination folder
 * @param {Array} screenshots - Array of screenshot objects
 * @param {string} destination - Destination directory path
 */
function copyScreenshots(screenshots, destination) {
  if (!destination) return;
  
  try {
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }
    
    // Copy files to destination
    screenshots.forEach(screenshot => {
      const destPath = path.join(destination, screenshot.fileName);
      fs.copyFileSync(screenshot.filePath, destPath);
      console.log(`Copied ${screenshot.fileName} to ${destination}`);
    });
  } catch (error) {
    console.error(`Error copying screenshots: ${error.message}`);
  }
}

/**
 * Format date for display
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

// Set up command line arguments
program
  .name('get_latest_screenshots')
  .description('Find the latest screenshots on macOS desktop')
  .option('-n, --number <number>', 'Number of screenshots to find', parseInt, 5)
  .option('-c, --copy <path>', 'Copy screenshots to the specified directory')
  .parse(process.argv);

const options = program.opts();

// Main function
function main() {
  const desktopPath = getDesktopPath();
  const screenshots = findScreenshots(desktopPath, options.number);
  
  if (screenshots.length === 0) {
    console.log('No screenshots found on the desktop.');
    return;
  }
  
  console.log(`Found ${screenshots.length} latest screenshots:`);
  screenshots.forEach((screenshot, index) => {
    console.log(`${index + 1}. ${screenshot.fileName} - ${formatDate(screenshot.creationTime)}`);
  });
  
  // Copy screenshots if destination is provided
  if (options.copy) {
    copyScreenshots(screenshots, options.copy);
  }
}

main();
