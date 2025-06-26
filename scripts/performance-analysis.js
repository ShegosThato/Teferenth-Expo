#!/usr/bin/env node

/**
 * Performance Analysis Script
 * 
 * Analyzes bundle size, component performance, and optimization opportunities
 */

const fs = require('fs');
const path = require('path');

class PerformanceAnalyzer {
  constructor() {
    this.projectRoot = process.cwd();
    this.sourceDir = path.join(this.projectRoot, 'src');
    this.componentsDir = path.join(this.projectRoot, 'components');
    this.screensDir = path.join(this.projectRoot, 'screens');
    this.libDir = path.join(this.projectRoot, 'lib');
  }

  // Analyze file sizes
  analyzeFileSizes() {
    const results = {
      largeFiles: [],
      totalSize: 0,
      fileCount: 0,
    };

    const analyzeDirectory = (dir) => {
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          analyzeDirectory(filePath);
        } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
          const size = stat.size;
          results.totalSize += size;
          results.fileCount++;

          if (size > 10000) { // Files larger than 10KB
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n').length;
            
            results.largeFiles.push({
              path: path.relative(this.projectRoot, filePath),
              size,
              lines,
              sizeKB: (size / 1024).toFixed(2),
            });
          }
        }
      });
    };

    [this.componentsDir, this.screensDir, this.libDir].forEach(analyzeDirectory);

    results.largeFiles.sort((a, b) => b.size - a.size);
    return results;
  }

  // Analyze component complexity
  analyzeComponentComplexity() {
    const results = {
      complexComponents: [],
      totalComponents: 0,
    };

    const analyzeFile = (filePath) => {
      if (!fs.existsSync(filePath)) return;

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      // Simple complexity metrics
      const metrics = {
        path: path.relative(this.projectRoot, filePath),
        lines: lines.length,
        functions: (content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length,
        hooks: (content.match(/use[A-Z]\w*/g) || []).length,
        jsx: (content.match(/<[A-Z]\w*/g) || []).length,
        imports: (content.match(/^import\s/gm) || []).length,
        exports: (content.match(/^export\s/gm) || []).length,
      };

      // Calculate complexity score
      metrics.complexity = 
        metrics.lines * 0.1 +
        metrics.functions * 2 +
        metrics.hooks * 1.5 +
        metrics.jsx * 0.5 +
        metrics.imports * 0.5;

      if (metrics.complexity > 50) {
        results.complexComponents.push(metrics);
      }

      results.totalComponents++;
    };

    const analyzeDirectory = (dir) => {
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          analyzeDirectory(filePath);
        } else if (file.match(/\.(tsx|jsx)$/)) {
          analyzeFile(filePath);
        }
      });
    };

    [this.componentsDir, this.screensDir].forEach(analyzeDirectory);

    results.complexComponents.sort((a, b) => b.complexity - a.complexity);
    return results;
  }

  // Analyze dependencies
  analyzeDependencies() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return { error: 'package.json not found' };
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    const results = {
      totalDependencies: Object.keys(dependencies).length,
      largeDependencies: [],
      outdatedDependencies: [],
      unusedDependencies: [],
    };

    // Estimate dependency sizes (simplified)
    const sizeEstimates = {
      'react-native': 2000,
      'react': 300,
      '@react-navigation/native': 500,
      '@expo/vector-icons': 1000,
      'zustand': 150,
      '@nozbe/watermelondb': 800,
      'ffmpeg-kit-react-native': 5000,
    };

    Object.entries(dependencies).forEach(([name, version]) => {
      const estimatedSize = sizeEstimates[name] || 100;
      
      if (estimatedSize > 500) {
        results.largeDependencies.push({
          name,
          version,
          estimatedSizeKB: estimatedSize,
        });
      }
    });

    results.largeDependencies.sort((a, b) => b.estimatedSizeKB - a.estimatedSizeKB);
    return results;
  }

  // Find optimization opportunities
  findOptimizationOpportunities() {
    const fileSizes = this.analyzeFileSizes();
    const complexity = this.analyzeComponentComplexity();
    const dependencies = this.analyzeDependencies();

    const opportunities = [];

    // Large file opportunities
    fileSizes.largeFiles.slice(0, 5).forEach(file => {
      if (file.lines > 500) {
        opportunities.push({
          type: 'Component Splitting',
          priority: 'High',
          description: `${file.path} has ${file.lines} lines and could be split into smaller components`,
          impact: 'Maintainability, Performance',
        });
      }
    });

    // Complex component opportunities
    complexity.complexComponents.slice(0, 3).forEach(component => {
      opportunities.push({
        type: 'Complexity Reduction',
        priority: 'Medium',
        description: `${component.path} has high complexity (${component.complexity.toFixed(1)}) and could be refactored`,
        impact: 'Maintainability, Testing',
      });
    });

    // Large dependency opportunities
    dependencies.largeDependencies.slice(0, 3).forEach(dep => {
      opportunities.push({
        type: 'Bundle Optimization',
        priority: 'Medium',
        description: `${dep.name} is large (${dep.estimatedSizeKB}KB) - consider lazy loading or alternatives`,
        impact: 'Bundle Size, Load Time',
      });
    });

    // Code splitting opportunities
    if (fileSizes.largeFiles.length > 3) {
      opportunities.push({
        type: 'Code Splitting',
        priority: 'High',
        description: 'Multiple large components detected - implement lazy loading',
        impact: 'Initial Load Time, Memory Usage',
      });
    }

    return opportunities;
  }

  // Generate performance report
  generateReport() {
    console.log('🔍 Analyzing Performance...\n');

    const fileSizes = this.analyzeFileSizes();
    const complexity = this.analyzeComponentComplexity();
    const dependencies = this.analyzeDependencies();
    const opportunities = this.findOptimizationOpportunities();

    let report = '# Performance Analysis Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    // File Size Analysis
    report += '## File Size Analysis\n\n';
    report += `- Total Files: ${fileSizes.fileCount}\n`;
    report += `- Total Size: ${(fileSizes.totalSize / 1024).toFixed(2)} KB\n`;
    report += `- Large Files (>10KB): ${fileSizes.largeFiles.length}\n\n`;

    if (fileSizes.largeFiles.length > 0) {
      report += '### Largest Files\n\n';
      fileSizes.largeFiles.slice(0, 10).forEach((file, index) => {
        report += `${index + 1}. ${file.path} - ${file.sizeKB} KB (${file.lines} lines)\n`;
      });
      report += '\n';
    }

    // Component Complexity
    report += '## Component Complexity Analysis\n\n';
    report += `- Total Components: ${complexity.totalComponents}\n`;
    report += `- Complex Components: ${complexity.complexComponents.length}\n\n`;

    if (complexity.complexComponents.length > 0) {
      report += '### Most Complex Components\n\n';
      complexity.complexComponents.slice(0, 5).forEach((comp, index) => {
        report += `${index + 1}. ${comp.path} - Complexity: ${comp.complexity.toFixed(1)}\n`;
        report += `   - Lines: ${comp.lines}, Functions: ${comp.functions}, Hooks: ${comp.hooks}\n`;
      });
      report += '\n';
    }

    // Dependencies
    report += '## Dependency Analysis\n\n';
    report += `- Total Dependencies: ${dependencies.totalDependencies}\n`;
    report += `- Large Dependencies: ${dependencies.largeDependencies.length}\n\n`;

    if (dependencies.largeDependencies.length > 0) {
      report += '### Largest Dependencies\n\n';
      dependencies.largeDependencies.forEach((dep, index) => {
        report += `${index + 1}. ${dep.name} - ~${dep.estimatedSizeKB} KB\n`;
      });
      report += '\n';
    }

    // Optimization Opportunities
    report += '## Optimization Opportunities\n\n';
    if (opportunities.length === 0) {
      report += 'No major optimization opportunities found.\n\n';
    } else {
      opportunities.forEach((opp, index) => {
        report += `### ${index + 1}. ${opp.type} (${opp.priority} Priority)\n`;
        report += `**Description:** ${opp.description}\n`;
        report += `**Impact:** ${opp.impact}\n\n`;
      });
    }

    // Recommendations
    report += '## Recommendations\n\n';
    
    if (fileSizes.largeFiles.length > 5) {
      report += '1. **Implement Code Splitting**: Break down large components into smaller, focused modules\n';
    }
    
    if (complexity.complexComponents.length > 3) {
      report += '2. **Reduce Component Complexity**: Refactor complex components using composition patterns\n';
    }
    
    if (dependencies.largeDependencies.length > 5) {
      report += '3. **Optimize Bundle Size**: Consider lazy loading for large dependencies\n';
    }
    
    report += '4. **Implement Performance Monitoring**: Add runtime performance tracking\n';
    report += '5. **Regular Performance Audits**: Run this analysis regularly to catch regressions\n';

    return report;
  }

  // Save report to file
  saveReport(report) {
    const reportPath = path.join(this.projectRoot, 'performance-report.md');
    fs.writeFileSync(reportPath, report);
    console.log(`📊 Performance report saved to: ${reportPath}`);
  }

  // Run full analysis
  run() {
    try {
      const report = this.generateReport();
      console.log(report);
      this.saveReport(report);
      
      console.log('\n✅ Performance analysis complete!');
      console.log('📋 Check performance-report.md for detailed results');
      
    } catch (error) {
      console.error('❌ Performance analysis failed:', error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const analyzer = new PerformanceAnalyzer();
  analyzer.run();
}

module.exports = PerformanceAnalyzer;