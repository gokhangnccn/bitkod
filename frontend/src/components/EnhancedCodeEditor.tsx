import React, { useCallback } from "react";
import Editor from "@monaco-editor/react";
import SnippetRegistry from "../utils/SnippetRegistry";
import type * as Monaco from "monaco-editor";

interface EnhancedCodeEditorProps {
  value: string;
  onChange: (code: string) => void;
  language: "JAVA" | "PYTHON";
}

declare global {
  interface Window {
    __bitcodeCompletionProviders?: {
      java?: Monaco.IDisposable;
      python?: Monaco.IDisposable;
    };
  }
}

const globalProviders = (typeof window !== 'undefined' ? window : (globalThis as any)) as Window;

  if (!globalProviders.__bitcodeCompletionProviders) {
    globalProviders.__bitcodeCompletionProviders = {};
  }

let javaProviderDisposable: Monaco.IDisposable | null = globalProviders.__bitcodeCompletionProviders.java ?? null;
let pythonProviderDisposable: Monaco.IDisposable | null = globalProviders.__bitcodeCompletionProviders.python ?? null;

function registerCompletionProviders(monaco: typeof import('monaco-editor')) {
  if (pythonProviderDisposable) {
    pythonProviderDisposable.dispose();
  }

  pythonProviderDisposable = monaco.languages.registerCompletionItemProvider("python", {
    triggerCharacters: [".", "("],

    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const lineContent = model.getLineContent(position.lineNumber);
      const textBeforeCursor = lineContent.substring(0, position.column - 1);

      const suggestions = [...SnippetRegistry.toCompletionItems("python", range)];

      // Add Python keywords
      const pythonKeywords = [
        'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'if', 'else', 'elif',
        'for', 'while', 'break', 'continue', 'def', 'return', 'class', 'import', 'from',
        'as', 'try', 'except', 'finally', 'with', 'lambda', 'global', 'nonlocal', 'pass'
      ];

      pythonKeywords.forEach(keyword => {
        if (keyword.toLowerCase().includes(word.word.toLowerCase())) {
          suggestions.push({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range: range,
            sortText: "0000" + keyword,
          });
        }
      });

      if (textBeforeCursor.includes('.')) {
        const stringMethods = ['split', 'join', 'strip', 'replace', 'upper', 'lower', 'find', 'count', 'startswith', 'endswith'];
        stringMethods.forEach(method => {
          suggestions.push({
            label: method,
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: method + '($1)',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            documentation: `String method: ${method}`,
            sortText: "0100" + method,
          });
        });

        // List methods
        const listMethods = ['append', 'extend', 'insert', 'remove', 'pop', 'index', 'count', 'sort', 'reverse'];
        listMethods.forEach(method => {
          suggestions.push({
            label: method,
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: method + '($1)',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            documentation: `List method: ${method}`,
            sortText: "0101" + method,
          });
        });
      }

      return { suggestions };
    },
  });

  globalProviders.__bitcodeCompletionProviders!.python = pythonProviderDisposable;

  if (javaProviderDisposable) {
    javaProviderDisposable.dispose();
  }

  javaProviderDisposable = monaco.languages.registerCompletionItemProvider("java", {
    triggerCharacters: [".", "("],

    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const lineContent = model.getLineContent(position.lineNumber);
      const textBeforeCursor = lineContent.substring(0, position.column - 1);

      const suggestions = [...SnippetRegistry.toCompletionItems("java", range)];

      // Java keywords
      const javaKeywords = [
        'public', 'private', 'protected', 'static', 'final', 'abstract', 'class', 'interface',
        'extends', 'implements', 'import', 'package', 'void', 'int', 'double', 'float', 'long',
        'short', 'byte', 'char', 'boolean', 'String', 'true', 'false', 'null', 'new', 'this',
        'super', 'return', 'break', 'continue', 'if', 'else', 'switch', 'case', 'default',
        'for', 'while', 'do', 'try', 'catch', 'finally', 'throw', 'throws', 'synchronized'
      ];

      javaKeywords.forEach(keyword => {
        if (keyword.toLowerCase().includes(word.word.toLowerCase())) {
          suggestions.push({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range: range,
            sortText: "0000" + keyword,
          });
        }
      });

      if (textBeforeCursor.includes('.')) {
        const stringMethods = ['length', 'charAt', 'substring', 'indexOf', 'split', 'trim', 'toLowerCase', 'toUpperCase', 'equals', 'contains'];
        stringMethods.forEach(method => {
          suggestions.push({
            label: method,
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: method + '($1)',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            documentation: `String method: ${method}`,
            sortText: "0100" + method,
          });
        });

        const arrayMethods = ['length'];
        arrayMethods.forEach(method => {
          suggestions.push({
            label: method,
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: method,
            range: range,
            documentation: `Array property: ${method}`,
            sortText: "0101" + method,
          });
        });

        if (textBeforeCursor.toLowerCase().includes('scanner')) {
          const scannerMethods = ['nextInt', 'nextLine', 'next', 'nextDouble', 'nextFloat', 'nextBoolean', 'hasNext', 'hasNextInt', 'close'];
          scannerMethods.forEach(method => {
            suggestions.push({
              label: method,
              kind: monaco.languages.CompletionItemKind.Method,
              insertText: method + '()',
              range: range,
              documentation: `Scanner method: ${method}`,
              sortText: "0102" + method,
            });
          });
        }
      }

      return { suggestions };
    },
  });

  globalProviders.__bitcodeCompletionProviders!.java = javaProviderDisposable;
}

