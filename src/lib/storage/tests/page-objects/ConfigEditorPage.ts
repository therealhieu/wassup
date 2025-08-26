import { expect } from 'vitest';
import type { Page } from 'playwright';

export class ConfigEditorPage {
  constructor(private page: Page) {}

  // Config Editor Access
  async getConfigEditor() {
    return this.page.locator('[data-testid="config-editor"]');
  }

  async waitForConfigEditor() {
    const configEditor = this.getConfigEditor();
    await expect(configEditor).toBeVisible();
  }

  // Monaco Editor Interactions
  async getMonacoEditor() {
    // Monaco editor creates a textarea for accessibility
    return this.page.locator('[data-testid="config-editor"] .monaco-editor textarea');
  }

  async setConfigValue(yamlConfig: string): Promise<void> {
    const editor = await this.getMonacoEditor();
    await expect(editor).toBeVisible();
    
    // Clear existing content and set new value
    await editor.click();
    await editor.press('Control+A'); // Select all
    await editor.fill(yamlConfig);
    
    // Wait a bit for debounced onChange to trigger
    await this.page.waitForTimeout(500);
  }

  async getConfigValue(): Promise<string> {
    const editor = await this.getMonacoEditor();
    return await editor.inputValue();
  }

  async appendToConfig(additionalYaml: string): Promise<void> {
    const editor = await this.getMonacoEditor();
    await expect(editor).toBeVisible();
    
    await editor.click();
    await editor.press('Control+End'); // Go to end
    await editor.type(additionalYaml);
    
    // Wait for debounced onChange
    await this.page.waitForTimeout(500);
  }

  // Configuration Templates
  getDefaultWeatherConfig(): string {
    return `
columns: 12
widgets:
  - id: weather-1
    type: weather
    location: Ho Chi Minh City
    columnStart: 1
    columnSpan: 6
    `.trim();
  }

  getExpandedConfig(): string {
    return `
columns: 12
widgets:
  - id: weather-1
    type: weather
    location: Ho Chi Minh City
    columnStart: 1
    columnSpan: 6
  - id: bookmark-1
    type: bookmark
    groups:
      - name: Development
        bookmarks:
          - name: GitHub
            url: https://github.com
          - name: Supabase
            url: https://supabase.io
    columnStart: 7
    columnSpan: 6
    `.trim();
  }

  // Save/Apply Configuration
  async saveConfig(): Promise<void> {
    // The config should auto-save due to debounced onChange
    // This method waits for the save operation to complete
    await this.page.waitForTimeout(1000);
  }

  async waitForConfigChange(): Promise<void> {
    // Wait for debounced onChange to complete
    await this.page.waitForTimeout(500);
  }

  // Editor State Checks
  async isConfigEditorVisible(): Promise<boolean> {
    const editor = await this.getConfigEditor();
    return await editor.isVisible();
  }

  async hasConfigContent(): Promise<boolean> {
    const content = await this.getConfigValue();
    return content.trim().length > 0;
  }

  // Error Handling
  async getEditorErrors() {
    // Look for Monaco editor error decorations
    return this.page.locator('[data-testid="config-editor"] .monaco-editor .squiggly-error');
  }

  async hasConfigErrors(): Promise<boolean> {
    const errors = await this.getEditorErrors();
    return await errors.count() > 0;
  }
}