"use client";

import {
	createContext,
	useContext,
	useEffect,
	useState,
	ReactNode,
} from "react";
// Using schema at runtime from constants; no direct JSON import

interface MonacoContextType {
	monaco: typeof import("monaco-editor") | null;
	isLoaded: boolean;
	error: string | null;
}

const MonacoContext = createContext<MonacoContextType>({
	monaco: null,
	isLoaded: false,
	error: null,
});

export const useMonaco = () => useContext(MonacoContext);

interface MonacoProviderProps {
	children: ReactNode;
}

export function MonacoProvider({ children }: MonacoProviderProps) {
	const [monaco, setMonaco] = useState<typeof import("monaco-editor") | null>(
		null,
	);
	const [isLoaded, setIsLoaded] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		let retryCount = 0;
		const maxRetries = 3;

		const initializeMonaco = async () => {
			while (retryCount < maxRetries && mounted) {
				try {
					// Configure Monaco Environment with pre-bundled workers from public/
					// Turbopack doesn't support `new Worker(new URL(...))`, so we serve
					// pre-bundled workers from the public directory and use a blob URL
					// wrapper to import them, bypassing module MIME type issues.
					if (
						typeof window !== "undefined" &&
						!(window as unknown as { MonacoEnvironment?: unknown })
							.MonacoEnvironment
					) {
						(
							window as unknown as { MonacoEnvironment?: unknown }
						).MonacoEnvironment = {
							getWorker(_: string, label: string) {
								const workerPath =
									label === "yaml"
										? "/monaco-yaml.worker.js"
										: "/monaco-editor.worker.js";
								const workerUrl =
									window.location.origin + workerPath;
								const blob = new Blob(
									[
										`importScripts("${workerUrl}");`,
									],
									{ type: "text/javascript" },
								);
								return new Worker(
									URL.createObjectURL(blob),
								);
							},
						};
					}

					// Add a small delay for the first retry
					if (retryCount > 0) {
						await new Promise((resolve) =>
							setTimeout(resolve, 1000 * retryCount),
						);
					}

					// Dynamic imports with retry logic
					const monacoModule = await import("monaco-editor");
					const monacoYamlModule = await import("monaco-yaml");

					if (!mounted) return;

					const monacoInstance = monacoModule.default || monacoModule;
					const { configureMonacoYaml } = monacoYamlModule;

					// Configure Monaco YAML with schema validation
					const { APP_CONFIG_JSONSCHEMA } = await import(
						"@/lib/constants"
					);
					configureMonacoYaml(monacoInstance, {
						enableSchemaRequest: true,
						validate: true,
						hover: true,
						completion: true,
						format: true,
						isKubernetes: false,
						schemas: [
							{
								uri: "https://wassup.app/schema/app-config.json",
								fileMatch: [
									"**/*.yaml",
									"**/*.yml",
									"inmemory://*.yaml",
									"inmemory://*.yml",
									"inmemory://app-config.yaml",
								],
								schema: APP_CONFIG_JSONSCHEMA as Record<
									string,
									unknown
								>,
							},
						],
						yamlVersion: "1.2",
					});

					// Register widget snippet completions
					const { WIDGET_SNIPPETS } = await import(
						"@/lib/widget-snippets"
					);
					monacoInstance.languages.registerCompletionItemProvider(
						"yaml",
						{
							provideCompletionItems(model, position) {
								const word =
									model.getWordUntilPosition(position);
								const range = {
									startLineNumber: position.lineNumber,
									startColumn: word.startColumn,
									endLineNumber: position.lineNumber,
									endColumn: position.column,
								};
								return {
									suggestions: WIDGET_SNIPPETS.map(
										(snippet) => ({
											label: snippet.label,
											kind: monacoInstance.languages
												.CompletionItemKind.Snippet,
											insertTextRules:
												monacoInstance.languages
													.CompletionItemInsertTextRule
													.InsertAsSnippet,
											insertText: snippet.insertText,
											documentation: snippet.description,
											range,
										}),
									),
								};
							},
						},
					);

					if (!mounted) return;

					setMonaco(monacoInstance);
					setIsLoaded(true);
					setError(null);
					console.log("Monaco Editor initialized successfully");
					return; // Success, exit retry loop
				} catch (err) {
					retryCount++;
					console.error(
						`Failed to initialize Monaco Editor (attempt ${retryCount}):`,
						err,
					);

					if (retryCount >= maxRetries) {
						if (mounted) {
							setError(
								`Failed to load Monaco Editor after ${maxRetries} attempts: ${err instanceof Error ? err.message : String(err)}`,
							);
							setIsLoaded(true); // Still set loaded to show error state
						}
						return;
					}
					// Continue to next retry iteration
				}
			}
		};

		// Add a 100ms delay before starting initialization
		const timeout = setTimeout(() => {
			if (mounted) {
				initializeMonaco();
			}
		}, 100);

		return () => {
			mounted = false;
			clearTimeout(timeout);
		};
	}, []);

	const contextValue: MonacoContextType = {
		monaco,
		isLoaded,
		error,
	};

	return (
		<MonacoContext.Provider value={contextValue}>
			{children}
		</MonacoContext.Provider>
	);
}
