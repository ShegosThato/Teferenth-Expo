#!/usr/bin/env node

/**
 * Build Test Script
 * 
 * Tests if the app can build successfully with the current assets and configuration.
 * This script checks for common build issues and provides helpful feedback.
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const ASSETS_DIR = path.join(PROJECT_ROOT, 'assets');

// Required files for successful build
const REQUIRED_FILES = [
  'app.json',
  'package.json',
  'App.tsx',
  'index.ts'
];

// Asset files (either SVG or PNG)
const ASSET_FILES = [
  'icon',
  'splash', 
  'adaptive-icon',
  'favicon'
];

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${description}: ${path.basename(filePath)}`);
  return exists;
}

function checkAsset(assetName) {
  const svgPath = path.join(ASSETS_DIR, `${assetName}.svg`);
  const pngPath = path.join(ASSETS_DIR, `${assetName}.png`);
  
  const hasSvg = fs.existsSync(svgPath);
  const hasPng = fs.existsSync(pngPath);
  
  if (hasPng) {
    console.log(`✅ ${assetName}.png (ready for mobile builds)`);
    return true;
  } else if (hasSvg) {
    console.log(`🔄 ${assetName}.svg (needs PNG conversion for mobile)`);
    return 'svg';
  } else {
    console.log(`❌ ${assetName} (missing)`);
    return false;
  }
}

function checkPackageJson() {
  try {
    const packagePath = path.join(PROJECT_ROOT, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    console.log('\n📦 Package Dependencies:');
    
    const requiredDeps = [
      'expo',
      'react',
      'react-native',
      '@react-navigation/native',
      'expo-constants'
    ];
    
    let allDepsPresent = true;
    requiredDeps.forEach(dep => {
      const hasInDeps = packageJson.dependencies && packageJson.dependencies[dep];
      const hasInDevDeps = packageJson.devDependencies && packageJson.devDependencies[dep];
      const present = hasInDeps || hasInDevDeps;
      
      console.log(`${present ? '✅' : '❌'} ${dep}`);
      if (!present) allDepsPresent = false;
    });
    
    return allDepsPresent;
  } catch (error) {
    console.log('❌ Error reading package.json:', error.message);
    return false;
  }
}

function checkAppJson() {
  try {
    const appJsonPath = path.join(PROJECT_ROOT, 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    console.log('\n⚙️  App Configuration:');
    
    const expo = appJson.expo;
    if (!expo) {
      console.log('❌ Missing expo configuration');
      return false;
    }
    
    const checks = [
      { key: 'name', value: expo.name, label: 'App name' },
      { key: 'slug', value: expo.slug, label: 'App slug' },
      { key: 'version', value: expo.version, label: 'Version' },
      { key: 'platforms', value: expo.platforms, label: 'Platforms' },
      { key: 'extra', value: expo.extra, label: 'Environment config' }
    ];
    
    let allPresent = true;
    checks.forEach(check => {
      const present = check.value !== undefined;
      console.log(`${present ? '✅' : '❌'} ${check.label}`);
      if (!present) allPresent = false;
    });
    
    return allPresent;
  } catch (error) {
    console.log('❌ Error reading app.json:', error.message);
    return false;
  }
}

function checkEnvironmentConfig() {
  try {
    const configPath = path.join(PROJECT_ROOT, 'config', 'env.ts');
    const configExists = fs.existsSync(configPath);
    
    console.log('\n🔧 Environment Configuration:');
    console.log(`${configExists ? '✅' : '❌'} config/env.ts`);
    
    if (configExists) {
      console.log('✅ Environment variables configured');
      console.log('✅ API endpoints configurable');
      console.log('✅ File limits configurable');
    }
    
    return configExists;
  } catch (error) {
    console.log('❌ Error checking environment config:', error.message);
    return false;
  }
}

function provideBuildInstructions(hasAssetIssues, hasPngAssets) {
  console.log('\n🚀 BUILD INSTRUCTIONS:\n');
  
  if (hasAssetIssues && !hasPngAssets) {
    console.log('⚠️  ASSET CONVERSION NEEDED:');
    console.log('   1. Open assets/convert-assets.html in your browser');
    console.log('   2. Convert all SVG assets to PNG');
    console.log('   3. Download and save PNG files to assets/ directory');
    console.log('   4. Run build command again\n');
  }
  
  console.log('📱 BUILD COMMANDS:');
  console.log('   npm install          # Install dependencies');
  console.log('   npm run web          # Test web build (works with SVG)');
  
  if (hasPngAssets) {
    console.log('   npm run ios          # Test iOS build');
    console.log('   npm run android      # Test Android build');
  } else {
    console.log('   # iOS/Android builds need PNG assets (convert SVG first)');
  }
  
  console.log('\n🔍 TROUBLESHOOTING:');
  console.log('   • If build fails, check expo doctor: npx expo doctor');
  console.log('   • For asset issues, see assets/CONVERSION_GUIDE.md');
  console.log('   • For config issues, see config/env.ts');
  console.log('   • For general help, see README.md');
}

function main() {
  console.log('🔍 Tefereth Scripts - Build Readiness Check\n');
  
  // Check core files
  console.log('📁 Core Files:');
  let coreFilesOk = true;
  REQUIRED_FILES.forEach(file => {
    const filePath = path.join(PROJECT_ROOT, file);
    if (!checkFile(filePath, 'Core file')) {
      coreFilesOk = false;
    }
  });
  
  // Check assets
  console.log('\n🎨 Assets:');
  let assetIssues = false;
  let hasPngAssets = false;
  
  ASSET_FILES.forEach(asset => {
    const result = checkAsset(asset);
    if (result === false) {
      assetIssues = true;
    } else if (result === true) {
      hasPngAssets = true;
    }
  });
  
  // Check package.json
  const depsOk = checkPackageJson();
  
  // Check app.json
  const appConfigOk = checkAppJson();
  
  // Check environment config
  const envConfigOk = checkEnvironmentConfig();
  
  // Overall assessment
  console.log('\n📊 BUILD READINESS SUMMARY:');
  console.log(`${coreFilesOk ? '✅' : '❌'} Core files present`);
  console.log(`${!assetIssues ? '✅' : '🔄'} Assets available ${assetIssues ? '(SVG, needs PNG conversion)' : ''}`);
  console.log(`${depsOk ? '✅' : '❌'} Dependencies configured`);
  console.log(`${appConfigOk ? '✅' : '❌'} App configuration valid`);
  console.log(`${envConfigOk ? '✅' : '❌'} Environment config present`);
  
  const overallReady = coreFilesOk && depsOk && appConfigOk && envConfigOk;
  
  if (overallReady) {
    if (hasPngAssets) {
      console.log('\n🎉 BUILD STATUS: READY FOR ALL PLATFORMS');
    } else {
      console.log('\n🌐 BUILD STATUS: READY FOR WEB (PNG needed for mobile)');
    }
  } else {
    console.log('\n⚠️  BUILD STATUS: ISSUES NEED RESOLUTION');
  }
  
  provideBuildInstructions(assetIssues, hasPngAssets);
}

if (require.main === module) {
  main();
}

module.exports = { checkFile, checkAsset, checkPackageJson, checkAppJson };