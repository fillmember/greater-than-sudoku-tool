import type { languages } from "monaco-editor";

export const conf: languages.LanguageConfiguration = {
  comments: {
    lineComment: "#",
  },
  brackets: [
    ["[", "]"],
    ["(", ")"],
  ],
  autoClosingPairs: [
    { open: "[", close: "]" },
    { open: "(", close: ")" },
  ],
  surroundingPairs: [
    { open: "(", close: ")" },
    { open: "[", close: "]" },
  ],
  // folding: {
  // 	markers: {
  // 		start: new RegExp('^\\s*<!--\\s*#?region\\b.*-->'),
  // 		end: new RegExp('^\\s*<!--\\s*#?endregion\\b.*-->')
  // 	}
  // }
};

export const language: languages.IMonarchLanguage = {
  defaultToken: "invalid",
  operators: ["=", "+", "!", "~"],
  keywords: ["SUM", "SEE", "INTERSECT", "in", "K", "A<B", "A>B", "CMD"],
  // regular expressions
  symbols: /[\=\+\!\~]/,
  name: /[A-Z][1-9]/,
  tokenizer: {
    root: [
      [/\s+/, "whitespace"],
      [/@name\.\d/, "variable.name"],
      [/@name/, "variable.name"],
      [/@symbols/, "operators"],
      [/[()\[\]]/, "@brackets"],
      [/\d+/, "number"],
      [/,/, "delimiter.array"],
      [/-/, "delimiter.group"],
      [/#/, "@rematch", "comment"],
      [
        /[a-zA-Z<>]+/,
        {
          cases: {
            "@keywords": "keyword",
          },
        },
      ],
    ],
    comment: [
      [/#$/, "comment", "@popall"],
      [/.+$/, "comment", "@popall"],
      [/.+/, "comment"],
    ],
  },
};
