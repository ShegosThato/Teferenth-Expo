# Android Build Instructions for Tefereth Scripts

## 🚀 Prerequisites

### 1. Install Node.js and npm
```bash
# Install Node.js 18+ (recommended: use nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### 2. Install Expo CLI
```bash
npm install -g @expo/cli
npm install -g eas-cli
```

### 3. Android Development Setup
```bash
# Install Android Studio from https://developer.android.com/studio
# Set up Android SDK and create an AVD (Android Virtual Device)

# Set environment variables (add to ~/.bashrc or ~/.zshrc)
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

## 📦 Project Setup

### 1. Install Dependencies
```bash
# Navigate to project directory
cd teferenth-expo

# Install dependencies
npm install

# or if you prefer yarn
yarn install
```

### 2. Verify Installation
```bash
# Check Expo CLI
expo --version

# Check EAS CLI
eas --version

# Verify Android setup
adb devices
```

## 🔧 Build Configuration

### 1. Initialize EAS Build (if not already done)
```bash
# Login to Expo
eas login

# Initialize EAS build
eas build:configure
```

### 2. Update EAS Configuration
The project already has `eas.json` configured. Verify it contains:

```json
{
  "cli": {
    "version": ">= 16.12.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

## 🏗️ Building for Android

### Option 1: Local Development Build
```bash
# Start the development server
npm start

# In another terminal, build for Android
npm run android

# Or using Expo CLI directly
expo run:android
```

### Option 2: EAS Cloud Build (Recommended)
```bash
# Build development version
eas build --platform android --profile development

# Build preview version
eas build --platform android --profile preview

# Build production version
eas build --platform android --profile production
```

### Option 3: Local APK Build
```bash
# Generate native Android project
expo prebuild --platform android

# Build APK using Gradle
cd android
./gradlew assembleDebug

# APK will be in: android/app/build/outputs/apk/debug/app-debug.apk
```

## 🧪 Testing the Build

### 1. Run Tests Before Building
```bash
# Run unit tests
npm test

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run E2E tests (requires Android emulator)
npm run test:e2e:android
```

### 2. Performance Analysis
```bash
# Analyze bundle size
npm run analyze

# Run performance analysis
npm run perf:analyze-components
```

## 📱 Installation and Testing

### 1. Install on Device/Emulator
```bash
# Install development build
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or if using EAS build, download and install the APK
```

### 2. Debug and Monitor
```bash
# View logs
adb logcat | grep ReactNativeJS

# Monitor performance
# Use the built-in Performance Dashboard in the app
```

## 🔍 Troubleshooting

### Common Issues and Solutions

1. **Metro bundler issues**
   ```bash
   npx expo start --clear
   ```

2. **Android build failures**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   expo prebuild --clean
   ```

3. **Dependency conflicts**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Memory issues during build**
   ```bash
   export NODE_OPTIONS="--max-old-space-size=8192"
   ```

## 📋 Build Checklist

- [ ] All dependencies installed
- [ ] Android SDK configured
- [ ] Tests passing
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Assets properly configured
- [ ] Environment variables set
- [ ] EAS configured (if using cloud build)

## 🎯 Production Build Considerations

### 1. Code Signing
```bash
# Generate keystore for production
keytool -genkeypair -v -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Environment Configuration
- Update `app.json` with production settings
- Configure environment variables in EAS secrets
- Update API endpoints for production

### 3. Performance Optimization
- Enable Hermes engine (already configured)
- Optimize bundle size
- Configure ProGuard for release builds

## 🚀 Deployment

### 1. Google Play Store
```bash
# Build production APK/AAB
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android
```

### 2. Internal Distribution
```bash
# Build and share internal build
eas build --platform android --profile preview
```

## 📊 Monitoring

The app includes comprehensive monitoring:
- Performance dashboard
- Error tracking
- Crash reporting
- Analytics (if enabled)

Access the performance dashboard by enabling it in the app settings.