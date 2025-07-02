#!/usr/bin/env node

/**
 * Enhanced Build Readiness Validation Script
 * 
 * Comprehensive validation to ensure the app is ready for production build.
 * Checks code quality, assets, configuration, and dependencies.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

class BuildValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.checks = [];
  }

  log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  success(message) {
    this.log(`✅ ${message}`, colors.green);
  }

  error(message) {
    this.log(`❌ ${message}`, colors.red);
    this.errors.push(message);
  }

  warning(message) {
    this.log(`⚠️  ${message}`, colors.yellow);
    this.warnings.push(message);
  }

  info(message) {
    this.log(`ℹ️  ${message}`, colors.blue);
  }

  // Check if file exists
  fileExists(filePath, required = true) {
    const exists = fs.existsSync(filePath);
    if (exists) {
      this.success(`Found: ${filePath}`);
    } else if (required) {
      this.error(`Missing required file: ${filePath}`);
    } else {
      this.warning(`Optional file missing: ${filePath}`);
    }
    return exists;
  }

  // Check package.json configuration
  validatePackageJson() {
    this.info('Validating package.json...');
    
    if (!this.fileExists('package.json')) {
      return false;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // Check required fields
      const requiredFields = ['name', 'version', 'main'];
      requiredFields.forEach(field => {
        if (packageJson[field]) {
          this.success(`package.json has ${field}: ${packageJson[field]}`);
        } else {
          this.error(`package.json missing required field: ${field}`);
        }
      });

      // Check scripts
      const requiredScripts = ['start', 'test', 'lint', 'typecheck'];
      requiredScripts.forEach(script => {
        if (packageJson.scripts && packageJson.scripts[script]) {
          this.success(`Found script: ${script}`);
        } else {
          this.warning(`Missing recommended script: ${script}`);
        }
      });

      // Check dependencies
      const criticalDeps = ['expo', 'react', 'react-native'];
      criticalDeps.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          this.success(`Found dependency: ${dep}@${packageJson.dependencies[dep]}`);
        } else {
          this.error(`Missing critical dependency: ${dep}`);
        }
      });

      return true;
    } catch (error) {
      this.error(`Invalid package.json: ${error.message}`);
      return false;
    }
  }

  // Check app.json configuration
  validateAppJson() {
    this.info('Validating app.json...');
    
    if (!this.fileExists('app.json')) {
      return false;
    }

    try {
      const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
      const expo = appJson.expo;

      if (!expo) {
        this.error('app.json missing expo configuration');
        return false;
      }

      // Check required fields
      const requiredFields = ['name', 'slug', 'version', 'platforms'];
      requiredFields.forEach(field => {
        if (expo[field]) {
          this.success(`app.json has ${field}: ${JSON.stringify(expo[field])}`);
        } else {
          this.error(`app.json missing required field: expo.${field}`);
        }
      });

      // Check platform configurations
      if (expo.platforms && expo.platforms.includes('android')) {
        if (expo.android && expo.android.package) {
          this.success(`Android package: ${expo.android.package}`);
        } else {
          this.error('Android configuration missing package name');
        }
      }

      if (expo.platforms && expo.platforms.includes('ios')) {
        if (expo.ios && expo.ios.bundleIdentifier) {
          this.success(`iOS bundle identifier: ${expo.ios.bundleIdentifier}`);
        } else {
          this.error('iOS configuration missing bundle identifier');
        }
      }

      // Check assets
      if (expo.icon) {
        this.fileExists(expo.icon);
      } else {
        this.error('app.json missing icon path');
      }

      if (expo.splash && expo.splash.image) {
        this.fileExists(expo.splash.image);
      } else {
        this.warning('app.json missing splash screen configuration');
      }

      return true;
    } catch (error) {
      this.error(`Invalid app.json: ${error.message}`);
      return false;
    }
  }

  // Check EAS configuration
  validateEasJson() {
    this.info('Validating eas.json...');
    
    if (!this.fileExists('eas.json')) {
      return false;
    }

    try {
      const easJson = JSON.parse(fs.readFileSync('eas.json', 'utf8'));
      
      if (easJson.build) {
        if (easJson.build.production) {
          this.success('Found production build configuration');
        } else {
          this.error('Missing production build configuration');
        }

        if (easJson.build.preview) {
          this.success('Found preview build configuration');
        } else {
          this.warning('Missing preview build configuration');
        }
      } else {
        this.error('eas.json missing build configuration');
      }

      if (easJson.submit) {
        this.success('Found submit configuration');
      } else {
        this.warning('Missing submit configuration');
      }

      return true;
    } catch (error) {
      this.error(`Invalid eas.json: ${error.message}`);
      return false;
    }
  }

  // Check required assets
  validateAssets() {
    this.info('Validating assets...');
    
    const requiredAssets = [
      'assets/icon.png',
      'assets/splash.png',
      'assets/adaptive-icon.png',
      'assets/favicon.png'
    ];

    const optionalAssets = [
      'assets/icon-192.png',
      'assets/icon-512.png'
    ];

    let allRequired = true;
    requiredAssets.forEach(asset => {
      if (!this.fileExists(asset)) {
        allRequired = false;
      }
    });

    optionalAssets.forEach(asset => {
      this.fileExists(asset, false);
    });

    return allRequired;
  }

  // Run TypeScript check
  validateTypeScript() {
    this.info('Running TypeScript validation...');
    
    if (!this.fileExists('tsconfig.json')) {
      this.warning('No tsconfig.json found');
      return true; // Not critical for build
    }

    try {
      execSync('npm run typecheck', { stdio: 'pipe' });
      this.success('TypeScript validation passed');
      return true;
    } catch (error) {
      this.error('TypeScript validation failed');
      return false;
    }
  }

  // Run ESLint check
  validateLinting() {
    this.info('Running ESLint validation...');
    
    try {
      execSync('npm run lint', { stdio: 'pipe' });
      this.success('ESLint validation passed');
      return true;
    } catch (error) {
      this.error('ESLint validation failed');
      return false;
    }
  }

  // Run tests
  validateTests() {
    this.info('Running test suite...');
    
    try {
      execSync('npm run test:ci', { stdio: 'pipe' });
      this.success('All tests passed');
      return true;
    } catch (error) {
      this.error('Tests failed');
      return false;
    }
  }

  // Run all validations
  async runAllValidations() {
    this.log('\n🔍 Starting Build Readiness Validation', colors.cyan);
    this.log('=====================================\n', colors.cyan);

    const validations = [
      { name: 'Package Configuration', fn: () => this.validatePackageJson() },
      { name: 'App Configuration', fn: () => this.validateAppJson() },
      { name: 'EAS Configuration', fn: () => this.validateEasJson() },
      { name: 'Assets', fn: () => this.validateAssets() },
      { name: 'TypeScript', fn: () => this.validateTypeScript() },
      { name: 'Linting', fn: () => this.validateLinting() },
      { name: 'Tests', fn: () => this.validateTests() },
    ];

    let allPassed = true;

    for (const validation of validations) {
      this.log(`\n📋 ${validation.name}`, colors.magenta);
      this.log('─'.repeat(validation.name.length + 4), colors.magenta);
      
      try {
        const result = validation.fn();
        if (!result) {
          allPassed = false;
        }
      } catch (error) {
        this.error(`Validation failed: ${error.message}`);
        allPassed = false;
      }
    }

    // Summary
    this.log('\n📊 Validation Summary', colors.cyan);
    this.log('==================\n', colors.cyan);

    if (this.errors.length === 0) {
      this.success('No errors found!');
    } else {
      this.log(`❌ ${this.errors.length} error(s) found:`, colors.red);
      this.errors.forEach(error => this.log(`   • ${error}`, colors.red));
    }

    if (this.warnings.length === 0) {
      this.success('No warnings!');
    } else {
      this.log(`⚠️  ${this.warnings.length} warning(s):`, colors.yellow);
      this.warnings.forEach(warning => this.log(`   • ${warning}`, colors.yellow));
    }

    this.log('\n' + '='.repeat(50), colors.cyan);
    
    if (allPassed && this.errors.length === 0) {
      this.log('🎉 BUILD READY! All validations passed.', colors.green);
      this.log('You can proceed with the production build.', colors.green);
      process.exit(0);
    } else {
      this.log('❌ BUILD NOT READY! Please fix the errors above.', colors.red);
      process.exit(1);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new BuildValidator();
  validator.runAllValidations().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = BuildValidator;