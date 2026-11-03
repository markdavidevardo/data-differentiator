# Data Differentiator

An offline Windows app that compares two lists of names and values, matches similar names and shows what changed.

Built with TypeScript, React, Vite, Tailwind CSS and Electron.

## Features
- Paste or type two datasets and see matches, changed values and entries that appear in only one list.
- Fuzzy name matching, with manual matching and "Not Match" overrides.
- Undo and redo for every change.
- History of saved comparisons, JSON backup and restore, PDF and CSV export.
- Light, dark or automatic theme.

## Development
Requires Node.js 22 or newer.

```
npm install
npm run dev        # run in the browser at http://localhost:3000
npm test           # unit tests
npm run lint       # type check
npm run electron   # run the desktop app (after npm run build)
```

## Build the Windows app
Double-click `build-app.bat`, or run:

```
npm ci
npm run dist
```

The `release` folder will contain `DataDifferentiator-Setup.exe` and `DataDifferentiator-Portable.exe`.
