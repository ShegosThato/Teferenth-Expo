# Android Build Guide

This document provides instructions for setting up your local environment for Android development and building the Teferenth Expo application.

## Prerequisites

1.  **Node.js**: Ensure you have Node.js version 18 or higher. We recommend using [nvm (Node Version Manager)](https://github.com/nvm-sh/nvm) to manage Node.js versions. If you have nvm installed, you can run `nvm use` in the project root to automatically switch to the version specified in the `.nvmrc` file.
2.  **Expo and EAS CLIs**: Install the Expo CLI and EAS CLI globally:
    ```bash
    npm install -g expo-cli eas-cli
    ```
3.  **Java Development Kit (JDK)**: Android development requires the JDK. You can download it from [Oracle's website](https://www.oracle.com/java/technologies/javase-jdk11-downloads.html) or use a package manager like Homebrew (for macOS) or Chocolatey (for Windows). Version 11 or higher is recommended.
    Verify your installation:
    ```bash
    java -version
    ```

## Android Studio Setup

1.  **Install Android Studio**:
    *   Download and install the latest version of [Android Studio](https://developer.android.com/studio).
    *   During the installation, make sure to install the following components:
        *   Android SDK
        *   Android SDK Platform
        *   Android Virtual Device (AVD) if you want to use emulators.

2.  **Configure Android SDK**:
    *   Open Android Studio.
    *   Navigate to `Settings/Preferences` > `Appearance & Behavior` > `System Settings` > `Android SDK`.
    *   Ensure you have at least one SDK Platform installed (e.g., Android 12.0 - API Level 31 or higher).
    *   Note the `Android SDK Location` path displayed at the top of this window. You will need it for the next step.

## Environment Variable Configuration

Proper environment variable setup is crucial for the Expo and EAS CLIs to interact with the Android SDK.

1.  **Set `ANDROID_HOME` (or `ANDROID_SDK_ROOT`)**:
    *   This environment variable should point to your Android SDK installation directory (the `Android SDK Location` you noted earlier).
    *   **Linux/macOS**: Add the following line to your shell configuration file (e.g., `~/.bashrc`, `~/.zshrc`, `~/.bash_profile`):
        ```bash
        export ANDROID_HOME=/path/to/your/android/sdk
        # Example for macOS default location:
        # export ANDROID_HOME=$HOME/Library/Android/sdk
        ```
        Remember to source your configuration file (e.g., `source ~/.zshrc`) or open a new terminal window for the changes to take effect.
    *   **Windows**:
        *   Search for "environment variables" in the Windows search bar and select "Edit the system environment variables".
        *   In the System Properties window, click the "Environment Variables..." button.
        *   Under "System variables" (or "User variables" if you prefer), click "New...".
        *   Set "Variable name" to `ANDROID_HOME`.
        *   Set "Variable value" to your Android SDK path (e.g., `C:\Users\YourUser\AppData\Local\Android\Sdk`).
        *   Click "OK" on all windows to save the changes. You may need to restart your command prompt or computer.

2.  **Update `PATH` Variable**:
    *   You need to add the Android SDK's `platform-tools` and `emulator` directories to your system's `PATH` variable. This allows you to run commands like `adb` and `emulator` from any directory.
    *   **Linux/macOS**: Add the following lines to your shell configuration file:
        ```bash
        export PATH=$PATH:$ANDROID_HOME/platform-tools
        export PATH=$PATH:$ANDROID_HOME/emulator
        export PATH=$PATH:$ANDROID_HOME/tools # Optional, some older tools might be here
        export PATH=$PATH:$ANDROID_HOME/tools/bin # Optional
        ```
        Source your configuration file or open a new terminal.
    *   **Windows**:
        *   In the "Environment Variables" window (where you set `ANDROID_HOME`), find the `Path` variable in the "System variables" (or "User variables") list and select "Edit...".
        *   Click "New" and add the following paths (one entry per path):
            *   `%ANDROID_HOME%\platform-tools`
            *   `%ANDROID_HOME%\emulator`
            *   `%ANDROID_HOME%\tools` (Optional)
            *   `%ANDROID_HOME%\tools\bin` (Optional)
        *   Click "OK" on all windows. Restart your command prompt or computer.

3.  **Verify Setup**:
    *   Open a **new** terminal/command prompt.
    *   Run `adb version`. You should see output like `Android Debug Bridge version ...`.
    *   If you plan to use emulators, run `emulator -list-avds`. If you have AVDs configured, they will be listed.

## Building and Running the App

Once your environment is set up:

1.  **Install Project Dependencies**:
    ```bash
    npm install
    # Or, for a cleaner install (recommended for CI):
    # npm ci
    ```

2.  **Run on Android Emulator/Device**:
    *   Ensure an Android emulator is running or a physical device is connected with USB debugging enabled.
    *   Start the development server:
        ```bash
        npm run android
        # or
        expo run:android
        ```
    *   This will build the app and install it on the selected device/emulator.

## Troubleshooting

*   **`adb: command not found` or `emulator: command not found`**: Your `PATH` variable is likely not configured correctly. Double-check the paths and ensure you've opened a new terminal session after making changes.
*   **SDK location not found / `ANDROID_HOME` not set**: Ensure `ANDROID_HOME` is set correctly and points to the valid SDK directory.
*   **Build failures**: Check the error messages in the terminal. Often, they point to missing SDK components or configuration issues. You might need to install additional SDK Build-Tools or SDK Platforms via Android Studio.
*   **EAS Build issues**: For cloud builds with EAS, ensure your project is correctly configured according to Expo's documentation. Environment variables for EAS builds are managed through EAS Secrets (`eas secret:create MY_VARIABLE_NAME`).

This guide should help you get your Android development environment up and running. Refer to the official [Expo](https://docs.expo.dev/) and [Android Developer](https://developer.android.com/docs) documentation for more detailed information.
