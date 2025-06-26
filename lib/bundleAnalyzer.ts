/**
 * Bundle Analyzer
 * 
 * Tools for analyzing and optimizing bundle size and performance
 */

import { Platform } from 'react-native';

export interface BundleAnalysis {
  totalSize: number;
  moduleCount: number;
  largestModules: Array<{
    name: string;
    size: number;
    percentage: number;
  }>;
  duplicates: Array<{
    name: string;
    count: number;
    totalSize: number;
  }>;
  recommendations: string[];
}

export interface ModuleInfo {
  name: string;
  size: number;
  dependencies: string[];
  isLazy: boolean;
  isCore: boolean;
}

export class BundleAnalyzer {
  private static moduleRegistry = new Map<string, ModuleInfo>();
  private static loadTimes = new Map<string, number>();

  // Register a module for analysis
  static registerModule(name: string, info: Partial<ModuleInfo>) {
    const moduleInfo: ModuleInfo = {
      name,
      size: info.size || 0,
      dependencies: info.dependencies || [],
      isLazy: info.isLazy || false,
      isCore: info.isCore || false,
    };

    this.moduleRegistry.set(name, moduleInfo);
  }

  // Track module load time
  static trackModuleLoad(name: string, loadTime: number) {
    this.loadTimes.set(name, loadTime);
  }

  // Analyze bundle composition
  static analyzeBundleComposition(): BundleAnalysis {
    const modules = Array.from(this.moduleRegistry.values());
    const totalSize = modules.reduce((sum, module) => sum + module.size, 0);

    // Find largest modules
    const largestModules = modules
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .map(module => ({
        name: module.name,
        size: module.size,
        percentage: (module.size / totalSize) * 100,
      }));

    // Find duplicate dependencies
    const dependencyCount = new Map<string, number>();
    modules.forEach(module => {
      module.dependencies.forEach(dep => {
        dependencyCount.set(dep, (dependencyCount.get(dep) || 0) + 1);
      });
    });

    const duplicates = Array.from(dependencyCount.entries())
      .filter(([_, count]) => count > 1)
      .map(([name, count]) => ({
        name,
        count,
        totalSize: this.estimateModuleSize(name) * count,
      }))
      .sort((a, b) => b.totalSize - a.totalSize);

    // Generate recommendations
    const recommendations = this.generateRecommendations(modules, duplicates, totalSize);

    return {
      totalSize,
      moduleCount: modules.length,
      largestModules,
      duplicates,
      recommendations,
    };
  }

  // Generate optimization recommendations
  private static generateRecommendations(
    modules: ModuleInfo[],
    duplicates: Array<{ name: string; count: number; totalSize: number }>,
    totalSize: number
  ): string[] {
    const recommendations: string[] = [];

    // Bundle size recommendations
    if (totalSize > 2 * 1024 * 1024) { // 2MB
      recommendations.push('Bundle size is large (>2MB). Consider code splitting.');
    }

    // Large module recommendations
    const largeModules = modules.filter(m => m.size > 100 * 1024); // 100KB
    if (largeModules.length > 0) {
      recommendations.push(
        `Large modules detected: ${largeModules.map(m => m.name).join(', ')}. Consider lazy loading.`
      );
    }

    // Duplicate dependency recommendations
    if (duplicates.length > 0) {
      const topDuplicates = duplicates.slice(0, 3);
      recommendations.push(
        `Duplicate dependencies found: ${topDuplicates.map(d => d.name).join(', ')}. Consider deduplication.`
      );
    }

    // Lazy loading recommendations
    const nonLazyLargeModules = modules.filter(m => !m.isLazy && !m.isCore && m.size > 50 * 1024);
    if (nonLazyLargeModules.length > 0) {
      recommendations.push(
        `Consider lazy loading: ${nonLazyLargeModules.map(m => m.name).join(', ')}`
      );
    }

    // Performance recommendations
    const slowModules = Array.from(this.loadTimes.entries())
      .filter(([_, time]) => time > 100)
      .map(([name]) => name);
    
    if (slowModules.length > 0) {
      recommendations.push(
        `Slow loading modules: ${slowModules.join(', ')}. Consider optimization.`
      );
    }

    return recommendations;
  }

  // Estimate module size (rough estimation)
  private static estimateModuleSize(moduleName: string): number {
    const module = this.moduleRegistry.get(moduleName);
    if (module) {
      return module.size;
    }

    // Rough estimation based on module name
    if (moduleName.includes('react-native')) return 50 * 1024;
    if (moduleName.includes('react')) return 30 * 1024;
    if (moduleName.includes('lodash')) return 20 * 1024;
    if (moduleName.includes('@expo')) return 15 * 1024;
    
    return 5 * 1024; // Default estimate
  }

