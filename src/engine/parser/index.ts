/**
 * React Component Parser using ts-morph
 * Extracts metrics from .tsx files without AST scoring
 */

import { Project, SyntaxKind } from 'ts-morph';
import type { ComponentMetrics } from '@/src/types';

export class ReactParser {
  /**
   * Parse a .tsx file and extract component metrics
   */
  static parse(fileName: string, fileContent: string): ComponentMetrics {
    // Create a temporary project for parsing
    const project = new Project({
      useInMemoryFileSystem: true,
    });

    // Add the file to the project
    const sourceFile = project.createSourceFile(fileName, fileContent);

    // Extract all metrics
    const componentName = this.extractComponentName(sourceFile);
    const linesOfCode = this.extractLinesOfCode(sourceFile);
    const totalLines = fileContent.split('\n').length;
    const numberOfProps = this.extractNumberOfProps(sourceFile);
    const numberOfHooks = this.extractNumberOfHooks(sourceFile);
    const numberOfUseEffects = this.extractNumberOfUseEffects(sourceFile);
    const numberOfFunctions = this.extractNumberOfFunctions(sourceFile);
    const jsxNestingDepth = this.extractJsxNestingDepth(sourceFile);
    const hookNames = this.extractHookNames(sourceFile);

    return {
      componentName,
      fileName,
      linesOfCode,
      totalLines,
      numberOfProps,
      numberOfHooks,
      numberOfUseEffects,
      numberOfFunctions,
      jsxNestingDepth,
      hookNames,
      analyzedAt: new Date(),
    };
  }

