# Application Architecture

This document outlines the improved architecture of the Tefereth Scripts application, focusing on better code organization, separation of concerns, and maintainability.

## 🏗️ Architecture Overview

The application follows a layered architecture with clear separation between:

- **Presentation Layer** - React components and UI logic
- **State Management Layer** - Zustand stores for different domains
- **Service Layer** - Business logic and data operations
- **Data Layer** - Database operations and external APIs

## 📁 Directory Structure

```
src/
├── components/           # Reusable UI components
│   ├── SyncManager/     # Component modules with related files
│   │   ├── SyncManager.tsx
│   │   ├── useSyncManager.ts
│   │   ├── SyncIndicator.tsx
│   │   └── index.ts
│   └── ...
├── stores/              # Domain-specific state stores
│   ├── projectStore.ts  # Project-related state
│   ├── settingsStore.ts # Application settings
│   ├── uiStore.ts       # UI state and interactions
│   └── index.ts         # Combined exports
├── services/            # Business logic services
│   ├── ProjectService.ts
│   ├── DataService.ts
│   ├── SettingsService.ts
│   └── index.ts
├── types/               # Centralized type definitions
│   └── index.ts
├── lib/                 # Utilities and helpers
├── screens/             # Screen components
└── db/                  # Database layer
```

## 🔄 Data Flow

```
UI Components
     ↓
Custom Hooks (useProject, useSettings)
     ↓
Zustand Stores (projectStore, settingsStore)
     ↓
Services (ProjectService, DataService)
     ↓
Database/APIs
```

## 🏪 Store Architecture

### Domain-Specific Stores

Instead of one large store, we use focused stores for different domains:

#### ProjectStore (`stores/projectStore.ts`)
- Manages project CRUD operations
- Handles project selection and filtering
- Provides project statistics and analytics

```typescript
import { useProjectStore } from './stores';

const { projects, addProject, updateProject } = useProjectStore();
```

#### SettingsStore (`stores/settingsStore.ts`)
- Manages application settings
- Handles theme preferences
- Controls auto-save and backup settings

```typescript
import { useSettingsStore } from './stores';

const { theme, updateTheme, autoSave } = useSettingsStore();
```

#### UIStore (`stores/uiStore.ts`)
- Manages transient UI state
- Handles modals and notifications
- Controls loading states

```typescript
import { useUIStore } from './stores';

const { isLoading, openModal, addNotification } = useUIStore();
```

### Store Benefits

1. **Performance**: Targeted subscriptions reduce unnecessary re-renders
2. **Maintainability**: Smaller, focused stores are easier to understand
3. **Testing**: Isolated stores can be tested independently
4. **Type Safety**: Better TypeScript support with focused interfaces

## 🔧 Service Layer

Services handle business logic and data operations, keeping stores focused on state management.

### ProjectService (`services/ProjectService.ts`)
- Project creation and validation
- Project duplication logic
- Statistics calculation
- Data optimization

### DataService (`services/DataService.ts`)
- Export/import operations
- Backup and restore functionality
- Data size calculation
- Storage optimization

### SettingsService (`services/SettingsService.ts`)
- Settings persistence
- Auto-save management
- Theme handling
- Notification preferences

## 🎯 Component Architecture

### Component Organization

Components are organized into modules with related files:

```
components/SyncManager/
├── SyncManager.tsx      # Main component
├── useSyncManager.ts    # Custom hook with logic
├── SyncIndicator.tsx    # Sub-component
└── index.ts             # Module exports
```

### Benefits

1. **Separation of Concerns**: Logic separated from presentation
2. **Reusability**: Custom hooks can be reused across components
3. **Testability**: Logic and UI can be tested separately
4. **Maintainability**: Related files are grouped together

## 📝 Type Safety

### Centralized Types (`types/index.ts`)

All shared types are defined in a central location:

```typescript
export interface Project {
  id: string;
  title: string;
  // ... other properties
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  // ... other settings
}
```

### Benefits

1. **Consistency**: Single source of truth for types
2. **Maintainability**: Easy to update types across the app
3. **IntelliSense**: Better IDE support
4. **Refactoring**: Safer refactoring with TypeScript

## 🔄 Migration Guide

### From Old Store to New Architecture

**Before:**
```typescript
import useStore from './lib/store';

const Component = () => {
  const { projects, addProject, settings, updateSettings } = useStore();
  // ...
};
```

**After:**
```typescript
import { useProjectStore, useSettingsStore } from './stores';

const Component = () => {
  const { projects, addProject } = useProjectStore();
  const { settings, updateSettings } = useSettingsStore();
  // ...
};
```

### Benefits of Migration

1. **Performance**: Only subscribe to relevant state changes
2. **Bundle Size**: Tree-shaking removes unused store code
3. **Developer Experience**: Better autocomplete and type checking
4. **Maintainability**: Easier to understand and modify

## 🧪 Testing Strategy

### Store Testing
```typescript
import { useProjectStore } from '../stores/projectStore';

describe('ProjectStore', () => {
  it('should add a project', async () => {
    const store = useProjectStore.getState();
    await store.addProject(mockProject);
    expect(store.projects).toHaveLength(1);
  });
});
```

### Service Testing
```typescript
import { projectService } from '../services/ProjectService';

describe('ProjectService', () => {
  it('should create a project with valid data', async () => {
    const project = await projectService.createProject(mockData);
    expect(project.id).toBeDefined();
  });
});
```

### Component Testing
```typescript
import { render } from '@testing-library/react-native';
import { SyncManager } from '../components/SyncManager';

describe('SyncManager', () => {
  it('should render sync indicator', () => {
    const { getByText } = render(<SyncManager />);
    expect(getByText('Synced')).toBeTruthy();
  });
});
```

## 🚀 Performance Optimizations

### Store Optimizations

1. **Selective Subscriptions**: Only subscribe to needed state slices
2. **Computed Values**: Use selectors for derived state
3. **Memoization**: Prevent unnecessary re-computations

### Component Optimizations

1. **Custom Hooks**: Extract logic to prevent re-renders
2. **React.memo**: Memoize components when appropriate
3. **Lazy Loading**: Load components on demand

## 📊 Monitoring and Debugging

### Store DevTools

```typescript
import { devtools } from 'zustand/middleware';

export const useProjectStore = create<ProjectState>()(
  devtools(
    (set, get) => ({
      // store implementation
    }),
    { name: 'project-store' }
  )
);
```

### Performance Monitoring

```typescript
import { performanceMonitor } from '../lib/performance';

const operation = async () => {
  const startTime = performance.now();
  // ... operation
  performanceMonitor.trackOperation('operation_name', performance.now() - startTime);
};
```

## 🔮 Future Improvements

1. **State Persistence**: Add selective persistence for stores
2. **Offline Support**: Enhance offline capabilities
3. **Real-time Sync**: Add real-time synchronization
4. **Performance Metrics**: Add detailed performance tracking
5. **Error Boundaries**: Implement store-level error boundaries

## 📚 Best Practices

1. **Keep stores focused**: Each store should handle a single domain
2. **Use services for business logic**: Keep stores focused on state
3. **Centralize types**: Define shared types in one location
4. **Test stores and services**: Write comprehensive tests
5. **Monitor performance**: Track store operations and optimizations
6. **Document changes**: Keep architecture documentation updated

This architecture provides a solid foundation for scaling the application while maintaining code quality and developer experience.