  // Get module dependency tree
  static getDependencyTree(moduleName: string): Record<string, unknown> {
    const module = this.moduleRegistry.get(moduleName);
    if (!module) {
      return {};
    }

    const tree: Record<string, unknown> = {
      name: module.name,
      size: module.size,
      isLazy: module.isLazy,
      dependencies: {},
    };

    module.dependencies.forEach(dep => {
      const depTree = this.getDependencyTree(dep);
      if (Object.keys(depTree).length > 0) {
        (tree.dependencies as Record<string, unknown>)[dep] = depTree;
      }
    });

    return tree;
  }

  // Find circular dependencies
  static findCircularDependencies(): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (moduleName: string, path: string[]): void => {
      if (recursionStack.has(moduleName)) {
        // Found a cycle
        const cycleStart = path.indexOf(moduleName);
        cycles.push(path.slice(cycleStart).concat(moduleName));
        return;
      }

      if (visited.has(moduleName)) {
        return;
      }

      visited.add(moduleName);
      recursionStack.add(moduleName);

      const module = this.moduleRegistry.get(moduleName);
      if (module) {
        module.dependencies.forEach(dep => {
          dfs(dep, [...path, moduleName]);
        });
      }

      recursionStack.delete(moduleName);
    };

    Array.from(this.moduleRegistry.keys()).forEach(moduleName => {
      if (!visited.has(moduleName)) {
        dfs(moduleName, []);
      }
    });

    return cycles;
  }

  // Generate bundle report
  static generateReport(): string {
    const analysis = this.analyzeBundleComposition();
    const circularDeps = this.findCircularDependencies();

    let report = '# Bundle Analysis Report\n\n';

    // Overview
    report += '## Overview\n';
    report += `- Total Bundle Size: ${(analysis.totalSize / 1024).toFixed(2)} KB\n`;
    report += `- Module Count: ${analysis.moduleCount}\n`;
    report += `- Platform: ${Platform.OS}\n\n`;

    // Largest modules
    report += '## Largest Modules\n';
    analysis.largestModules.forEach((module, index) => {
      report += `${index + 1}. ${module.name}: ${(module.size / 1024).toFixed(2)} KB (${module.percentage.toFixed(1)}%)\n`;
    });
    report += '\n';

    // Duplicates
    if (analysis.duplicates.length > 0) {
      report += '## Duplicate Dependencies\n';
      analysis.duplicates.forEach((dup, index) => {
        report += `${index + 1}. ${dup.name}: ${dup.count} instances, ${(dup.totalSize / 1024).toFixed(2)} KB total\n`;
      });
      report += '\n';
    }

    // Circular dependencies
    if (circularDeps.length > 0) {
      report += '## Circular Dependencies\n';
      circularDeps.forEach((cycle, index) => {
        report += `${index + 1}. ${cycle.join(' → ')}\n`;
      });
      report += '\n';
    }

    // Recommendations
    report += '## Recommendations\n';
    analysis.recommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec}\n`;
    });

    return report;
  }

  // Performance metrics
  static getPerformanceMetrics() {
    const loadTimes = Array.from(this.loadTimes.values());
    const avgLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length;
    const maxLoadTime = Math.max(...loadTimes);
    const slowModules = Array.from(this.loadTimes.entries())
      .filter(([_, time]) => time > 100)
      .length;

    return {
      averageLoadTime: avgLoadTime,
      maxLoadTime,
      slowModuleCount: slowModules,
      totalModules: this.moduleRegistry.size,
    };
  }

  // Clear analysis data
  static clear() {
    this.moduleRegistry.clear();
    this.loadTimes.clear();
  }
}

// Auto-register common React Native modules
if (__DEV__) {
  // Register core modules with estimated sizes
  BundleAnalyzer.registerModule('react', { size: 30 * 1024, isCore: true });
  BundleAnalyzer.registerModule('react-native', { size: 200 * 1024, isCore: true });
  BundleAnalyzer.registerModule('@react-navigation/native', { size: 50 * 1024 });
  BundleAnalyzer.registerModule('@expo/vector-icons', { size: 100 * 1024 });
  BundleAnalyzer.registerModule('zustand', { size: 15 * 1024 });
}

export default BundleAnalyzer;