  /**
   * Find the component's underlying function node - the default export if
   * present, otherwise the first exported function declaration or exported
   * const arrow/function-expression assignment.
   */
  private static getComponentFunctionNode(sourceFile: any): any {
    const defaultExportSymbol = sourceFile.getDefaultExportSymbol();
    const defaultDeclaration = defaultExportSymbol?.getDeclarations?.()[0];
    if (defaultDeclaration) {
      return defaultDeclaration;
    }

    const functions = sourceFile.getFunctions();
    const exportedFn = functions.find((fn: any) => fn.isExported());
    if (exportedFn) {
      return exportedFn;
    }

    const variables = sourceFile.getVariableDeclarations();
    for (const variable of variables) {
      const statement = variable.getVariableStatement?.();
      if (statement?.isExported?.()) {
        const initializer = variable.getInitializer?.();
        const kind = initializer?.getKind?.();
        if (kind === SyntaxKind.ArrowFunction || kind === SyntaxKind.FunctionExpression) {
          return initializer;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract component name - looks for the default export, then any named
   * exported function/const component
   */
  private static extractComponentName(sourceFile: any): string {
    // Find default export
    const defaultExport = sourceFile.getDefaultExportSymbol();
    if (defaultExport?.getName() && defaultExport.getName() !== 'default') {
      return defaultExport.getName();
    }

    // Find exported function declaration (default or named)
    const functions = sourceFile.getFunctions();
    const exportedFn = functions.find((fn: any) => fn.isExported());
    if (exportedFn) {
      return exportedFn.getName() || 'Unknown';
    }

    // Find exported variable declaration (e.g. `export const Foo = () => {}`)
    const variables = sourceFile.getVariableDeclarations();
    for (const variable of variables) {
      const statement = variable.getVariableStatement?.();
      if (statement?.isExported?.()) {
        const initializer = variable.getInitializer?.();
        const kind = initializer?.getKind?.();
        if (kind === SyntaxKind.ArrowFunction || kind === SyntaxKind.FunctionExpression) {
          return variable.getName();
        }
      }
    }

    return 'Unknown';
  }

  /**
   * Count actual lines of code (excluding blank lines and comments)
   */
  private static extractLinesOfCode(sourceFile: any): number {
    const lines = sourceFile.getFullText().split('\n');
    let codeLines = 0;
    let inBlockComment = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.length === 0) {
        continue;
      }

      if (inBlockComment) {
        const closeIdx = line.indexOf('*/');
        if (closeIdx !== -1) {
          inBlockComment = false;
          const after = line.slice(closeIdx + 2).trim();
          if (after.length > 0 && !after.startsWith('//')) {
            codeLines++;
          }
        }
        continue;
      }

      if (line.startsWith('//')) {
        continue;
      }

      if (line.startsWith('/*')) {
        if (!line.includes('*/')) {
          inBlockComment = true;
        }
        continue;
      }

      codeLines++;
    }

    return codeLines;
  }

  /**
   * Count number of props interface/type
   */
  private static extractNumberOfProps(sourceFile: any): number {
    // Look for Props interface
    const interfaces = sourceFile.getInterfaces();
    for (const iface of interfaces) {
      const name = iface.getName();
      if (name.includes('Props') || name === 'Props') {
        const properties = iface.getProperties();
        return properties.length;
      }
    }

    // Look for Props type
    const types = sourceFile.getTypeAliases();
    for (const type of types) {
      const name = type.getName();
      if (name.includes('Props') || name === 'Props') {
        const type_obj = type.getType();
        if (type_obj.isObject?.()) {
          const properties = type_obj.getProperties?.();
          return properties?.length || 0;
        }
      }
    }

    // No dedicated Props declaration - inspect the component's own
    // parameter (e.g. inline destructured props typed at the call site)
    const componentFn = this.getComponentFunctionNode(sourceFile);
    const firstParam = componentFn?.getParameters?.()[0];
    if (firstParam) {
      const paramType = firstParam.getType?.();
      if (paramType?.isObject?.()) {
        const properties = paramType.getProperties?.();
        return properties?.length || 0;
      }
    }

    return 0;
  }

  /**
   * Count hooks - looks for useXxx calls
   */
  private static extractNumberOfHooks(sourceFile: any): number {
    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    let count = 0;

    for (const call of calls) {
      const expression = call.getExpression();
      const callName = this.getHookIdentifier(expression.getText());

      // Check if it starts with 'use'
      if (callName && callName.match(/^use[A-Z]/)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Resolve a call expression's text down to the identifier that matters
   * for hook detection, e.g. `React.useState` -> `useState`
   */
  private static getHookIdentifier(callText: string): string {
    return callText.includes('.') ? callText.split('.').pop() || '' : callText;
  }

  /**
   * Count useEffect calls specifically
   */
  private static extractNumberOfUseEffects(sourceFile: any): number {
    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    let count = 0;

    for (const call of calls) {
      const expression = call.getExpression();
      const callName = this.getHookIdentifier(expression.getText());

      if (callName === 'useEffect') {
        count++;
      }
    }

    return count;
  }

  /**
   * Count function declarations and arrow functions
   */
  private static extractNumberOfFunctions(sourceFile: any): number {
    const functions = sourceFile.getFunctions();
    const arrowFunctions = sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction);
    const functionExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.FunctionExpression);

    return functions.length + arrowFunctions.length + functionExpressions.length;
  }

  /**
   * Calculate maximum JSX nesting depth
   */
  private static extractJsxNestingDepth(sourceFile: any): number {
    const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxElement);
    let maxDepth = 0;

    for (const element of jsxElements) {
      let depth = 0;
      let parent = element.getParent();

      // Count how many JSX elements contain this one
      while (parent) {
        if (parent?.getKind?.() === SyntaxKind.JsxElement) {
          depth++;
        }
        parent = parent?.getParent?.();
      }

      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth;
  }

  /**
   * Extract hook names used in the component
   */
  private static extractHookNames(sourceFile: any): string[] {
    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    const hooks = new Set<string>();

    for (const call of calls) {
      const expression = call.getExpression();
      const callName = this.getHookIdentifier(expression.getText());

      // Check if it starts with 'use'
      if (callName && callName.match(/^use[A-Z]/)) {
        hooks.add(callName);
      }
    }

    return Array.from(hooks).sort();
  }
}
