# Pawn Package

Pawn Package is a Visual Studio Code extension designed to simplify the management of SAMP/open.mp packages. This extension allows you to download and organize plugins and include files automatically from various sources.

## Features

- **Download Packages**: Easily download plugins and include files from GitHub or alternative sources.
- **Auto-Organize**: Automatically organizes downloaded files into the correct directories.
- **Multiple Sources**: Supports downloading from GitHub, mirrors, and direct links.
- **Fallback Mechanism**: Attempts alternative sources if the primary source fails.

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/openmultiplayer/pawn-package.git
   ```
2. Navigate to the project directory:
   ```bash
   cd pawn-package
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Compile the extension:
   ```bash
   npm run compile
   ```
5. Run the extension in VSCode:
   - Press `F5` to open a new VSCode window with the extension installed.

## Usage

1. Open the Command Palette (Ctrl+Shift+P).
2. Type `Pawn Package: Download Package`.
3. Enter the package name in the format `owner/repo` or a direct URL.

## Contribution

Contributions are welcome! Please fork this repository and submit a pull request for any improvements or new features.

## License

This project is licensed under the [MIT License](LICENSE).
