import type { NextPage } from "next";
import { useEffect, useRef, useState } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { ResultLine } from "../components/REPLResultLine";
import { parseAll } from "../logic";
import { configure } from "../editor";

const REPL: NextPage = () => {
  const monaco = useMonaco();
  const refEditor = useRef<editor.IStandaloneCodeEditor | null>(null);
  const editor = refEditor.current;
  const [data, render] = useState<Record<string, number[][][]>>({});
  useEffect(() => {
    if (!monaco) return;
    configure(monaco);
  }, [monaco]);
  return (
    <div className="h-screen flex flex-col">
      <Editor
        language="yee"
        options={{
          autoIndent: "none",
          codeLens: false,
          minimap: { enabled: false },
          cursorStyle: "line",
          fontSize: 14,
          lineHeight: 24,
        }}
        height="50vh"
        onMount={(editor) => {
          refEditor.current = editor;
          const savedValue = localStorage.getItem("editor-text");
          if (savedValue) {
            editor.setValue(savedValue);
            parseAll(savedValue, render);
          }
        }}
        onChange={(value) => {
          if (!value) return;
          localStorage.setItem("editor-text", value);
          parseAll(value, render);
        }}
      />
      <div className="font-mono text-sm overflow-auto p-2 border-t">
        {Object.keys(data).map((key: string) => (
          <ResultLine
            key={key}
            name={key}
            formations={data[key]}
            onItemClick={({ name, groupIndex }) => {
              if (!editor) return;
              editor.trigger("keyboard", "type", { text: `${name}.${groupIndex}` });
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default REPL;
