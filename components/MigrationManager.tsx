// components/MigrationManager.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useDatabase } from '../db/DatabaseContext';
import { migrateLegacyData } from '../db/migrations';
import { colors } from '../lib/theme';

interface MigrationManagerProps {
  children: React.ReactNode;
}

export const MigrationManager: React.FC<MigrationManagerProps> = ({ children }) => {
  const database = useDatabase();
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);

  useEffect(() => {
    const runMigration = async () => {
      try {
        await migrateLegacyData(database);
        setMigrationComplete(true);
      } catch (error) {
        console.error('Migration failed:', error);
        setMigrationError(error.message);
        // Still allow the app to continue
        setMigrationComplete(true);
      }
    };

    runMigration();
  }, [database]);

  if (!migrationComplete) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>Setting up your data...</Text>
        {migrationError && (
          <Text style={styles.errorText}>
            Migration warning: {migrationError}
          </Text>
        )}
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.danger,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});