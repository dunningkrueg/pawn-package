# Pawn Package

A Visual Studio Code extension for downloading and managing SAMP/open.mp packages.

## ⚠️ Development Status

**IMPORTANT: This extension is currently in early development stage.**

- Only a limited number of packages can be downloaded at this time
- Some repositories may not work correctly due to different structures
- Currently tested with repositories like Y-Less/sscanf
- More features and compatibility improvements will be added in future updates

## Features

- Download SAMP/open.mp packages from GitHub using the format `owner/repo`
- Automatically detect include and plugin directories in your workspace
- Download include files (.inc) from GitHub repositories
- Download plugin files (.dll and .so) from the latest GitHub releases
- Support for pawno/qawno folder structures

## Requirements

- Visual Studio Code 1.93.0 or higher
- A SAMP/open.mp project with at least one of these directories:
  - `pawno/include`
  - `qawno/include`
  - `plugins`

## Installation

1. Download the `.vsix` file from the releases
2. Open VS Code
3. Go to Extensions view (Ctrl+Shift+X)
4. Click on the "..." menu in the top-right corner
5. Select "Install from VSIX..." and choose the downloaded file

## Usage

1. Open your SAMP/open.mp project folder in VS Code
2. Make sure you have at least one of these directories in your workspace:
   - `pawno/include`
   - `qawno/include`
   - `plugins`
3. Press `Ctrl+Shift+P` to open the Command Palette
4. Type `Pawn Package: Download Package` and press Enter
5. Enter the GitHub repository in the format `owner/repo` (e.g., `Y-Less/sscanf`)
6. The extension will download the files to the appropriate directories

## Supported Packages

Currently, the extension works best with repositories that have:
- Include files (.inc) in the root or in an "include" directory
- Plugin files (.dll and .so) in the latest release assets

## Known Issues

- Some repositories with non-standard structures may not download correctly
- Repositories without releases won't have plugin files downloaded
- Deep nested include files might not be detected properly

## Upcoming Features

- Support for more repository structures
- Package dependency management
- Version control for packages
- Custom download locations
- Package update notifications

## License

ISC

---

If you encounter any issues or have suggestions, please report them on the GitHub repository. 