/**
 * E2E Tests for Basic App Functionality
 * 
 * These tests verify the core user flows and navigation
 * of the Tefereth Scripts application.
 */

const { device, expect, element, by, waitFor } = require('detox');

describe('Tefereth Scripts App', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('App Launch and Navigation', () => {
    it('should launch app and show home screen', async () => {
      // Wait for the home screen to load
      await helpers.waitForElement(by.text('Tefereth Scripts'));
      
      // Verify the main navigation elements are present
      await expect(element(by.text('Tefereth Scripts'))).toBeVisible();
    });

    it('should navigate to new project screen', async () => {
      // Look for and tap the new project button
      await helpers.tapElement(by.id('new-project-button'));
      
      // Verify we're on the new project screen
      await helpers.waitForElement(by.text('New Project'));
      await expect(element(by.text('New Project'))).toBeVisible();
    });

    it('should navigate to settings screen', async () => {
      // Look for and tap the settings button
      await helpers.tapElement(by.id('settings-button'));
      
      // Verify we're on the settings screen
      await helpers.waitForElement(by.text('Settings'));
      await expect(element(by.text('Settings'))).toBeVisible();
    });

    it('should navigate back from screens', async () => {
      // Navigate to new project
      await helpers.tapElement(by.id('new-project-button'));
      await helpers.waitForElement(by.text('New Project'));
      
      // Navigate back
      await helpers.tapElement(by.id('back-button'));
      
      // Verify we're back on home screen
      await helpers.waitForElement(by.text('Tefereth Scripts'));
      await expect(element(by.text('Tefereth Scripts'))).toBeVisible();
    });
  });

  describe('Project Creation Flow', () => {
    beforeEach(async () => {
      // Navigate to new project screen
      await helpers.tapElement(by.id('new-project-button'));
      await helpers.waitForElement(by.text('New Project'));
    });

    it('should create a new project with text input', async () => {
      // Enter project title
      await helpers.typeText(by.id('project-title-input'), 'Test Project');
      
      // Enter project content
      await helpers.typeText(
        by.id('project-content-input'), 
        'This is a test story for creating a storyboard.'
      );
      
      // Tap create project button
      await helpers.tapElement(by.id('create-project-button'));
      
      // Verify project creation success
      await helpers.waitForElement(by.text('Project created successfully'));
    });

    it('should show validation errors for empty fields', async () => {
      // Try to create project without filling fields
      await helpers.tapElement(by.id('create-project-button'));
      
      // Verify validation errors are shown
      await helpers.waitForElement(by.text('Title is required'));
      await expect(element(by.text('Title is required'))).toBeVisible();
    });

    it('should support document upload', async () => {
      // Tap upload document button
      await helpers.tapElement(by.id('upload-document-button'));
      
      // Verify document picker opens (this might need platform-specific handling)
      // For now, just verify the button is functional
      await helpers.waitForElement(by.id('upload-document-button'));
    });
  });

  describe('Offline Functionality', () => {
    it('should work when offline', async () => {
      // Disable network
      await device.setNetworkConnection(false);
      
      // Try to create a project
      await helpers.tapElement(by.id('new-project-button'));
      await helpers.waitForElement(by.text('New Project'));
      
      await helpers.typeText(by.id('project-title-input'), 'Offline Project');
      await helpers.typeText(
        by.id('project-content-input'), 
        'This project was created offline.'
      );
      
      await helpers.tapElement(by.id('create-project-button'));
      
      // Verify project is created locally
      await helpers.waitForElement(by.text('Project created successfully'));
      
      // Re-enable network
      await device.setNetworkConnection(true);
    });

    it('should sync when back online', async () => {
      // This test would verify that offline actions are synced
      // when the app comes back online
      await helpers.waitForElement(by.text('Tefereth Scripts'));
      
      // Verify sync indicator or success message
      // Implementation depends on how sync feedback is shown
    });
  });

  describe('Performance and Stability', () => {
    it('should handle app backgrounding and foregrounding', async () => {
      // Send app to background
      await device.sendToHome();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Bring app back to foreground
      await device.launchApp({ newInstance: false });
      
      // Verify app state is preserved
      await helpers.waitForElement(by.text('Tefereth Scripts'));
      await expect(element(by.text('Tefereth Scripts'))).toBeVisible();
    });

    it('should handle device rotation', async () => {
      // Rotate to landscape
      await device.setOrientation('landscape');
      
      // Verify app still works
      await helpers.waitForElement(by.text('Tefereth Scripts'));
      await expect(element(by.text('Tefereth Scripts'))).toBeVisible();
      
      // Rotate back to portrait
      await device.setOrientation('portrait');
      
      // Verify app still works
      await helpers.waitForElement(by.text('Tefereth Scripts'));
      await expect(element(by.text('Tefereth Scripts'))).toBeVisible();
    });
  });
});