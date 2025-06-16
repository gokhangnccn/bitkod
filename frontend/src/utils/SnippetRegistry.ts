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
      sortText: "0001",
    },
    // Scanner for input
    {
      label: "Scanner",
      filterText: "scanner",
      insertText: "Scanner scanner = new Scanner(System.in);",
      kind: monaco.languages.CompletionItemKind.Class,
      documentation: "java.util.Scanner instance for console input",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0002",
    },
    // System.out.println variations
    {
      label: "sout",
      filterText: "sout System.out.println",
      insertText: "System.out.println($1);",
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: "Print to console",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0003",
    },
    {
      label: "System.out.println",
      filterText: "System.out.println sysout",
      insertText: "System.out.println($1);",
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: "Print to console with newline",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0004",
    },
    {
      label: "System.out.print",
      filterText: "System.out.print",
      insertText: "System.out.print($1);",
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: "Print to console without newline",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0005",
    },
    // Control structures
    {
      label: "if",
      filterText: "if",
      insertText: "if (${1:condition}) {\n    $0\n}",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "If statement",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0010",
    },
    {
      label: "if-else",
      filterText: "if else",
      insertText: "if (${1:condition}) {\n    $2\n} else {\n    $0\n}",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "If-else statement",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0011",
    },
    {
      label: "else if",
      filterText: "else if elif",
      insertText: "else if (${1:condition}) {\n    $0\n}",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "Else if statement",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0012",
    },
    // Loops
    {
      label: "for",
      filterText: "for loop",
      insertText: "for (int ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n    $0\n}",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "For loop",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0020",
    },
    {
      label: "fori",
      filterText: "fori for loop",
      insertText: "for (int ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n    $0\n}",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "For loop with index",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0021",
    },
    {
      label: "foreach",
      filterText: "foreach enhanced for",
      insertText: "for (${1:Type} ${2:item} : ${3:collection}) {\n    $0\n}",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "Enhanced for loop",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0022",
    },
    {
      label: "while",
      filterText: "while loop",
      insertText: "while (${1:condition}) {\n    $0\n}",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "While loop",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0023",
    },
    {
      label: "do-while",
      filterText: "do while loop",
      insertText: "do {\n    $0\n} while (${1:condition});",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "Do-while loop",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0024",
    },
    // Scanner methods
    {
      label: "nextInt",
      filterText: "nextInt scanner.nextInt",
      insertText: "scanner.nextInt()",
      kind: monaco.languages.CompletionItemKind.Method,
      documentation: "Read next integer from scanner",
      sortText: "0030",
    },
    {
      label: "nextLine",
      filterText: "nextLine scanner.nextLine",
      insertText: "scanner.nextLine()",
      kind: monaco.languages.CompletionItemKind.Method,
      documentation: "Read next line from scanner",
      sortText: "0031",
    },
    {
      label: "next",
      filterText: "next scanner.next",
      insertText: "scanner.next()",
      kind: monaco.languages.CompletionItemKind.Method,
      documentation: "Read next token from scanner",
      sortText: "0032",
    },
    {
      label: "nextDouble",
      filterText: "nextDouble scanner.nextDouble",
      insertText: "scanner.nextDouble()",
      kind: monaco.languages.CompletionItemKind.Method,
      documentation: "Read next double from scanner",
      sortText: "0033",
    },
    // Try-catch
    {
      label: "try-catch",
      filterText: "try catch exception",
      insertText: "try {\n    $1\n} catch (${2:Exception} ${3:e}) {\n    $0\n}",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "Try-catch block",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0040",
    },
    // Array
    {
      label: "array",
      filterText: "array new",
      insertText: "${1:int}[] ${2:arr} = new ${1:int}[${3:size}];",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "Array declaration",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0050",
    },
    // Method
    {
      label: "method",
      filterText: "method function",
      insertText: "public ${1:void} ${2:methodName}(${3:params}) {\n    $0\n}",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "Method declaration",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0060",
    },
    // String methods
    {
      label: "length",
      filterText: "length string.length",
      insertText: "length()",
      kind: monaco.languages.CompletionItemKind.Method,
      documentation: "Get string/array length",
      sortText: "0070",
    },
    {
      label: "substring",
      filterText: "substring",
      insertText: "substring(${1:start}, ${2:end})",
      kind: monaco.languages.CompletionItemKind.Method,
      documentation: "Get substring",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0071",
    },
    {
      label: "charAt",
      filterText: "charAt",
      insertText: "charAt(${1:index})",
      kind: monaco.languages.CompletionItemKind.Method,
      documentation: "Get character at index",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0072",
    },
    {
      label: "indexOf",
      filterText: "indexOf",
      insertText: "indexOf(${1:char})",
      kind: monaco.languages.CompletionItemKind.Method,
      documentation: "Find index of character",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0073",
    },
    {
      label: "split",
      filterText: "split",
      insertText: "split(${1:delimiter})",
      kind: monaco.languages.CompletionItemKind.Method,
      documentation: "Split string by delimiter",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0074",
    },
  ];

  // ------------------- Python -------------------
  private static readonly pythonSnippets: SnippetDefinition[] = [
    // Print
    {
      label: "print",
      filterText: "print",
      insertText: "print(${1:value})",
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: "print(value, ...) — Built-in output function",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0001",
    },
    // Input
    {
      label: "input",
      filterText: "input",
      insertText: "input(${1:prompt})",
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: "input(prompt) — Read a line from input",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0002",
    },
    // Control structures
    {
      label: "if",
      filterText: "if",
      insertText: "if ${1:condition}:\n    $0",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "If statement",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0010",
    },
    {
      label: "if-else",
      filterText: "if else",
      insertText: "if ${1:condition}:\n    $2\nelse:\n    $0",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "If-else statement",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0011",
    },
    {
      label: "elif",
      filterText: "elif else if",
      insertText: "elif ${1:condition}:\n    $0",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "Elif statement",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0012",
    },
    // Loops
    {
      label: "for",
      filterText: "for loop",
      insertText: "for ${1:var} in range(${2:10}):\n    $0",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "For loop with range",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0020",
    },
    {
      label: "for-list",
      filterText: "for list iteration",
      insertText: "for ${1:item} in ${2:list}:\n    $0",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "For loop over list",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0021",
    },
    {
      label: "for-enumerate",
      filterText: "for enumerate index",
      insertText: "for ${1:i}, ${2:item} in enumerate(${3:list}):\n    $0",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "For loop with enumerate",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0022",
    },
    {
      label: "while",
      filterText: "while loop",
      insertText: "while ${1:condition}:\n    $0",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "While loop",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0023",
    },
    // Function
    {
      label: "def",
      filterText: "def function",
      insertText: "def ${1:function_name}(${2:params}):\n    $0",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "Function definition",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0030",
    },
    {
      label: "if __name__ == '__main__'",
      filterText: "main",
      insertText: "if __name__ == '__main__':\n    $0",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "Main guard idiom",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0031",
    },
    // Data types
    {
      label: "list",
      filterText: "list",
      insertText: "[${1:elements}]",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "List literal",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0040",
    },
    {
      label: "dict",
      filterText: "dict dictionary",
      insertText: "{${1:key}: ${2:value}}",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "Dictionary literal",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0041",
    },
    {
      label: "tuple",
      filterText: "tuple",
      insertText: "(${1:elements})",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "Tuple literal",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0042",
    },
    // Built-in functions
    {
      label: "len",
      filterText: "len length",
      insertText: "len(${1:obj})",
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: "Get length of object",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0050",
    },
    {
      label: "range",
      filterText: "range",
      insertText: "range(${1:start}, ${2:stop})",
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: "Create range object",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0051",
    },
    {
      label: "int",
      filterText: "int convert",
      insertText: "int(${1:value})",
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: "Convert to integer",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0052",
    },
    {
      label: "str",
      filterText: "str string convert",
      insertText: "str(${1:value})",
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: "Convert to string",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0053",
    },
    {
      label: "float",
      filterText: "float convert",
      insertText: "float(${1:value})",
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: "Convert to float",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0054",
    },
    // String methods
    {
      label: "split",
      filterText: "split",
      insertText: "split(${1:delimiter})",
      kind: monaco.languages.CompletionItemKind.Method,
      documentation: "Split string by delimiter",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0060",
    },
    {
      label: "join",
      filterText: "join",
      insertText: "join(${1:iterable})",
      kind: monaco.languages.CompletionItemKind.Method,
      documentation: "Join iterable with string",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0061",
    },
    {
      label: "strip",
      filterText: "strip",
      insertText: "strip()",
      kind: monaco.languages.CompletionItemKind.Method,
      documentation: "Remove whitespace from both ends",
      sortText: "0062",
    },
    {
      label: "replace",
      filterText: "replace",
      insertText: "replace(${1:old}, ${2:new})",
      kind: monaco.languages.CompletionItemKind.Method,
      documentation: "Replace substring",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0063",
    },
    // List methods
    {
      label: "append",
      filterText: "append",
      insertText: "append(${1:item})",
      kind: monaco.languages.CompletionItemKind.Method,
      documentation: "Add item to end of list",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0070",
    },
    {
      label: "extend",
      filterText: "extend",
      insertText: "extend(${1:iterable})",
      kind: monaco.languages.CompletionItemKind.Method,
      documentation: "Extend list with iterable",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0071",
    },
    {
      label: "insert",
      filterText: "insert",
      insertText: "insert(${1:index}, ${2:item})",
      kind: monaco.languages.CompletionItemKind.Method,
      documentation: "Insert item at index",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0072",
    },
    {
      label: "remove",
      filterText: "remove",
      insertText: "remove(${1:item})",
      kind: monaco.languages.CompletionItemKind.Method,
      documentation: "Remove first occurrence of item",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0073",
    },
    {
      label: "pop",
      filterText: "pop",
      insertText: "pop(${1:index})",
      kind: monaco.languages.CompletionItemKind.Method,
      documentation: "Remove and return item at index",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0074",
    },
    // Try-except
    {
      label: "try-except",
      filterText: "try except exception",
      insertText: "try:\n    $1\nexcept ${2:Exception} as ${3:e}:\n    $0",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "Try-except block",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0080",
    },
    // List comprehension
    {
      label: "list-comp",
      filterText: "list comprehension",
      insertText: "[${1:expr} for ${2:item} in ${3:iterable}]",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "List comprehension",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: "0090",
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