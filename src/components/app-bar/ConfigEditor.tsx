"use client";

import { useEffect, useRef, useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";
import { configureMonacoYaml, JSONSchema } from "monaco-yaml";
import * as monaco from "monaco-editor";
import { APP_CONFIG_JSONSCHEMA } from "@/lib/constants";
import { Box } from "@mui/material";

configureMonacoYaml(monaco, {
	enableSchemaRequest: true,
	validate: true,
	hover: true,
	completion: true,
	schemas: [
		{
			uri: "app://schemas/app-config.json",
			fileMatch: ["*.yaml", "*.yml"],
			schema: APP_CONFIG_JSONSCHEMA as JSONSchema,
		},
	],
});

if (typeof window !== "undefined") {
	window.MonacoEnvironment = {
		getWorker(_, label) {
			switch (label) {
				case "yaml":
					return new Worker(
						new URL("monaco-yaml/yaml.worker", import.meta.url),
					);
				default:
					return new Worker(
						new URL(
							"monaco-editor/esm/vs/editor/editor.worker",
							import.meta.url,
						),
					);
			}
		},
	};
}

export interface ConfigEditorProps {
	value: string;
	onChange?: (v: string) => void;
}

export function ConfigEditor({ value, onChange }: ConfigEditorProps) {
	const editorRef = useRef<HTMLDivElement>(null);
	const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
	const valueRef = useRef(value); // track last external value

	const debouncedOnChange = useDebouncedCallback(
		(newValue: string) => {
			if (onChange && newValue !== valueRef.current) {
				valueRef.current = newValue;
				onChange(newValue);
			}
		},
		300, // 300ms delay
	);

	const handleChange = useCallback(() => {
		const newVal = monacoRef.current?.getValue();
		if (newVal !== undefined) {
			debouncedOnChange(newVal);
		}
	}, [debouncedOnChange]);

	useEffect(() => {
		if (!editorRef.current) return;

		const uri = monaco.Uri.parse("inmemory://model.yaml");
		const model =
			monaco.editor.getModel(uri) ||
			monaco.editor.createModel(value, "yaml", uri);

		const editor = monaco.editor.create(editorRef.current, {
			model,
			automaticLayout: true,
			minimap: { enabled: true },
			wordWrap: "on",
			quickSuggestions: {
				other: true,
				comments: true,
				strings: true,
			},
			suggestOnTriggerCharacters: true,
			acceptSuggestionOnEnter: "on",
			tabCompletion: "on",
			suggest: {
				showWords: true,
				showProperties: true,
				showValues: true,
				preview: true,
				previewMode: "prefix",
				insertMode: "insert",
				snippetsPreventQuickSuggestions: false,
			},
		});

		editor.onDidChangeModelContent(handleChange);
		monacoRef.current = editor;

		return () => {
			// Clean up editor and debounced onChange when component unmounts
			editor.dispose();
			debouncedOnChange.flush();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (value !== valueRef.current && monacoRef.current) {
			valueRef.current = value;
			monacoRef.current.getModel()?.setValue(value);
		}
	}, [value]);

	return (
		<Box style={{ height: 700, border: "1px solid #ccc", borderRadius: 4 }}>
			<div ref={editorRef} style={{ height: "100%" }} />
		</Box>
	);
}
