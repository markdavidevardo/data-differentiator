# Data Differentiator

A desktop app for Windows that compares two lists of names and values, matches similar names even when they are spelled or ordered differently, and shows what is identical, changed, or missing. It works fully offline.

## Features

- Paste lists straight from Excel, or type entries by hand
- Fuzzy name matching that ignores capitalization, symbols and word order
- Dashboard with totals, differences and filters for each status
- Manual matching, "Not a match" splitting, and A → Z / Z → A sorting
- Undo and redo for every change
- Save comparisons to History and restore them later
- Export results to PDF or CSV
- Backup and restore all data as a JSON file
- Light, dark and automatic themes

## Getting started

You need [Node.js](https://nodejs.org) 22 or newer.

```bash
npm install
npm run dev
```

Other commands:

```bash
npm run build   # production build of the web app
npm run lint    # type check
npm test        # unit tests
npm run electron  # run the desktop app (after npm run build)
```

## Build the Windows app

On Windows, double-click `build-app.bat`, or run:

```bash
npm run dist
```

The installer and the portable version are created in the `release` folder.

## Notes

- All data is stored locally on your computer. Nothing is uploaded.
- Do not commit exported backups or real data files to this repository.

## Author

Mark David Evardo
