import type { NextPage } from "next";
import { useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { ResultLine } from "../components/REPLResultLine";
import { parseAll } from "../logic";

const REPL: NextPage = () => {
  const refEditor = useRef<editor.IStandaloneCodeEditor | null>(null);
  const editor = refEditor.current;
  const [data, render] = useState<Record<string, number[][][]>>({});
  return (
    <div className="h-screen grid grid-cols-1 p-1">
      <Editor
        options={{
          autoIndent: "none",
          codeLens: false,
          minimap: { enabled: false },
          cursorStyle: "line",
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
