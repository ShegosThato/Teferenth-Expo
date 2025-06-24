# Asset Conversion Instructions

## Placeholder Assets Created ✅

The following SVG placeholder assets have been created:

- icon.svg - Main app icon (1024x1024)
- splash.svg - Splash screen (1242x2436)
- adaptive-icon.svg - Android adaptive icon (1024x1024)
- favicon.svg - Web favicon (64x64)

## Converting SVG to PNG

### Option 1: Online Conversion (Recommended)
1. Visit https://convertio.co/svg-png/ or https://cloudconvert.com/svg-to-png
2. Upload each SVG file from the assets/ directory
3. Download the converted PNG files
4. Replace the SVG files with PNG files (keep the same names)

### Option 2: Using Command Line (if you have ImageMagick)
```bash
cd assets
magick icon.svg icon.png
magick splash.svg splash.png  
magick adaptive-icon.svg adaptive-icon.png
magick favicon.svg favicon.png
```

### Option 3: Using Design Tools
1. Open each SVG file in Figma, Sketch, or Adobe Illustrator
2. Export as PNG with the correct dimensions
3. Save in the assets/ directory

## Testing the App

After converting to PNG:
```bash
# Test the app build
npm run ios
# or
npm run android
# or  
npm run web
```

## Current Status
- [x] SVG placeholders created
- [ ] Convert SVG to PNG files
- [ ] Test app build
- [ ] Replace with final designs (optional)

## Design Notes
- **Colors**: Purple (#7c3aed) matches app theme
- **Text**: "TS" for Tefereth Scripts
- **Style**: Clean, modern, readable at small sizes
- **Background**: Light gray (#f9fafb) for splash screen

These placeholders will work perfectly for development and testing!