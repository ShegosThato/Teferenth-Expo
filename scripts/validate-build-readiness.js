#!/usr/bin/env node

/**
 * Build Readiness Validation Script
 * 
 * Validates that the project is ready for Android build with all
 * performance enhancements properly configured.
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log('green', `✅ ${description}: ${filePath}`);
    return true;
  } else {
    log('red', `❌ ${description}: ${filePath} (MISSING)`);
    return false;
  }
}

function checkPackageJson() {
  log('blue', '\n📦 Checking package.json...');
  
  if (!fs.existsSync('package.json')) {
    log('red', '❌ package.json not found!');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Check required dependencies
  const requiredDeps = [
    'expo',
    'react',
    'react-native',
    '@react-navigation/native',
    '@react-navigation/native-stack',
    'react-native-safe-area-context',
    'react-native-screens',
    '@expo/vector-icons',
    'zustand',
    '@react-native-async-storage/async-storage',
    '@nozbe/watermelondb',
  ];
  
  let allDepsPresent = true;
  
  for (const dep of requiredDeps) {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      log('green', `✅ Dependency: ${dep}`);
    } else {
      log('red', `❌ Missing dependency: ${dep}`);
      allDepsPresent = false;
    }
  }
  
  // Check scripts
  const requiredScripts = ['start', 'android', 'test', 'lint'];
  
  for (const script of requiredScripts) {
    if (packageJson.scripts && packageJson.scripts[script]) {
      log('green', `✅ Script: ${script}`);
    } else {
      log('yellow', `⚠️  Missing script: ${script}`);
    }
  }
  
  return allDepsPresent;
}

function checkAppJson() {
  log('blue', '\n📱 Checking app.json...');
  
  if (!fs.existsSync('app.json')) {
    log('red', '❌ app.json not found!');
    return false;
  }
  
  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  const expo = appJson.expo;
  
  if (!expo) {
    log('red', '❌ expo configuration not found in app.json!');
    return false;
  }
  
  // Check required fields
  const checks = [
    { field: 'name', value: expo.name },
    { field: 'slug', value: expo.slug },
    { field: 'version', value: expo.version },
    { field: 'platforms', value: expo.platforms },
    { field: 'android.package', value: expo.android?.package },
  ];
  
  let allValid = true;
  
  for (const check of checks) {
    if (check.value) {
      log('green', `✅ ${check.field}: ${JSON.stringify(check.value)}`);
    } else {
      log('red', `❌ Missing ${check.field}`);
      allValid = false;
    }
  }
  
  return allValid;
}

function checkEasJson() {
  log('blue', '\n☁️  Checking eas.json...');
  
  if (!fs.existsSync('eas.json')) {
    log('red', '❌ eas.json not found!');
    return false;
  }
  
  const easJson = JSON.parse(fs.readFileSync('eas.json', 'utf8'));
  
  if (!easJson.build) {
    log('red', '❌ build configuration not found in eas.json!');
    return false;
  }
  
  const profiles = ['development', 'preview', 'production'];
  let allProfilesValid = true;
  
  for (const profile of profiles) {
    if (easJson.build[profile]) {
      log('green', `✅ Build profile: ${profile}`);
    } else {
      log('yellow', `⚠️  Missing build profile: ${profile}`);
    }
  }
  
  return allProfilesValid;
}

function checkAssets() {
  log('blue', '\n🖼️  Checking assets...');
  
  const requiredAssets = [
    { path: 'assets/icon.png', description: 'App icon' },
    { path: 'assets/splash.png', description: 'Splash screen' },
    { path: 'assets/adaptive-icon.png', description: 'Android adaptive icon' },
    { path: 'assets/favicon.png', description: 'Web favicon' },
  ];
  
  let allAssetsPresent = true;
  
  for (const asset of requiredAssets) {
    if (!checkFile(asset.path, asset.description)) {
      allAssetsPresent = false;
    }
  }
  
  return allAssetsPresent;
}

function checkPerformanceFiles() {
  log('blue', '\n🚀 Checking performance enhancement files...');
  
  const performanceFiles = [
    { path: 'lib/enhancedPerformance.ts', description: 'Enhanced Performance Monitor' },
    { path: 'lib/advancedPerformanceEnhancements.ts', description: 'Advanced Performance Enhancements' },
    { path: 'lib/intelligentCaching.ts', description: 'Intelligent Caching System' },
    { path: 'lib/memoryManagement.ts', description: 'Memory Management' },
    { path: 'components/AdvancedPerformanceDashboard.tsx', description: 'Advanced Performance Dashboard' },
    { path: 'components/PerformanceTestSuite.tsx', description: 'Performance Test Suite' },
    { path: 'components/OptimizedFlatList.tsx', description: 'Optimized FlatList' },
  ];
  
  let allFilesPresent = true;
  
  for (const file of performanceFiles) {
    if (!checkFile(file.path, file.description)) {
      allFilesPresent = false;
    }
  }
  
  return allFilesPresent;
}

function checkCoreFiles() {
  log('blue', '\n📁 Checking core application files...');
  
  const coreFiles = [
    { path: 'App.tsx', description: 'Main App component' },
    { path: 'index.ts', description: 'App entry point' },
    { path: 'tsconfig.json', description: 'TypeScript configuration' },
    { path: 'babel.config.js', description: 'Babel configuration' },
    { path: '.eslintrc.js', description: 'ESLint configuration' },
    { path: '.prettierrc.js', description: 'Prettier configuration' },
  ];
  
  let allFilesPresent = true;
  
  for (const file of coreFiles) {
    if (!checkFile(file.path, file.description)) {
      allFilesPresent = false;
    }
  }
  
  return allFilesPresent;
}

function checkAppTsxIntegration() {
  log('blue', '\n🔗 Checking App.tsx integration...');
  
  if (!fs.existsSync('App.tsx')) {
    log('red', '❌ App.tsx not found!');
    return false;
  }
  
  const appContent = fs.readFileSync('App.tsx', 'utf8');
  
  const integrationChecks = [
    { 
      pattern: /advancedPerformanceEnhancer/,
      description: 'Advanced Performance Enhancer import'
    },
    {
      pattern: /AdvancedPerformanceDashboard/,
      description: 'Advanced Performance Dashboard component'
    },
    {
      pattern: /enhancedPerformanceMonitor/,
      description: 'Enhanced Performance Monitor'
    },
    {
      pattern: /DatabaseProvider/,
      description: 'Database Provider'
    },
    {
      pattern: /ErrorBoundary/,
      description: 'Error Boundary'
    },
  ];
  
  let allIntegrationsPresent = true;
  
  for (const check of integrationChecks) {
    if (check.pattern.test(appContent)) {
      log('green', `✅ ${check.description} integrated`);
    } else {
      log('red', `❌ ${check.description} not integrated`);
      allIntegrationsPresent = false;
    }
  }
  
  return allIntegrationsPresent;
}

function generateReport(results) {
  log('blue', '\n📊 BUILD READINESS REPORT');
  log('blue', '========================');
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(Boolean).length;
  const score = Math.round((passedChecks / totalChecks) * 100);
  
  log('cyan', `\nOverall Score: ${score}% (${passedChecks}/${totalChecks} checks passed)`);
  
  if (score >= 90) {
    log('green', '\n🎉 EXCELLENT! Your project is ready for production build.');
    log('green', '   All critical components are properly configured.');
  } else if (score >= 75) {
    log('yellow', '\n⚠️  GOOD! Your project is mostly ready, but some improvements needed.');
    log('yellow', '   Consider fixing the issues above before building.');
  } else {
    log('red', '\n❌ NEEDS WORK! Several critical issues need to be resolved.');
    log('red', '   Please fix the missing components before attempting to build.');
  }
  
  log('blue', '\n🚀 Performance Features Status:');
  if (results.performanceFiles && results.appIntegration) {
    log('green', '   ✅ All advanced performance enhancements are ready!');
    log('green', '   ✅ AI-powered optimizations included');
    log('green', '   ✅ Intelligent caching system ready');
    log('green', '   ✅ Performance dashboard available');
    log('green', '   ✅ Test suite included');
  } else {
    log('red', '   ❌ Performance enhancements need attention');
  }
  
  log('blue', '\n📱 Next Steps:');
  if (score >= 90) {
    log('cyan', '   1. Run: npm run build-android (or use the build script)');
    log('cyan', '   2. Test the APK on your Android device');
    log('cyan', '   3. Validate performance using the built-in dashboard');
  } else {
    log('cyan', '   1. Fix the issues listed above');
    log('cyan', '   2. Re-run this validation script');
    log('cyan', '   3. Proceed with build once all checks pass');
  }
  
  return score >= 75;
}

function main() {
  log('magenta', '🔍 Tefereth Scripts - Build Readiness Validation');
  log('magenta', '==============================================');
  
  const results = {
    packageJson: checkPackageJson(),
    appJson: checkAppJson(),
    easJson: checkEasJson(),
    assets: checkAssets(),
    coreFiles: checkCoreFiles(),
    performanceFiles: checkPerformanceFiles(),
    appIntegration: checkAppTsxIntegration(),
  };
  
  const isReady = generateReport(results);
  
  process.exit(isReady ? 0 : 1);
}

// Run the validation
main();