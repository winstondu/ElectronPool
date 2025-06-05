# Mac Screenshot Finder

A Node.js utility to find and manage the latest screenshots on your macOS desktop.

## Features

- Automatically finds screenshots on your Mac desktop
- Displays the most recent screenshots with their timestamps
- Option to specify how many screenshots to display
- Option to copy screenshots to another directory

## Installation

1. Make sure you have Node.js installed on your Mac
2. Install the required dependency:

```bash
npm install commander
```

3. Make the script executable:

```bash
chmod +x get_latest_screenshots.js
```

## Usage

Run the script directly:

```bash
./get_latest_screenshots.js
```

Or using Node:

```bash
node get_latest_screenshots.js
```

### Command Line Options

- `-n, --number <number>`: Number of screenshots to find (default: 5)
- `-c, --copy <path>`: Copy screenshots to the specified directory

### Examples

Show the 5 most recent screenshots (default):
```bash
node get_latest_screenshots.js
```

Show the 10 most recent screenshots:
```bash
node get_latest_screenshots.js -n 10
```

Copy the 3 most recent screenshots to a folder:
```bash
node get_latest_screenshots.js -n 3 -c ~/Documents/saved_screenshots
```

## How It Works

The script:

1. Locates your Desktop folder
2. Finds all files matching the "Screenshot*.png" pattern (the standard macOS screenshot naming convention)
3. Sorts them by creation time, with newest first
4. Displays the most recent screenshots with their timestamps
5. Optionally copies them to a specified directory

## Requirements

- macOS (uses macOS screenshot naming conventions)
- Node.js 12.0.0 or higher
- Commander.js package