function validatePython(model: Monaco.editor.ITextModel, monaco: typeof import('monaco-editor')) {
  const value = model.getValue();
  const markers: Monaco.editor.IMarkerData[] = [];

  const printRegex = /\bprnt\s*\(/g;
  let match: RegExpExecArray | null;
  while ((match = printRegex.exec(value))) {
    const start = model.getPositionAt(match.index);
    const end = model.getPositionAt(match.index + match[0].length);
    markers.push({
      severity: monaco.MarkerSeverity.Error,
      message: "Undefined function 'prnt'. Did you mean 'print'?",
      startLineNumber: start.lineNumber,
      startColumn: start.column,
      endLineNumber: end.lineNumber,
      endColumn: end.column,
    });
  }

  const lines = value.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed && (trimmed.endsWith(':') || trimmed.startsWith('if ') || trimmed.startsWith('for ') ||
        trimmed.startsWith('while ') || trimmed.startsWith('def ') || trimmed.startsWith('class '))) {
      // Check if next line is properly indented
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (nextLine.trim() && !nextLine.startsWith('    ') && !nextLine.startsWith('\t')) {
          markers.push({
            severity: monaco.MarkerSeverity.Warning,
            message: "Expected an indented block",
            startLineNumber: i + 2,
            startColumn: 1,
            endLineNumber: i + 2,
            endColumn: nextLine.length + 1,
          });
        }
      }
    }
  }

  monaco.editor.setModelMarkers(model, "python-owner", markers);
}

function validateJava(model: Monaco.editor.ITextModel, monaco: typeof import('monaco-editor')) {
  const value = model.getValue();
  const markers: Monaco.editor.IMarkerData[] = [];

  const lines = value.split(/\n/);
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("//") && !trimmed.startsWith("/*") &&
        !["{", "}", ":", "*/"].some((s) => trimmed.endsWith(s))) {
      const isControl = /(if|for|while|else|switch|try|catch|finally|do)(\s|\().*/.test(trimmed);
      const isDeclaration = /(public|private|protected|static|final|abstract|class|interface|import|package)(\s)+.*/.test(trimmed);

      if (!isControl && !isDeclaration && !trimmed.endsWith(";") && !trimmed.endsWith("{")) {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message: "Possible missing ';' at end of statement",
          startLineNumber: idx + 1,
          startColumn: trimmed.length,
          endLineNumber: idx + 1,
          endColumn: trimmed.length + 1,
        });
      }
    }
  });

  const commonMistakes = [
    { regex: /\bSystem\.out\.print\s*\(/g, message: "Did you mean 'System.out.println'?" },
    { regex: /\bString\s+\w+\s*=\s*new\s+String\s*\(/g, message: "String literals don't need 'new String()'" },
  ];

  commonMistakes.forEach(mistake => {
    let match: RegExpExecArray | null;
    while ((match = mistake.regex.exec(value))) {
      const start = model.getPositionAt(match.index);
      const end = model.getPositionAt(match.index + match[0].length);
      markers.push({
        severity: monaco.MarkerSeverity.Info,
        message: mistake.message,
        startLineNumber: start.lineNumber,
        startColumn: start.column,
        endLineNumber: end.lineNumber,
        endColumn: end.column,
      });
    }
  });

  monaco.editor.setModelMarkers(model, "java-owner", markers);
}

export default function EnhancedCodeEditor({ value, onChange, language }: EnhancedCodeEditorProps) {
  const handleEditorDidMount = useCallback((editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
    registerCompletionProviders(monaco);

    const model = editor.getModel();
    if (!model) return;

    language === 'PYTHON' ? validatePython(model, monaco) : validateJava(model, monaco);

    const disposable = model.onDidChangeContent(() => {
      language === 'PYTHON' ? validatePython(model, monaco) : validateJava(model, monaco);
    });

    let suggestionTimeout: NodeJS.Timeout;
    const contentChangeDisposable = model.onDidChangeContent(() => {
      if (suggestionTimeout) {
        clearTimeout(suggestionTimeout);
      }

      // Set new timeout for 2 seconds
      suggestionTimeout = setTimeout(() => {
        try {
          editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
        } catch (e) {
        }
      }, 2000);
    });

    // Handle bracket completion
    const commandDisposable = editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space,
        () => {
          editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
        }
    );

    return () => {
      disposable.dispose();
      contentChangeDisposable?.dispose();
      if (suggestionTimeout) {
        clearTimeout(suggestionTimeout);
      }
      try {
        (commandDisposable as any)?.dispose?.();
      } catch (e) {
      }
    };
  }, [language]);

  return (
      <Editor
          height="400px"
          language={language === 'PYTHON' ? 'python' : 'java'}
          key={language}
          theme="vs-dark"
          value={value}
          onChange={(val) => onChange(val ?? '')}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,

            snippetSuggestions: 'top',
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true
            },
            quickSuggestionsDelay: 2000,
            suggestOnTriggerCharacters: false,
            acceptSuggestionOnCommitCharacter: true,
            acceptSuggestionOnEnter: 'smart',
            tabCompletion: 'on',
            wordBasedSuggestions: 'currentDocument',
            suggest: {
              filterGraceful: true,
              snippetsPreventQuickSuggestions: false,
              localityBonus: true,
              shareSuggestSelections: true,
              showIcons: true,
              showStatusBar: true,
              preview: true,
              previewMode: 'subwordSmart',
            },

            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoSurround: 'languageDefined',

            formatOnPaste: true,
            formatOnType: true,
            autoIndent: 'full',

            smoothScrolling: true,
            cursorSmoothCaretAnimation: 'on',

            matchBrackets: 'always',

            wordWrap: 'on',
            wordWrapColumn: 120,

            mouseWheelZoom: true,

            parameterHints: {
              enabled: true,
              cycle: true
            },

            hover: {
              enabled: true,
              delay: 300,
              sticky: false
            },

            find: {
              autoFindInSelection: 'never',
              seedSearchStringFromSelection: 'always'
            }
          }}
      />
  );
}