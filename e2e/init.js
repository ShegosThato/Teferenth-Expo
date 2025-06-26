/**
 * E2E Test Initialization
 * 
 * This file sets up the testing environment for Detox E2E tests
 * and provides global utilities and configurations.
 */

const { device, expect, element, by, waitFor } = require('detox');

// Global timeout for all E2E tests
const DEFAULT_TIMEOUT = 10000;

// Helper functions for common E2E operations
global.helpers = {
  /**
   * Wait for element to be visible and tap it
   */
  async tapElement(matcher, timeout = DEFAULT_TIMEOUT) {
    await waitFor(element(matcher))
      .toBeVisible()
      .withTimeout(timeout);
    await element(matcher).tap();
  },

  /**
   * Wait for element to be visible and type text
   */
  async typeText(matcher, text, timeout = DEFAULT_TIMEOUT) {
    await waitFor(element(matcher))
      .toBeVisible()
      .withTimeout(timeout);
    await element(matcher).typeText(text);
  },

  /**
   * Wait for element to be visible
   */
  async waitForElement(matcher, timeout = DEFAULT_TIMEOUT) {
    await waitFor(element(matcher))
      .toBeVisible()
      .withTimeout(timeout);
  },

  /**
   * Scroll to element and tap it
   */
  async scrollAndTap(scrollMatcher, elementMatcher, direction = 'down') {
    await waitFor(element(elementMatcher))
      .toBeVisible()
      .whileElement(scrollMatcher)
      .scroll(200, direction);
    await element(elementMatcher).tap();
  },

  /**
   * Take screenshot for debugging
   */
  async takeScreenshot(name) {
    await device.takeScreenshot(name);
  },

  /**
   * Reload the app
   */
  async reloadApp() {
    await device.reloadReactNative();
  },

  /**
   * Launch app with specific permissions
   */
  async launchAppWithPermissions(permissions = {}) {
    await device.launchApp({
      permissions,
      newInstance: true
    });
  }
};

// Global test setup
beforeAll(async () => {
  // Launch the app before running tests
  await device.launchApp({ newInstance: true });
});

beforeEach(async () => {
  // Reload app before each test to ensure clean state
  await device.reloadReactNative();
});

afterAll(async () => {
  // Clean up after all tests
  await device.terminateApp();
});