# Pawn Package

A Visual Studio Code extension for downloading and managing SAMP/open.mp packages.

## Features

- Download SAMP/open.mp packages from GitHub using the format `owner/repo`
- Automatically detect include and plugin directories in your workspace
- Download include files (.inc) from GitHub repositories
- Download plugin files (.dll and .so) from the latest GitHub releases
- Support for pawno/qawno folder structures
- Smart handling of special plugins and components

## Requirements

- Visual Studio Code 1.93.0 or higher
- A SAMP/open.mp project with at least one of these directories:
  - `pawno/include`
  - `qawno/include`
  - `plugins`

## Installation

You can install this extension from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=dunningkrueg.pawn-package).

There are several ways to install:

1. **Via VSCode Marketplace:**
   - Open VS Code
   - Click the Extensions icon in the sidebar (Ctrl+Shift+X)
   - Search for "Pawn Package"
   - Click Install

2. **Via Quick Open:**
   - Press Ctrl+P
   - Type `ext install dunningkrueg.pawn-package`
   - Press Enter

3. **Via Command Palette:**
   - Press Ctrl+Shift+P
   - Type `Extensions: Install Extension`
   - Type `dunningkrueg.pawn-package`
   - Press Enter

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

The extension supports repositories with:
- Include files (.inc) in the root or in an "include" directory
- Plugin files (.dll and .so) in the latest release assets
- Special plugins that need to be in the root directory
- Component files in dedicated folders

## License

[ISC](LICENSE)

---

Found a bug or have a suggestion? Please open an issue on the GitHub repository. 
