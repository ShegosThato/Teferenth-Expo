# Assets Directory

This directory contains the static assets required by the application.

## Required Files

The following files are referenced in `app.json` but are currently missing:

### 📱 App Icons
- **icon.png** - Main app icon (1024x1024px recommended)
  - Used for: iOS app icon, Android app icon base
  - Format: PNG with transparency
  - TODO: Create or add actual app icon

- **adaptive-icon.png** - Android adaptive icon foreground (1024x1024px)
  - Used for: Android adaptive icon system
  - Format: PNG with transparency
  - Should work well with the background color defined in app.json (#f9fafb)
  - TODO: Create adaptive icon foreground

### 🎨 Splash Screen
- **splash.png** - App splash screen
  - Used for: Loading screen when app starts
  - Format: PNG
  - Should match the background color in app.json (#f9fafb)
  - TODO: Create splash screen design

### 🌐 Web Assets
- **favicon.png** - Web favicon
  - Used for: Browser tab icon when running as web app
  - Format: PNG, typically 32x32px or 64x64px
  - TODO: Create favicon

## Asset Creation Guidelines

### Design Consistency
- Use the app's primary color: #7c3aed (indigo-600)
- Background color: #f9fafb (light gray)
- Follow platform-specific design guidelines

### Technical Requirements
- **iOS Icons**: No transparency, rounded corners applied automatically
- **Android Icons**: Can use transparency, adaptive icons recommended
- **Web Icons**: Standard web favicon formats

### Tools for Creation
- Design: Figma, Sketch, Adobe Illustrator
- Icon generation: App Icon Generator, Expo Icon tools
- Optimization: ImageOptim, TinyPNG

## TODO: Asset Creation Tasks

### High Priority
- [ ] Create main app icon (icon.png)
- [ ] Create splash screen (splash.png)
- [ ] Create adaptive icon (adaptive-icon.png)
- [ ] Create web favicon (favicon.png)

### Design Requirements
- [ ] Ensure icons represent the app's purpose (video/storyboard creation)
- [ ] Test icons on different backgrounds
- [ ] Verify readability at small sizes
- [ ] Follow accessibility guidelines for color contrast

### Technical Tasks
- [ ] Optimize file sizes
- [ ] Test on different devices
- [ ] Verify proper display in app stores
- [ ] Add alternative formats if needed

## Temporary Solution

Until proper assets are created, you can:

1. **Use placeholder images** from online generators
2. **Create simple text-based icons** using design tools
3. **Use Expo's default assets** temporarily
4. **Generate icons** from a simple logo or text

## Notes

- Assets should be optimized for file size without losing quality
- Consider creating multiple sizes for different use cases
- Test assets on actual devices, not just simulators
- Keep source files (AI, PSD, Sketch) for future modifications