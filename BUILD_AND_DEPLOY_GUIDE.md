# 🚀 Build and Deploy Guide - Tefereth Scripts

## 📋 Complete Production Build and Deployment Guide

This comprehensive guide covers building and deploying the Tefereth Scripts application to production app stores (Google Play Store and Apple App Store) using modern best practices.

## 🎯 Prerequisites

### **Required Tools**
```bash
# Node.js 18+ (LTS recommended)
node --version  # Should be 18.x or higher

# Expo CLI and EAS CLI
npm install -g @expo/cli eas-cli

# Git (for version control)
git --version

# Optional: Android Studio (for local Android builds)
# Optional: Xcode (for local iOS builds - macOS only)
```

### **Account Setup**
- ✅ **Expo Account**: Required for EAS Build
- ✅ **Google Play Console**: For Android app publishing
- ✅ **Apple Developer Account**: For iOS app publishing ($99/year)
- ✅ **GitHub Account**: For CI/CD integration (optional)

## 🔧 Environment Setup

### **1. Install Dependencies**
```bash
# Clone and setup project
git clone <repository-url>
cd tefereth-scripts

# Install dependencies
npm install

# Verify installation
npm run typecheck
npm run lint
npm test
```

### **2. Configure Environment Variables**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# API_BASE_URL=https://your-api.com
# API_KEY=your-api-key
# ENVIRONMENT=production
```

### **3. Verify EAS Configuration**
```bash
# Login to Expo
eas login

# Verify project configuration
eas build:configure

