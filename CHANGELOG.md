# Changelog

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
- Smooth circular light/dark switching animation restored.

### Housekeeping
- Removed unused files and code, cleaned comments, and corrected `.gitignore`.
