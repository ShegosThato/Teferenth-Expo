# Testing Infrastructure

This directory contains comprehensive tests for the Tefereth Scripts application, implementing the critical **Phase 1: Testing Infrastructure** from the TODO.md roadmap.

## 🧪 Test Structure

### Unit Tests (`__tests__/`)

```
__tests__/
├── components/          # Component tests
│   └── SyncManager.test.tsx
├── db/                  # Database layer tests
│   └── actions.test.ts
├── lib/                 # Library/utility tests
│   ├── performance.test.ts
│   └── ErrorBoundary.test.tsx
├── screens/             # Screen component tests
│   └── HomeScreen.test.tsx
├── utils/               # Test utilities
│   └── testUtils.tsx
└── README.md
```

### E2E Tests (`e2e/`)

```
e2e/
├── jest.config.js       # E2E Jest configuration
├── init.js             # E2E test setup and helpers
└── app.test.js         # Main application flow tests
```

## 🎯 Test Coverage Areas

### ✅ Database Operations (`__tests__/db/`)
- **CRUD Operations**: Create, read, update, delete for projects and scenes
- **Action Queue**: Offline action queuing and processing
- **Error Handling**: Database error scenarios and recovery
- **Transactions**: Batch operations and data consistency

### ✅ Component Testing (`__tests__/components/`)
- **SyncManager**: Network state handling, sync operations, user feedback
- **Reactive Updates**: WatermelonDB observable integration
- **Performance**: Component rendering and optimization

### ✅ Screen Testing (`__tests__/screens/`)
- **HomeScreen**: Project listing, navigation, empty states
- **Navigation**: React Navigation integration
- **Theme Support**: Dark/light theme handling
- **User Interactions**: Touch events and user flows

### ✅ Performance Monitoring (`__tests__/lib/`)
- **Metrics Collection**: Memory usage, render times, performance tracking
- **Optimization Utilities**: Debounce, throttle, memoization
- **Threshold Detection**: Performance issue identification

### ✅ Error Handling (`__tests__/lib/`)
- **Error Boundary**: Error catching, user feedback, recovery
- **Retry Logic**: Automatic and manual error recovery
- **Error Reporting**: Comprehensive error logging and tracking

### ✅ E2E Testing (`e2e/`)
- **App Launch**: Application startup and initialization
- **Navigation**: Screen transitions and user flows
- **Project Creation**: End-to-end project creation workflow
- **Offline Functionality**: Offline-first behavior validation

## 🛠️ Test Configuration

### Jest Configuration (`package.json`)

```json
{
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterEnv": [
      "@testing-library/jest-native/extend-expect",
      "<rootDir>/jest.setup.js"
    ],
    "testMatch": [
      "**/__tests__/**/*.(ts|tsx|js)",
      "**/*.(test|spec).(ts|tsx|js)"
    ],
    "collectCoverageFrom": [
      "**/*.{ts,tsx}",
      "!**/*.d.ts",
      "!**/coverage/**",
      "!**/node_modules/**"
    ]
  }
}
```

### Test Scripts

```bash
# Unit tests
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
npm run test:ci           # CI mode

# E2E tests
npm run test:e2e:build    # Build for E2E
npm run test:e2e:ios      # iOS E2E tests
npm run test:e2e:android  # Android E2E tests
```

## 🔧 Test Utilities

### Mock Setup (`jest.setup.js`)
- React Native modules (AsyncStorage, NetInfo, etc.)
- Expo modules (FileSystem, DocumentPicker, etc.)
- WatermelonDB and database operations
- Navigation and routing
- Performance monitoring

### Test Helpers (`__tests__/utils/testUtils.tsx`)
- **renderWithProviders**: Render components with necessary providers
- **Mock Data Generators**: Create test data for projects, scenes, actions
- **Network Mocks**: Simulate online/offline states
- **Database Mocks**: Mock database operations and responses

## 📊 Coverage Goals

- **Database Layer**: 95%+ coverage for all CRUD operations
- **Components**: 90%+ coverage for critical user-facing components
- **Error Handling**: 100% coverage for error boundaries and recovery
- **Performance**: 85%+ coverage for monitoring and optimization
- **E2E Flows**: 100% coverage for critical user journeys

## 🚀 Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# For E2E tests (iOS)
npx pod-install ios

# For E2E tests (Android)
# Ensure Android emulator is running
```

### Unit Tests
```bash
# Run all unit tests
npm test

# Run specific test file
npm test -- __tests__/db/actions.test.ts

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### E2E Tests
```bash
# Build the app for testing
npm run test:e2e:build

# Run E2E tests on iOS
npm run test:e2e:ios

# Run E2E tests on Android
npm run test:e2e:android
```

### Validation
```bash
# Validate test infrastructure
node scripts/validate-tests.js

# Run comprehensive test suite
node scripts/run-tests.js
```

## 🎯 Test-Driven Development

### Writing New Tests

1. **Component Tests**:
   ```tsx
   import { render, fireEvent } from '@testing-library/react-native';
   import { renderWithProviders } from '../utils/testUtils';
   
   describe('MyComponent', () => {
     it('should render correctly', () => {
       const { getByText } = renderWithProviders(<MyComponent />);
       expect(getByText('Expected Text')).toBeTruthy();
     });
   });
   ```

2. **Database Tests**:
   ```ts
   import { createMockDatabase } from '../utils/testUtils';
   import { createProject } from '../../db/actions';
   
   describe('Database Actions', () => {
     it('should create project', async () => {
       const mockDb = createMockDatabase();
       const result = await createProject(mockDb, projectData);
       expect(result).toBeDefined();
     });
   });
   ```

3. **E2E Tests**:
   ```js
   describe('App Flow', () => {
     it('should create new project', async () => {
       await helpers.tapElement(by.id('new-project-button'));
       await helpers.typeText(by.id('title-input'), 'Test Project');
       await helpers.tapElement(by.id('create-button'));
       await helpers.waitForElement(by.text('Project created'));
     });
   });
   ```

## 📈 Continuous Integration

### GitHub Actions (Recommended)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run test:ci
      - run: npm run test:coverage
```

## 🔍 Debugging Tests

### Common Issues
1. **Mock Issues**: Check `jest.setup.js` for proper mocking
2. **Async Operations**: Use `waitFor` for async assertions
3. **Navigation**: Ensure proper navigation mocking
4. **Database**: Verify database mocks and transactions

### Debug Commands
```bash
# Run tests with verbose output
npm test -- --verbose

# Run single test file
npm test -- --testNamePattern="specific test"

# Debug mode
npm test -- --runInBand --detectOpenHandles
```

## 📋 Test Checklist

Before merging code, ensure:

- [ ] All unit tests pass
- [ ] Coverage meets minimum thresholds
- [ ] E2E tests pass (where applicable)
- [ ] No console errors or warnings
- [ ] Performance tests within acceptable limits
- [ ] Error scenarios are tested
- [ ] Accessibility requirements are met

## 🎉 Benefits Achieved

✅ **Reliable Development**: Catch bugs early in development cycle  
✅ **Confident Refactoring**: Safe code changes with test coverage  
✅ **Quality Assurance**: Automated quality checks and validation  
✅ **Documentation**: Tests serve as living documentation  
✅ **Performance Monitoring**: Automated performance regression detection  
✅ **Error Prevention**: Comprehensive error handling validation  

This testing infrastructure provides the foundation for reliable, maintainable, and high-quality React Native development, addressing the critical **Phase 1** priority from the project roadmap.