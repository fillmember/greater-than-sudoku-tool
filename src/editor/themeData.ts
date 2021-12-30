import type { editor } from "monaco-editor";

const colors = {
  keyword: "#1084BA",
};

export const themeData: editor.IStandaloneThemeData = {
  base: "vs",
  inherit: true,
  rules: [
    { token: "variable", foreground: "#933333" },
    { token: "operators", foreground: "#80769A" },
    { token: "delimiter.square", foreground: colors.keyword },
    { token: "delimiter.group", foreground: "#777777" },
    { token: "delimiter.array", foreground: colors.keyword },
    { token: "number", foreground: "#333333" },
    { token: "keyword", foreground: colors.keyword },
    { token: "comment", foreground: "#66A066" },
    { token: "delimiter.parenthesis.yee", foreground: colors.keyword },
  ],
  colors: {
    "editorCursor.foreground": "#00F",
    "editor.lineHighlightBackground": "#00CCC015",
  },
};
