# Teferenth Expo Application - Development and Deployment Workflow

This document outlines the comprehensive development and deployment workflow for the Teferenth Expo application, covering both Android and web platforms. Our goal is to establish a streamlined, consistent, and automated process to ensure faster feedback loops, more reliable releases, and improved developer autonomy.

## Table of Contents

- [Part 1: Development Workflow](#part-1-development-workflow)
  - [1. Local Development Environment Setup](#1-local-development-environment-setup)
  - [2. Code Quality and Formatting](#2-code-quality-and-formatting)
  - [3. Testing Strategy](#3-testing-strategy)
- [Part 2: Hosting and Deployment (CI/CD)](#part-2-hosting-and-deployment-cicd)
  - [1. Android Deployment](#1-android-deployment)
  - [2. Web Deployment](#2-web-deployment)

---

## Part 1: Development Workflow

This section outlines the standards, tools, and best practices for local development to ensure a smooth and efficient coding experience.

### 1. Local Development Environment Setup

A consistent development environment is critical to prevent "it works on my machine" issues.

*   **Node.js**:
    *   Use Node.js version 18 or higher.
    *   We strongly recommend using a version manager like [nvm (Node Version Manager)](https://github.com/nvm-sh/nvm).
    *   This project includes an `.nvmrc` file. If you use nvm, run `nvm use` in the project root to switch to the correct Node.js version.

*   **Expo and EAS CLIs**:
    *   These are our primary command-line tools. Install them globally:
        ```bash
        npm install -g expo-cli eas-cli
        ```
    *   **Expo CLI**: Used for running the project locally, managing development builds, and debugging.
    *   **EAS CLI**: Interface for Expo Application Services (EAS), used for cloud-based builds, app store submissions, and updates.

*   **Android-Specific Setup**:
    *   Install the latest version of [Android Studio](https://developer.android.com/studio). This provides the Android SDK, emulator, and command-line tools.
    *   Properly configure the `ANDROID_HOME` environment variable and update your system's `PATH`. Detailed instructions can be found in the [ANDROID_BUILD_GUIDE.md](./ANDROID_BUILD_GUIDE.md) file.

*   **Project Dependencies**:
    *   Install dependencies from `package-lock.json`:
        ```bash
        npm install
        ```
    *   For CI/CD or reproducible installs, use `npm ci`.

*   **Environment Variable Management**:
    *   An `.env.example` file is provided in the root directory, listing required environment variables.
    *   Copy this to a local `.env` file for your development keys: `cp .env.example .env`.
    *   **Important**: Add your actual secrets and API keys to your local `.env` file. This file is gitignored and should not be committed.
    *   For EAS builds, environment variables are managed securely using EAS Secrets. Set them with `eas secret:create MY_VARIABLE_NAME`.

### 2. Code Quality and Formatting

Automated standards are enforced to maintain a clean, readable, and error-free codebase.

*   **ESLint**:
    *   Configured in `.eslintrc.js` to identify and report problematic patterns in TypeScript/JavaScript code.
    *   Run the linter:
        ```bash
        npm run lint
        ```

*   **Prettier**:
    *   Used for consistent code style. It automatically formats code.
    *   Format the entire codebase:
        ```bash
        npm run format
        ```

*   **Pre-commit Hooks**:
    *   We use `husky` and `lint-staged` to automate quality checks.
    *   Before any code is committed, ESLint and Prettier are run on changed files to prevent code violating our standards from being checked in.

### 3. Testing Strategy

A multi-layered testing strategy is crucial for application stability.

*   **Unit and Integration Tests**:
    *   Frameworks: Jest and React Native Testing Library.
    *   Run the full test suite:
        ```bash
        npm test
        ```
    *   New components and business logic must be accompanied by tests covering rendering, state changes, and user interactions. Dependencies should be mocked.

*   **End-to-End (E2E) Tests**:
    *   Framework: Detox. Simulates real user workflows.
    *   Run E2E tests for Android:
        ```bash
        npm run test:e2e:android
        ```
    *   (Note: E2E tests for iOS would typically use `npm run test:e2e:ios` if configured.)

---

## Part 2: Hosting and Deployment (CI/CD)

This section details our automated process for building, deploying, and releasing the application.

### 1. Android Deployment

We leverage Expo Application Services (EAS) for building and deploying our Android application.

*   **Authentication**:
    *   Log into your Expo account via the CLI:
        ```bash
        eas login
        ```

*   **Build Process**:
    *   **Development Build**: Includes developer tools, for testing on physical devices.
        ```bash
        eas build --platform android --profile development
        ```
    *   **Production Build**: Creates an optimized Android App Bundle (`.aab`) for the Google Play Store.
        ```bash
        eas build --platform android --profile production
        ```

*   **Google Play Store Submission**:
    *   Upload a completed production build to the Play Store:
        ```bash
        eas submit --platform android
        # Or to submit the latest successful build:
        # eas submit --platform android --latest
        ```

*   **EAS Updates (OTA)**:
    *   For JavaScript/TypeScript or asset changes, push updates directly to users without a new app store submission:
        ```bash
        eas update --branch production --message "Your release notes here"
        ```

*   **CI/CD Automation with GitHub Actions**:
    *   The `.github/workflows/android-deploy.yml` workflow automates the build and submission process. It triggers on every push to the `main` branch.
    *   Requires an `EXPO_TOKEN` secret to be configured in GitHub repository settings for EAS authentication.

### 2. Web Deployment

The web version is deployed as a static progressive web app (PWA) using Vercel.

*   **Build Process**:
    *   Generate an optimized, production-ready build:
        ```bash
        npm run build:web
        # This typically runs: npx expo export:web
        ```
    *   This command bundles assets into a `dist` (or similar, like `web-build`) directory.

*   **Hosting with Vercel**:
    *   Vercel offers zero-configuration deployments for Expo web projects, a global CDN, automatic SSL, and preview deployments.
    *   For detailed setup instructions, see the [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md).

*   **CI/CD Automation (Vercel)**:
    *   Connect your GitHub repository to Vercel.
    *   Vercel automatically detects Expo web projects, applies the correct build command, and deploys on pushes to the main branch and pull requests (for previews).

---

This workflow aims to provide a robust foundation for developing and deploying the Teferenth Expo application. Please refer to the linked guides and configuration files for more details.