# Check build status
eas build:list
```

## 📱 Android Build Process

### **Step 1: Configure Android Build**

Create enhanced EAS configuration:

```json
// eas.json (Enhanced)
{
  "cli": {
    "version": ">= 16.12.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "aab"
      }
    },
    "production-apk": {
      "extends": "production",
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### **Step 2: Generate Signing Credentials**
```bash
# Generate Android keystore (EAS will handle this automatically)
eas credentials

# Or manually generate keystore
keytool -genkeypair -v -keystore release.keystore -alias release \
  -keyalg RSA -keysize 2048 -validity 10000
```

### **Step 3: Build Android App**
```bash
# Build production AAB (for Play Store)
eas build --platform android --profile production

# Build production APK (for testing/sideloading)
eas build --platform android --profile production-apk

# Build preview APK (for internal testing)
eas build --platform android --profile preview
```

### **Step 4: Test Android Build**
```bash
# Download and test the APK
# Install on device: adb install app.apk
# Or use EAS CLI: eas build:run --platform android
```

## 🍎 iOS Build Process

### **Step 1: Configure iOS Build**

Update app.json for iOS:
```json
{
  "expo": {
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.shegosthato.teferenthexpo",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses camera to capture images for storyboards",
        "NSPhotoLibraryUsageDescription": "This app accesses photo library to save generated videos",
        "NSMicrophoneUsageDescription": "This app uses microphone for voice recordings"
      },
      "config": {
        "usesNonExemptEncryption": false
      }
    }
  }
}
```

### **Step 2: Generate iOS Credentials**
```bash
# Generate iOS certificates and provisioning profiles
eas credentials --platform ios

# Follow prompts to:
# 1. Generate Apple Distribution Certificate
# 2. Generate Provisioning Profile
# 3. Configure App Store Connect
```

### **Step 3: Build iOS App**
```bash
# Build production IPA (for App Store)
eas build --platform ios --profile production

# Build preview IPA (for TestFlight)
eas build --platform ios --profile preview
```

### **Step 4: Test iOS Build**
```bash
# Install on simulator or device
eas build:run --platform ios

# Or submit to TestFlight for testing
eas submit --platform ios --profile preview
```

## 🌐 Web Build Process

### **Step 1: Configure Web Build**
```bash
# Build web version
npx expo export:web

# Serve locally for testing
npx serve dist

# Deploy to hosting service (Vercel, Netlify, etc.)
```

### **Step 2: Optimize Web Build**
```bash
# Analyze bundle size
npx expo-optimize

# Generate service worker for PWA
# (Already configured in app.json)
```

## 🔄 Automated Build Pipeline

### **GitHub Actions Workflow**

Create `.github/workflows/build-and-deploy.yml`:

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: |
          npm run typecheck
          npm run lint
          npm run test:ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build-android:
    needs: test
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Android
        run: eas build --platform android --profile production --non-interactive
      
      - name: Submit to Play Store
        run: eas submit --platform android --profile production --non-interactive

  build-ios:
    needs: test
    runs-on: macos-latest
    if: startsWith(github.ref, 'refs/tags/v')
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build iOS
        run: eas build --platform ios --profile production --non-interactive
      
      - name: Submit to App Store
        run: eas submit --platform ios --profile production --non-interactive
```

## 📦 Release Management

### **Version Management**
```bash
# Update version in app.json
# "version": "1.1.0"

# Create git tag
git tag v1.1.0
git push origin v1.1.0

# This triggers automated builds
```

### **Release Notes Template**
```markdown
## Version 1.1.0

### ✨ New Features
- Enhanced onboarding system with interactive tutorials
- Haptic feedback for better user experience
- Pull-to-refresh functionality

### 🐛 Bug Fixes
- Fixed memory leaks in video generation
- Improved error handling and recovery
- Enhanced accessibility support

### 🚀 Performance Improvements
- 40% faster app startup time
- Optimized image loading and caching
- Reduced memory usage by 30%

### 📱 Platform Updates
- Updated to Expo SDK 53
- React Native 0.76.9 compatibility
- Enhanced Android 14 support
```

## 🏪 App Store Submission

### **Google Play Store**

1. **Prepare Store Listing**
   - App title: "Tefereth Scripts"
   - Short description: "AI-powered video storyboard creator"
   - Full description: [See store-listing.md]
   - Screenshots: 1080x1920 (phone), 1920x1080 (tablet)
   - Feature graphic: 1024x500
   - App icon: 512x512

2. **Upload Build**
   ```bash
   # Automated submission
   eas submit --platform android --profile production
   
   # Manual upload to Play Console
   # Upload the AAB file to Internal Testing first
   ```

3. **Configure Release**
   - Set target API level (34 for Android 14)
   - Configure app signing
   - Set up release tracks (Internal → Alpha → Beta → Production)

### **Apple App Store**

1. **Prepare App Store Connect**
   - Create app record in App Store Connect
   - Configure app information and metadata
   - Upload screenshots (required sizes for different devices)
   - Set pricing and availability

2. **Upload Build**
   ```bash
   # Automated submission
   eas submit --platform ios --profile production
   
   # Manual upload via Xcode or Transporter
   ```

3. **Submit for Review**
   - Complete app review information
   - Provide demo account (if needed)
   - Submit for App Store review

## 🧪 Testing Strategy

### **Pre-Release Testing**
```bash
# Run comprehensive test suite
npm run test:ci

# Performance testing
npm run perf:analyze

# Build validation
npm run validate-build-readiness

# Manual testing checklist
# - Core functionality
# - Performance on target devices
# - Accessibility compliance
# - Network connectivity scenarios
```

### **Beta Testing**
```bash
# Internal testing (team members)
eas build --platform android --profile preview
eas build --platform ios --profile preview

# External testing (TestFlight/Play Console)
# Upload to respective beta testing platforms
```

## 🔍 Quality Assurance

### **Pre-Build Checklist**
- ✅ All tests passing
- ✅ No TypeScript errors
- ✅ No ESLint violations
- ✅ Performance benchmarks met
- ✅ Assets optimized and present
- ✅ Environment variables configured
- ✅ Version numbers updated

### **Build Validation**
```bash
# Automated validation script
#!/bin/bash
echo "🔍 Validating build readiness..."

# Check tests
npm run test:ci || exit 1

# Check types
npm run typecheck || exit 1

# Check linting
npm run lint || exit 1

# Check assets
ls assets/icon.png assets/splash.png || exit 1

# Check environment
grep -q "ENVIRONMENT=production" .env || exit 1

echo "✅ Build validation complete!"
```

## 📊 Monitoring and Analytics

### **Build Monitoring**
- EAS Build dashboard for build status
- GitHub Actions for CI/CD monitoring
- Crash reporting (Sentry/Bugsnag)
- Performance monitoring (Firebase Performance)

### **Release Metrics**
- App store ratings and reviews
- Download and installation rates
- User retention and engagement
- Performance metrics and crash rates

## 🚨 Troubleshooting

### **Common Build Issues**

1. **Android Build Failures**
   ```bash
   # Clear cache and retry
   eas build:cancel
   eas build --platform android --clear-cache
   ```

2. **iOS Certificate Issues**
   ```bash
   # Reset credentials
   eas credentials --platform ios --clear-cache
   eas credentials --platform ios
   ```

3. **Memory Issues**
   ```bash
   # Increase Node.js memory
   export NODE_OPTIONS="--max-old-space-size=8192"
   ```

4. **Asset Issues**
   ```bash
   # Verify assets exist
   npm run validate-assets
   
   # Regenerate if needed
   npm run generate-assets
   ```

## 📋 Deployment Checklist

### **Pre-Deployment**
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Assets optimized
- [ ] Environment configured
- [ ] Version updated
- [ ] Release notes prepared

### **Deployment**
- [ ] Build successful
- [ ] Internal testing completed
- [ ] Beta testing feedback addressed
- [ ] Store listing updated
- [ ] Screenshots current
- [ ] Metadata accurate

### **Post-Deployment**
- [ ] Monitor crash reports
- [ ] Track performance metrics
- [ ] Monitor user feedback
- [ ] Plan next release
- [ ] Update documentation

## 🎯 Success Metrics

### **Build Quality**
- ✅ **Build Success Rate**: >95%
- ✅ **Build Time**: <15 minutes
- ✅ **App Size**: <50MB (Android), <100MB (iOS)
- ✅ **Startup Time**: <3 seconds

### **Store Performance**
- 🎯 **App Store Rating**: >4.5 stars
- 🎯 **Download Rate**: Track organic vs. paid
- 🎯 **User Retention**: >70% day-1, >40% day-7
- 🎯 **Crash Rate**: <1%

## 🚀 Next Steps

1. **Set up automated builds** with GitHub Actions
2. **Configure store listings** with optimized metadata
3. **Implement crash reporting** and analytics
4. **Plan release schedule** with regular updates
5. **Monitor performance** and user feedback

---

**The Tefereth Scripts app is now ready for production deployment!** 🎉

This guide provides everything needed to build, test, and deploy a production-ready mobile application to both Google Play Store and Apple App Store.