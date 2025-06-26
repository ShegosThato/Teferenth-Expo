#!/usr/bin/env npx ts-node

/**
 * Type Safety Validation Script
 * 
 * This script validates type safety across the application and identifies
 * remaining any types that need to be addressed.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface TypeIssue {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  type: 'any_type' | 'missing_type' | 'type_assertion' | 'type_error';
}

interface ValidationResult {
  totalFiles: number;
  filesWithIssues: number;
  totalIssues: number;
  issuesByType: Record<string, number>;
  issues: TypeIssue[];
}

class TypeSafetyValidator {
  private projectRoot: string;
  private excludePatterns: string[] = [
    'node_modules',
    '.expo',
    'dist',
    'build',
    '__tests__',
    '.test.',
    '.spec.',
  ];

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  // Main validation function
  async validate(): Promise<ValidationResult> {
    console.log('🔍 Starting Type Safety Validation...\n');

    const result: ValidationResult = {
      totalFiles: 0,
      filesWithIssues: 0,
      totalIssues: 0,
      issuesByType: {},
      issues: [],
    };

    // Find all TypeScript files
    const tsFiles = this.findTypeScriptFiles();
    result.totalFiles = tsFiles.length;

    console.log(`📁 Found ${tsFiles.length} TypeScript files\n`);

    // Check for any types
    await this.checkForAnyTypes(tsFiles, result);

    // Run TypeScript compiler check
    await this.runTypeScriptCheck(result);

    // Check for type assertions
    await this.checkTypeAssertions(tsFiles, result);

    // Check for missing return types
    await this.checkMissingReturnTypes(tsFiles, result);

    // Generate summary
    this.generateSummary(result);

    return result;
  }

  // Find all TypeScript files
  private findTypeScriptFiles(): string[] {
    const files: string[] = [];
    
    const walkDir = (dir: string) => {
      const entries = fs.readdirSync(dir);
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip excluded directories
          if (!this.excludePatterns.some(pattern => entry.includes(pattern))) {
            walkDir(fullPath);
          }
        } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
          // Skip excluded files
          if (!this.excludePatterns.some(pattern => entry.includes(pattern))) {
            files.push(fullPath);
          }
        }
      }
    };

    walkDir(this.projectRoot);
    return files;
  }

  // Check for any types
  private async checkForAnyTypes(files: string[], result: ValidationResult): Promise<void> {
    console.log('🔎 Checking for any types...');
    
    const anyTypePatterns = [
      /:\s*any\s*[;,\)\]\}]/g,
      /as\s+any\s*[;,\)\]\}]/g,
      /<any>/g,
      /Array<any>/g,
      /Record<string,\s*any>/g,
      /\(.*:\s*any.*\)/g,
    ];

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          anyTypePatterns.forEach(pattern => {
            const matches = [...line.matchAll(pattern)];
            matches.forEach(match => {
              // Skip if it's in a comment
              if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
                return;
              }

              result.issues.push({
                file: path.relative(this.projectRoot, file),
                line: index + 1,
                column: match.index || 0,
                message: `Found 'any' type: ${match[0].trim()}`,
                severity: 'warning',
                type: 'any_type',
              });
            });
          });
        });
      } catch (error) {
        console.warn(`⚠️ Could not read file: ${file}`);
      }
    }

    const anyTypeIssues = result.issues.filter(issue => issue.type === 'any_type');
    result.issuesByType.any_type = anyTypeIssues.length;
    
    console.log(`   Found ${anyTypeIssues.length} any type usages\n`);
  }

  // Run TypeScript compiler check
  private async runTypeScriptCheck(result: ValidationResult): Promise<void> {
    console.log('🔧 Running TypeScript compiler check...');
    
    try {
      // Run tsc --noEmit to check for type errors
      execSync('npx tsc --noEmit --pretty false', { 
        cwd: this.projectRoot,
        stdio: 'pipe',
      });
      console.log('   ✅ No TypeScript compilation errors\n');
    } catch (error) {
      const output = (error as any).stdout?.toString() || '';
      const lines = output.split('\n').filter(line => line.trim());
      
      lines.forEach(line => {
        const match = line.match(/^(.+)\((\d+),(\d+)\):\s*(error|warning)\s*TS\d+:\s*(.+)$/);
        if (match) {
          const [, file, lineNum, colNum, severity, message] = match;
          
          result.issues.push({
            file: path.relative(this.projectRoot, file),
            line: parseInt(lineNum),
            column: parseInt(colNum),
            message: message.trim(),
            severity: severity as 'error' | 'warning',
            type: 'type_error',
          });
        }
      });

      const typeErrors = result.issues.filter(issue => issue.type === 'type_error');
      result.issuesByType.type_error = typeErrors.length;
      
      console.log(`   ❌ Found ${typeErrors.length} TypeScript errors\n`);
    }
  }

  // Check for type assertions
  private async checkTypeAssertions(files: string[], result: ValidationResult): Promise<void> {
    console.log('🎭 Checking for type assertions...');
    
    const assertionPatterns = [
      /as\s+\w+/g,
      /<\w+>/g,
      /!\s*[;,\)\]\}]/g, // Non-null assertions
    ];

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          assertionPatterns.forEach(pattern => {
            const matches = [...line.matchAll(pattern)];
            matches.forEach(match => {
              // Skip comments and certain safe patterns
              if (line.trim().startsWith('//') || 
                  line.trim().startsWith('*') ||
                  match[0].includes('as const') ||
                  match[0].includes('as React.')) {
                return;
              }

              result.issues.push({
                file: path.relative(this.projectRoot, file),
                line: index + 1,
                column: match.index || 0,
                message: `Type assertion found: ${match[0].trim()}`,
                severity: 'info',
                type: 'type_assertion',
              });
            });
          });
        });
      } catch (error) {
        console.warn(`⚠️ Could not read file: ${file}`);
      }
    }

    const assertionIssues = result.issues.filter(issue => issue.type === 'type_assertion');
    result.issuesByType.type_assertion = assertionIssues.length;
    
    console.log(`   Found ${assertionIssues.length} type assertions\n`);
  }

  // Check for missing return types
  private async checkMissingReturnTypes(files: string[], result: ValidationResult): Promise<void> {
    console.log('📤 Checking for missing return types...');
    
    const functionPatterns = [
      /function\s+\w+\s*\([^)]*\)\s*\{/g,
      /const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{/g,
      /\w+\s*\([^)]*\)\s*\{/g, // Method definitions
    ];

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          functionPatterns.forEach(pattern => {
            const matches = [...line.matchAll(pattern)];
            matches.forEach(match => {
              // Skip if return type is already specified
              if (line.includes('): ') || 
                  line.trim().startsWith('//') || 
                  line.trim().startsWith('*') ||
                  line.includes('constructor') ||
                  line.includes('interface') ||
                  line.includes('type ')) {
                return;
              }

              result.issues.push({
                file: path.relative(this.projectRoot, file),
                line: index + 1,
                column: match.index || 0,
                message: `Function missing return type: ${match[0].trim()}`,
                severity: 'info',
                type: 'missing_type',
              });
            });
          });
        });
      } catch (error) {
        console.warn(`⚠️ Could not read file: ${file}`);
      }
    }

    const missingTypeIssues = result.issues.filter(issue => issue.type === 'missing_type');
    result.issuesByType.missing_type = missingTypeIssues.length;
    
    console.log(`   Found ${missingTypeIssues.length} functions with missing return types\n`);
  }

  // Generate summary
  private generateSummary(result: ValidationResult): void {
    result.totalIssues = result.issues.length;
    result.filesWithIssues = new Set(result.issues.map(issue => issue.file)).size;

    console.log('📊 Type Safety Validation Summary');
    console.log('================================\n');

    console.log(`📁 Total files scanned: ${result.totalFiles}`);
    console.log(`📄 Files with issues: ${result.filesWithIssues}`);
    console.log(`🚨 Total issues found: ${result.totalIssues}\n`);

    console.log('Issues by type:');
    Object.entries(result.issuesByType).forEach(([type, count]) => {
      const emoji = this.getEmojiForType(type);
      console.log(`   ${emoji} ${type.replace('_', ' ')}: ${count}`);
    });

    console.log('\n🎯 Type Safety Score:');
    const score = Math.max(0, 100 - (result.totalIssues * 2));
    console.log(`   ${score}% (${this.getScoreEmoji(score)})`);

    if (result.totalIssues > 0) {
      console.log('\n🔧 Recommendations:');
      
      if (result.issuesByType.any_type > 0) {
        console.log('   • Replace any types with specific interfaces');
      }
      
      if (result.issuesByType.type_error > 0) {
        console.log('   • Fix TypeScript compilation errors');
      }
      
      if (result.issuesByType.type_assertion > 0) {
        console.log('   • Review type assertions for safety');
      }
      
      if (result.issuesByType.missing_type > 0) {
        console.log('   • Add explicit return types to functions');
      }
    }

    // Show top issues
    if (result.issues.length > 0) {
      console.log('\n🔍 Top Issues:');
      const topIssues = result.issues
        .filter(issue => issue.severity === 'error' || issue.type === 'any_type')
        .slice(0, 10);

      topIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.file}:${issue.line} - ${issue.message}`);
      });

      if (result.issues.length > 10) {
        console.log(`   ... and ${result.issues.length - 10} more issues`);
      }
    }

    console.log('\n✨ Type safety validation complete!');
  }

  private getEmojiForType(type: string): string {
    const emojis: Record<string, string> = {
      any_type: '⚠️',
      type_error: '❌',
      type_assertion: '🎭',
      missing_type: '📤',
    };
    return emojis[type] || '🔍';
  }

  private getScoreEmoji(score: number): string {
    if (score >= 90) return '🏆';
    if (score >= 80) return '🥇';
    if (score >= 70) return '🥈';
    if (score >= 60) return '🥉';
    return '🔧';
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new TypeSafetyValidator();
  validator.validate().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

export { TypeSafetyValidator };