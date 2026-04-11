# Assets Required

Place the following files in this directory:

| File | Size | Purpose |
|------|------|---------|
| `icon.png` | 1024x1024 px | App icon (required) |
| `splash.png` | 1284x2778 px | Splash screen image |
| `adaptive-icon.png` | 1024x1024 px | Android adaptive icon foreground |

## Quick Placeholder
For local testing, you can copy any square PNG and rename it to the above names.

```bash
# Example using a solid color placeholder (requires imagemagick):
magick -size 1024x1024 xc:#FF6B35 icon.png
magick -size 1024x1024 xc:#FF6B35 adaptive-icon.png
magick -size 1284x2778 xc:#0a0a0a splash.png
```
