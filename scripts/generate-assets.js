#!/usr/bin/env node

/**
 * Asset Generation Script for Tefereth Scripts App
 * 
 * This script helps generate placeholder assets or provides instructions
 * for creating the required assets for the app.
 * 
 * Usage: node scripts/generate-assets.js
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const REQUIRED_ASSETS = [
  {
    name: 'icon.png',
    size: '1024x1024',
    description: 'Main app icon',
    purpose: 'iOS and Android app icon',
    requirements: 'Square, no transparency for iOS, high contrast'
  },
  {
    name: 'splash.png',
    size: '1242x2436',
    description: 'Splash screen image',
    purpose: 'Loading screen when app starts',
    requirements: 'Should match background color #f9fafb'
  },
  {
    name: 'adaptive-icon.png',
    size: '1024x1024',
    description: 'Android adaptive icon foreground',
    purpose: 'Android adaptive icon system',
    requirements: 'Transparent background, centered design'
  },
  {
    name: 'favicon.png',
    size: '64x64',
    description: 'Web favicon',
    purpose: 'Browser tab icon for web version',
    requirements: 'Small, recognizable at tiny sizes'
  }
];

function ensureAssetsDirectory() {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
    console.log('✅ Created assets directory');
  }
}

function generateAssetInstructions() {
  console.log('\n🎨 ASSET GENERATION INSTRUCTIONS\n');
  console.log('The following assets need to be created for the app:\n');
  
  REQUIRED_ASSETS.forEach((asset, index) => {
    console.log(`${index + 1}. ${asset.name}`);
    console.log(`   Size: ${asset.size}px`);
    console.log(`   Purpose: ${asset.purpose}`);
    console.log(`   Requirements: ${asset.requirements}`);
    console.log('');
  });
  
  console.log('🛠️  RECOMMENDED TOOLS:');
  console.log('   • Figma (free): https://figma.com');
  console.log('   • Canva (free): https://canva.com');
  console.log('   • App Icon Generator: https://appicon.co');
  console.log('   • Expo Icon Tools: https://docs.expo.dev/guides/app-icons/');
  console.log('');
  
  console.log('🎯 DESIGN SUGGESTIONS:');
  console.log('   • Use app primary color: #7c3aed (purple)');
  console.log('   • Background color: #f9fafb (light gray)');
  console.log('   • Theme: Video/Film/Storyboard related');
  console.log('   • Icons: Film reel, camera, storyboard, script');
  console.log('');
}

function createPlaceholderReadme() {
  const readmeContent = `# Asset Status

## Required Assets Checklist

${REQUIRED_ASSETS.map(asset => `- [ ] ${asset.name} (${asset.size}px) - ${asset.description}`).join('\n')}

## Quick Asset Creation

### Option 1: Use Online Generators
1. Visit https://appicon.co or similar
2. Upload a simple logo or design
3. Download the generated assets
4. Place them in this directory

### Option 2: Create Simple Text-Based Icons
1. Use any design tool (Figma, Canva, etc.)
2. Create a square canvas (1024x1024)
3. Add text "TS" or "Tefereth" with purple background
4. Export as PNG

### Option 3: Use Expo Tools
\`\`\`bash
npx expo install expo-app-icon-utils
npx expo-app-icon-utils generate
\`\`\`

## Current Status
- [ ] Assets created
- [ ] Assets optimized
- [ ] Assets tested on devices
- [ ] App builds successfully

## Next Steps
1. Create the assets using one of the methods above
2. Test the app build
3. Update this checklist
4. Mark TODO items as complete
`;

  fs.writeFileSync(path.join(ASSETS_DIR, 'STATUS.md'), readmeContent);
  console.log('✅ Created assets/STATUS.md with creation instructions');
}

function checkExistingAssets() {
  console.log('\n📋 ASSET STATUS CHECK\n');
  
  let allAssetsExist = true;
  
  REQUIRED_ASSETS.forEach(asset => {
    const assetPath = path.join(ASSETS_DIR, asset.name);
    const exists = fs.existsSync(assetPath);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${asset.name}`);
    
    if (!exists) {
      allAssetsExist = false;
    }
  });
  
  if (allAssetsExist) {
    console.log('\n🎉 All required assets are present!');
    return true;
  } else {
    console.log('\n⚠️  Some assets are missing. See instructions above.');
    return false;
  }
}

function main() {
  console.log('🚀 Tefereth Scripts - Asset Generator\n');
  
  ensureAssetsDirectory();
  
  const allAssetsExist = checkExistingAssets();
  
  if (!allAssetsExist) {
    generateAssetInstructions();
    createPlaceholderReadme();
    
    console.log('📝 NEXT STEPS:');
    console.log('   1. Create the missing assets using the instructions above');
    console.log('   2. Run this script again to verify');
    console.log('   3. Test the app build: npm run ios/android');
    console.log('   4. Update TODO.md to mark assets as complete');
  } else {
    console.log('✅ All assets are ready! You can now build the app.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { REQUIRED_ASSETS, checkExistingAssets };