import React, { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { java } from "@codemirror/lang-java";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { autocompletion } from "@codemirror/autocomplete";

interface CodeEditorProps {
    value: string;
    onChange: (code: string) => void;
    language: "JAVA" | "PYTHON";
}

export default function CodeEditor({ value, onChange, language }: CodeEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    useEffect(() => {
        if (!editorRef.current) return;

        // Destroy old view if exists
        if (viewRef.current) {
            viewRef.current.destroy();
        }

        const languageExtension = language === "JAVA" ? java() : python();

        // Create new editor view
        viewRef.current = new EditorView({
            parent: editorRef.current,
            doc: value,
            extensions: [
                basicSetup,
                languageExtension,
                oneDark,
                autocompletion(),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        const newValue = update.state.doc.toString();
                        onChange(newValue);
                    }
                }),
            ],
        });

        return () => {
            viewRef.current?.destroy();
            viewRef.current = null;
        };
    }, [language]);

    return (
        <div
            ref={editorRef}
            style={{
                height: "400px",
                borderRadius: "0.5rem",
                overflow: "hidden",
                border: "1px solid #ccc",
                backgroundColor: "#1e1e1e",
            }}
        />
    );
}
