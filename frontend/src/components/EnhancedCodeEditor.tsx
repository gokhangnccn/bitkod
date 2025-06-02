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

// Keep track of active completion providers to avoid duplicates during HMR / remounts
if (!globalProviders.__bitcodeCompletionProviders) {
  globalProviders.__bitcodeCompletionProviders = {};
}

let javaProviderDisposable: Monaco.IDisposable | null = globalProviders.__bitcodeCompletionProviders.java ?? null;
let pythonProviderDisposable: Monaco.IDisposable | null = globalProviders.__bitcodeCompletionProviders.python ?? null;

function registerCompletionProviders(monaco: typeof import('monaco-editor')) {
  // --- PYTHON ---
  if (pythonProviderDisposable) {
    pythonProviderDisposable.dispose();
  }
  pythonProviderDisposable = monaco.languages.registerCompletionItemProvider("python", {
    triggerCharacters: [".", "(", ..."abcdefghijklmnopqrstuvwxyz"],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      return { suggestions: SnippetRegistry.toCompletionItems("python", range) };
    },
  });

  // store globally
  globalProviders.__bitcodeCompletionProviders!.python = pythonProviderDisposable;

  // --- JAVA ---
  if (javaProviderDisposable) {
    javaProviderDisposable.dispose();
  }
  javaProviderDisposable = monaco.languages.registerCompletionItemProvider("java", {
    triggerCharacters: [".", "(", ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      return { suggestions: SnippetRegistry.toCompletionItems("java", range) };
    },
  });

  // store globally
  globalProviders.__bitcodeCompletionProviders!.java = javaProviderDisposable;
}

// Simple validation functions
function validatePython(model: Monaco.editor.ITextModel, monaco: typeof import('monaco-editor')) {
  const value = model.getValue();
  const markers: Monaco.editor.IMarkerData[] = [];

  // Detect common misspellings of print (e.g., prnt)
  const regex = /\bprnt\s*\(/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(value))) {
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

  monaco.editor.setModelMarkers(model, "python-owner", markers);
}

function validateJava(model: Monaco.editor.ITextModel, monaco: typeof import('monaco-editor')) {
  const value = model.getValue();
  const markers: Monaco.editor.IMarkerData[] = [];

  // Basic detection: missing semicolon at end of line
  const lines = value.split(/\n/);
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("//") &&
        !["{", "}", ":"].some((s) => trimmed.endsWith(s))) {
      const isControl = /(if|for|while|else|switch|try|catch|finally)(\s|\().*/.test(trimmed);
      if (!isControl && !trimmed.endsWith(";")) {
        // Mark as warning (not error)
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

  monaco.editor.setModelMarkers(model, "java-owner", markers);
}

export default function EnhancedCodeEditor({ value, onChange, language }: EnhancedCodeEditorProps) {
  const handleEditorDidMount = useCallback((editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
    // Register (or refresh) completion providers once Monaco is available.
    registerCompletionProviders(monaco);

    const model = editor.getModel();
    if (!model) return;
    language === 'PYTHON' ? validatePython(model, monaco) : validateJava(model, monaco);

    const disposable = model.onDidChangeContent(() => {
      language === 'PYTHON' ? validatePython(model, monaco) : validateJava(model, monaco);
    });

    const typeListener = (editor as any).onDidType?.(() =>
      editor.trigger('keyboard', 'editor.action.triggerSuggest', {}),
    );

    return () => {
      disposable.dispose();
      typeListener?.dispose();
    };
  }, []);

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
        quickSuggestions: { other: true, comments: false, strings: false },
      }}
    />
  );
} 