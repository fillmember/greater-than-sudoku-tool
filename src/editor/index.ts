import type { Monaco } from "@monaco-editor/react";
import { conf, language } from "./highlighter";
import { themeData } from "./themeData";
export const id = "yee";
export function configure(monaco: Monaco) {
  monaco.languages.register({ id });
  monaco.languages.setMonarchTokensProvider(id, language);
  monaco.languages.setLanguageConfiguration(id, conf);
  monaco.editor.defineTheme(id, themeData);
  monaco.editor.setTheme(id);
}
