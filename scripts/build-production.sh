#!/bin/bash

# Production Build Script for Tefereth Scripts
# This script handles the complete production build process

set -e  # Exit on any error

echo "🚀 Starting Tefereth Scripts Production Build Process"
echo "=================================================="

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

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required"
        exit 1
    fi
    print_success "Node.js version: $(node --version)"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_success "npm version: $(npm --version)"
    
    # Check Expo CLI
    if ! command -v expo &> /dev/null; then
        print_warning "Expo CLI not found, installing..."
        npm install -g @expo/cli
    fi
    print_success "Expo CLI version: $(expo --version)"
    
    # Check EAS CLI
    if ! command -v eas &> /dev/null; then
        print_warning "EAS CLI not found, installing..."
        npm install -g eas-cli
    fi
    print_success "EAS CLI version: $(eas --version)"
}

# Validate project configuration
validate_project() {
    print_status "Validating project configuration..."
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Are you in the project root?"
        exit 1
    fi
    
    # Check if app.json exists
    if [ ! -f "app.json" ]; then
        print_error "app.json not found"
        exit 1
    fi
    
    # Check if eas.json exists
    if [ ! -f "eas.json" ]; then
        print_error "eas.json not found"
        exit 1
    fi
    
    # Check required assets
    if [ ! -f "assets/icon.png" ]; then
        print_error "App icon not found at assets/icon.png"
        exit 1
    fi
    
    if [ ! -f "assets/splash.png" ]; then
        print_error "Splash screen not found at assets/splash.png"
        exit 1
    fi
    
    print_success "Project configuration validated"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    print_success "Dependencies installed"
}

# Run quality checks
run_quality_checks() {
    print_status "Running quality checks..."
    
    # TypeScript check
    print_status "Running TypeScript check..."
    if npm run typecheck; then
        print_success "TypeScript check passed"
    else
        print_error "TypeScript check failed"
        exit 1
    fi
    
    # ESLint check
    print_status "Running ESLint check..."
    if npm run lint; then
        print_success "ESLint check passed"
    else
        print_error "ESLint check failed"
        exit 1
    fi
    
    # Run tests
    print_status "Running tests..."
    if npm run test:ci; then
        print_success "All tests passed"
    else
        print_error "Tests failed"
        exit 1
    fi
    
    print_success "All quality checks passed"
}

# Build for specific platform
build_platform() {
    local platform=$1
    local profile=${2:-production}
    
    print_status "Building for $platform with profile: $profile"
    
    # Check EAS login
    if ! eas whoami &> /dev/null; then
        print_warning "Not logged in to EAS. Please login:"
        eas login
    fi
    
    # Start build
    print_status "Starting EAS build for $platform..."
    if eas build --platform "$platform" --profile "$profile" --non-interactive; then
        print_success "$platform build completed successfully"
        
        # Get build URL
        BUILD_URL=$(eas build:list --platform "$platform" --limit 1 --json | jq -r '.[0].artifacts.buildUrl // empty')
        if [ -n "$BUILD_URL" ]; then
            print_success "Build URL: $BUILD_URL"
        fi
    else
        print_error "$platform build failed"
        exit 1
    fi
}

# Submit to app stores
submit_to_stores() {
    local platform=$1
    
    print_status "Submitting $platform build to app store..."
    
    if eas submit --platform "$platform" --profile production --non-interactive; then
        print_success "$platform submission completed"
    else
        print_warning "$platform submission failed or requires manual intervention"
    fi
}

# Main build process
main() {
    local PLATFORM=""
    local PROFILE="production"
    local SUBMIT=false
    local SKIP_CHECKS=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -p|--platform)
                PLATFORM="$2"
                shift 2
                ;;
            --profile)
                PROFILE="$2"
                shift 2
                ;;
            -s|--submit)
                SUBMIT=true
                shift
                ;;
            --skip-checks)
                SKIP_CHECKS=true
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  -p, --platform PLATFORM    Build platform (android, ios, all)"
                echo "  --profile PROFILE          Build profile (development, preview, production)"
                echo "  -s, --submit               Submit to app stores after build"
                echo "  --skip-checks              Skip quality checks"
                echo "  -h, --help                 Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Default to all platforms if none specified
    if [ -z "$PLATFORM" ]; then
        PLATFORM="all"
    fi
    
    print_status "Build configuration:"
    print_status "  Platform: $PLATFORM"
    print_status "  Profile: $PROFILE"
    print_status "  Submit: $SUBMIT"
    print_status "  Skip checks: $SKIP_CHECKS"
    echo ""
    
    # Run build process
    check_prerequisites
    validate_project
    install_dependencies
    
    if [ "$SKIP_CHECKS" = false ]; then
        run_quality_checks
    else
        print_warning "Skipping quality checks"
    fi
    
    # Build for specified platforms
    case $PLATFORM in
        android)
            build_platform "android" "$PROFILE"
            if [ "$SUBMIT" = true ]; then
                submit_to_stores "android"
            fi
            ;;
        ios)
            build_platform "ios" "$PROFILE"
            if [ "$SUBMIT" = true ]; then
                submit_to_stores "ios"
            fi
            ;;
        all)
            build_platform "android" "$PROFILE"
            build_platform "ios" "$PROFILE"
            if [ "$SUBMIT" = true ]; then
                submit_to_stores "android"
                submit_to_stores "ios"
            fi
            ;;
        *)
            print_error "Invalid platform: $PLATFORM. Use 'android', 'ios', or 'all'"
            exit 1
            ;;
    esac
    
    print_success "Build process completed successfully! 🎉"
    print_status "Next steps:"
    print_status "  1. Test the build on physical devices"
    print_status "  2. Monitor crash reports and performance"
    print_status "  3. Prepare store listings and metadata"
    print_status "  4. Submit for app store review"
}

# Run main function with all arguments
main "$@"