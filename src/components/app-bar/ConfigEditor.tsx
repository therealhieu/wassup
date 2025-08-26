"use client";

import { useEffect, useRef, useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useMonaco } from "@/providers/MonacoProvider";
import { baseLogger } from "@/lib/logger";

const logger = baseLogger.getSubLogger({
	name: "ConfigEditor",
});

export interface ConfigEditorProps {
	value: string;
	onChange?: (v: string) => void;
}

export function ConfigEditor({ value, onChange }: ConfigEditorProps) {
	const editorRef = useRef<HTMLDivElement>(null);
	const monacoRef = useRef<
		import("monaco-editor").editor.IStandaloneCodeEditor | null
	>(null);
	const valueRef = useRef(value); // track last external value
	const { monaco, isLoaded, error } = useMonaco();

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
		if (!monaco || !isLoaded || !editorRef.current) return;

		// Dispose existing editor if it exists
		if (monacoRef.current) {
			monacoRef.current.dispose();
			monacoRef.current = null;
		}

		// Wait a bit to ensure YAML language service is registered
		const timer = setTimeout(() => {
			if (!editorRef.current) return;

			// Try to trigger language feature registration
			const languages = monaco.languages.getLanguages();
			const yamlLang = languages.find((l) => l.id === "yaml");
			if (yamlLang) {
				logger.info("YAML language registered:", yamlLang);
			}

			// Create Monaco editor when Monaco is available
			const uri = monaco.Uri.parse("inmemory://app-config.yaml");
			let model = monaco.editor.getModel(uri);
			if (!model) {
				model = monaco.editor.createModel(value, "yaml", uri);
			}
			// Don't modify existing models - they should maintain their content

			const editor = monaco.editor.create(editorRef.current, {
				model,
				automaticLayout: true,
				minimap: { enabled: true },
				wordWrap: "on",
				fontSize: 14,
				tabSize: 2,
				insertSpaces: true,
				detectIndentation: false,
				quickSuggestions: {
					other: true,
					comments: true,
					strings: true,
				},
				suggestOnTriggerCharacters: true,
				acceptSuggestionOnEnter: "on",
				tabCompletion: "on",
				parameterHints: {
					enabled: true,
				},
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
		}, 100); // Small delay to ensure YAML service is ready

		return () => {
			clearTimeout(timer);
			if (monacoRef.current) {
				monacoRef.current.dispose();
				monacoRef.current = null;
				debouncedOnChange.flush();
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [monaco, isLoaded, handleChange]); // Re-run when Monaco becomes available

	useEffect(() => {
		if (value !== valueRef.current && monacoRef.current) {
			valueRef.current = value;
			monacoRef.current.getModel()?.setValue(value);
		}
	}, [value]);

	if (!isLoaded) {
		return (
			<Box
				style={{
					height: 700,
					border: "1px solid #ccc",
					borderRadius: 4,
				}}
				display="flex"
				alignItems="center"
				justifyContent="center"
				flexDirection="column"
				gap={2}
			>
				<CircularProgress />
				<Typography variant="body2" color="text.secondary">
					Loading Monaco Editor...
				</Typography>
			</Box>
		);
	}

	if (error) {
		return (
			<Box
				style={{
					height: 700,
					border: "1px solid #ccc",
					borderRadius: 4,
				}}
				display="flex"
				alignItems="center"
				justifyContent="center"
				flexDirection="column"
				gap={2}
			>
				<Typography variant="body1" color="error">
					{error}
				</Typography>
				<Typography variant="body2" color="text.secondary">
					Try refreshing the page. If the issue persists, check
					browser console for errors.
				</Typography>
			</Box>
		);
	}

	return (
		<Box
			style={{ height: 700, border: "1px solid #ccc", borderRadius: 4 }}
			data-testid="config-editor"
		>
			<div ref={editorRef} style={{ height: "100%" }} />
		</Box>
	);
}
