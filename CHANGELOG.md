# Changelog

## 1.3.0
### Added
- Copy text from anywhere in the app. Names, values and other text can now be selected with the mouse and copied with Ctrl+C.
- Right-click menu with Copy, Paste, Select all and "Copy all text on this screen".
- Ctrl+Shift+C copies all the text on the current screen. Tables are copied one row per line, so they paste straight into Excel.

### Fixed
- Dataset B values in the Data Editor were blue in dark mode. They now match Dataset A.

### Changed
- Replaced the "Panel 1 / Panel 2" labels in the Bulk Paste dialog, PDF and CSV export with "Name" and "Value".
- Cleaned up code comments and removed leftover template headers.

## 1.2.0
### Changed
- Removed the A / B badge from the entry action buttons and edit dialog.
- One font (Segoe UI Variable, the Windows 11 system font) used everywhere. Falls back to Segoe UI on Windows 10.
- The Clear button on the home screen is now an eraser labelled "Clear" instead of a trash can.
- Window buttons (minimize, maximize, close) sit flush against the top-right corner of the screen.
- The whole empty title bar can be used to drag the window, also when the window is not maximized.

### Fixed
- Edited entries no longer jump back to an earlier value after repeated or heavy editing. Every change now builds on the newest data.
- Number cells no longer snap back to 0 while you type, clear the field or enter a decimal point.

### Housekeeping
- Removed unused files and code, cleaned comments, and corrected `.gitignore`.
