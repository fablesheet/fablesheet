# Installation

Download the latest build for your platform from the [Releases page](https://github.com/fablesheet/fablesheet/releases).

Builds are not code-signed yet, so your operating system may warn you the first time you open Fablesheet.

## Windows

Download the `.msi` or `.exe` installer and run it. The installer sets up WebView2 automatically if it is missing.

> SmartScreen may show "Windows protected your PC". Click **More info → Run anyway**.

## macOS

Download the `.dmg`, open it and drag Fablesheet into Applications.

> Gatekeeper may block the unsigned app. Right-click the app, choose **Open** and confirm. Alternatively run:
>
> ```bash
> xattr -d com.apple.quarantine /Applications/Fablesheet.app
> ```

## Linux

- **AppImage** (most distributions): make it executable and run it.
  ```bash
  chmod +x Fablesheet_*.AppImage
  ./Fablesheet_*.AppImage
  ```
  On Arch, EndeavourOS and Manjaro, AppImages need FUSE 2: `sudo pacman -S fuse2`. Alternatively start it with `APPIMAGE_EXTRACT_AND_RUN=1 ./Fablesheet_*.AppImage`.
- **Debian / Ubuntu**: `sudo dpkg -i Fablesheet_*.deb`
- **Fedora / openSUSE**: `sudo rpm -i Fablesheet-*.rpm`
