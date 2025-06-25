// db/DatabaseContext.tsx
import React, { createContext, useContext } from 'react';
import { Database } from '@nozbe/watermelondb';
import { database } from './index';

export const DatabaseContext = createContext<Database>(database);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <DatabaseContext.Provider value={database}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};