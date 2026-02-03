# Breeze Icons

This directory contains KDE Breeze-style icons for the daedalOS Breeze theme.

## Directory Structure

```
Breeze/
├── 16x16/
├── 32x32/
├── 48x48/
├── 96x96/
└── 144x144/
```

## Icon Sources

Icons should be sourced from the KDE Breeze Icons project:
https://github.com/KDE/breeze-icons

The Breeze Icons are licensed under LGPL-3.0.

## Key Icons Needed

| Icon Name | Purpose |
|-----------|---------|
| folder.webp | Default folder icon |
| folder-open.webp | Open folder icon |
| user-home.webp | Home folder |
| audio-x-generic.webp | Audio files |
| video-x-generic.webp | Video files |
| image-x-generic.webp | Image files |
| text-x-generic.webp | Text files |
| application-x-executable.webp | Executables |
| utilities-terminal.webp | Terminal app |
| system-file-manager.webp | File explorer |

## Converting Icons

1. Download SVG icons from KDE Breeze Icons repository
2. Convert to WebP at each resolution:
   - 16x16, 32x32, 48x48, 96x96, 144x144
3. Use naming convention: `iconname.webp`

## Usage

The `BREEZE_ICON_PATH` constant in `utils/constants.ts` points to this directory.
Theme-aware icon loading can be implemented by checking `theme.name === "Breeze"`
and using this path instead of the default `ICON_PATH`.
