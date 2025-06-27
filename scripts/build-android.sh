#!/bin/bash

# 🤖 Android Build Script for Tefereth Scripts
# Automated build process with performance enhancements

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        print_error "Node.js version 18+ required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) ✓"
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed."
        exit 1
    fi
    
    print_success "npm $(npm --version) ✓"
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root."
        exit 1
    fi
    
    print_success "Project directory ✓"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [ ! -d "node_modules" ]; then
        npm install
    else
        print_status "Dependencies already installed. Checking for updates..."
        npm ci
    fi
    
    print_success "Dependencies installed ✓"
}

# Function to install Expo CLI
install_expo_cli() {
    print_status "Checking Expo CLI..."
    
    if ! command_exists expo; then
        print_status "Installing Expo CLI..."
        npm install -g @expo/cli
    fi
    
    if ! command_exists eas; then
        print_status "Installing EAS CLI..."
        npm install -g eas-cli
    fi
    
    print_success "Expo CLI $(expo --version) ✓"
    print_success "EAS CLI $(eas --version) ✓"
}

# Function to run pre-build checks
run_prebuild_checks() {
    print_status "Running pre-build checks..."
    
    # TypeScript check
    print_status "Checking TypeScript..."
    if ! npx tsc --noEmit; then
        print_error "TypeScript errors found. Please fix them before building."
        exit 1
    fi
    print_success "TypeScript check passed ✓"
    
    # Linting check
    print_status "Running linter..."
    if ! npm run lint; then
        print_warning "Linting issues found. Consider fixing them for better code quality."
    else
        print_success "Linting check passed ✓"
    fi
    
    # Test check (optional)
    print_status "Running tests..."
    if npm test -- --passWithNoTests --watchAll=false; then
        print_success "Tests passed ✓"
    else
        print_warning "Some tests failed. Consider fixing them before production build."
    fi
}

# Function to check assets
check_assets() {
    print_status "Checking required assets..."
    
    local assets=("assets/icon.png" "assets/splash.png" "assets/adaptive-icon.png")
    
    for asset in "${assets[@]}"; do
        if [ -f "$asset" ]; then
            print_success "$asset ✓"
        else
            print_error "$asset is missing!"
            exit 1
        fi
    done
}

# Function to build with EAS
build_with_eas() {
    local profile=$1
    
    print_status "Building Android APK with EAS (profile: $profile)..."
    
    # Check if user is logged in
    if ! eas whoami >/dev/null 2>&1; then
        print_status "Please login to EAS:"
        eas login
    fi
    
    print_status "Starting EAS build..."
    eas build --platform android --profile "$profile"
    
    print_success "EAS build completed! Check your EAS dashboard for download link."
}

# Function to build locally
build_locally() {
    print_status "Building Android APK locally..."
    
    # Check if Android SDK is available
    if ! command_exists adb; then
        print_error "Android SDK not found. Please install Android Studio and set up ANDROID_HOME."
        print_status "See ANDROID_BUILD_GUIDE.md for detailed setup instructions."
        exit 1
    fi
    
    # Generate native project
    print_status "Generating native Android project..."
    npx expo prebuild --platform android --clean
    
    # Build APK
    print_status "Building APK with Gradle..."
    cd android
    ./gradlew assembleDebug
    cd ..
    
    local apk_path="android/app/build/outputs/apk/debug/app-debug.apk"
    if [ -f "$apk_path" ]; then
        print_success "APK built successfully: $apk_path"
        
        # Check if device is connected
        if adb devices | grep -q "device$"; then
            read -p "Install APK on connected device? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                adb install "$apk_path"
                print_success "APK installed on device!"
            fi
        fi
    else
        print_error "APK build failed!"
        exit 1
    fi
}

# Function to show performance features
show_performance_features() {
    print_status "Performance Enhancements Included:"
    echo "  🧠 AI-Powered Optimizations"
    echo "  📊 Advanced Performance Dashboard"
    echo "  🚀 Intelligent Caching System"
    echo "  🧪 Performance Test Suite"
    echo "  ⚡ Predictive Preloading"
    echo "  🎯 Adaptive Performance Modes"
    echo "  📈 Real-Time Monitoring"
    echo "  🔧 Automatic Optimization"
    echo ""
}

# Main function
main() {
    echo "🤖 Tefereth Scripts - Android Build Script"
    echo "=========================================="
    echo ""
    
    show_performance_features
    
    # Parse command line arguments
    local build_type="eas"
    local profile="development"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --local)
                build_type="local"
                shift
                ;;
            --profile)
                profile="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --local           Build locally instead of using EAS"
                echo "  --profile PROFILE EAS build profile (development|preview|production)"
                echo "  --help            Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0                          # EAS development build"
                echo "  $0 --profile preview        # EAS preview build"
                echo "  $0 --profile production     # EAS production build"
                echo "  $0 --local                  # Local debug build"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Run checks
    check_prerequisites
    install_expo_cli
    install_dependencies
    check_assets
    run_prebuild_checks
    
    # Build
    if [ "$build_type" = "local" ]; then
        build_locally
    else
        build_with_eas "$profile"
    fi
    
    echo ""
    print_success "Build process completed!"
    echo ""
    print_status "Next steps:"
    echo "  1. Install the APK on your Android device"
    echo "  2. Test the performance enhancements"
    echo "  3. Access the performance dashboard (tap top-right indicator)"
    echo "  4. Run the performance test suite for validation"
    echo ""
    print_status "For detailed instructions, see ANDROID_BUILD_GUIDE.md"
}

# Run main function with all arguments
main "$@"