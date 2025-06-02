import * as monaco from "monaco-editor";

export interface SnippetDefinition {
  label: string;
  insertText: string;
  documentation?: string;
  filterText?: string;
  sortText?: string;
  preselect?: boolean;
  kind?: monaco.languages.CompletionItemKind;
  insertTextRules?: monaco.languages.CompletionItemInsertTextRule;
}

export default class SnippetRegistry {
  // ------------------- Java -------------------
  private static readonly javaSnippets: SnippetDefinition[] = [
    // Public static void main (psvm)
    {
      label: "psvm",
      filterText: "psvm",
      insertText: "public static void main(String[] args) {\n    $0\n}",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "Main method",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    },
    // Scanner for input
    {
      label: "Scanner",
      filterText: "scanner",
      insertText: "Scanner scanner = new Scanner(System.in);",
      kind: monaco.languages.CompletionItemKind.Class,
      documentation: "java.util.Scanner instance for console input",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0001",
    },
    {
      label: "if-else",
      insertText: "if (${1:condition}) {\n    $0\n} else {\n\n}",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "Basic if-else statement",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    },
    {
      label: "System.out.println (custom)",
      filterText: "sysout custom",
      insertText: "System.out.println($1);",
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: "Prints a line to standard output (custom snippet)",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    },
  ];

  // ------------------- Python -------------------
  private static readonly pythonSnippets: SnippetDefinition[] = [
    {
      label: "print",
      insertText: "print($1)",
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: "print(value, ...) — Built-in output function",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    },
    {
      label: "for",
      insertText: "for ${1:var} in range(${2:10}):\n    $0",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "Basic for loop over range",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    },
    {
      label: "def",
      insertText: "def ${1:function_name}(${2:params}):\n    $0",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "Function definition",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    },
    {
      label: "if __name__ == '__main__'",
      filterText: "main",
      insertText: "if __name__ == '__main__':\n    $0",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "Main guard idiom",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    },
    {
      label: "input",
      insertText: "input()",
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: "input(prompt) — Read a line from input",
    },
  ];

  static getSnippets(language: "java" | "python"): SnippetDefinition[] {
    return language === "java" ? this.javaSnippets : this.pythonSnippets;
  }

  static toCompletionItems(
    language: "java" | "python",
    range: monaco.IRange
  ): monaco.languages.CompletionItem[] {
    return this.getSnippets(language).map((def) => ({
      range,
      kind: def.kind ?? monaco.languages.CompletionItemKind.Snippet,
      insertTextRules:
        def.insertTextRules ??
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      ...def,
    }));
  }
} 