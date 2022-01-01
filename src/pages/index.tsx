import type { NextPage } from "next";
import { useEffect, useRef, useState } from "react";
import Editor, { Monaco, useMonaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { ResultLine } from "../components/REPLResultLine";
import { parse, parseAll } from "../logic";
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
        onMount={(editor, monaco) => {
          refEditor.current = editor;
          editor.addAction({
            id: "solver-evaluate-line",
            label: "Solver: Evaluate Line",
            precondition: "editorTextFocus",
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
            contextMenuGroupId: "modification",
            contextMenuOrder: 1.5,
            run(editor) {
              const model = editor.getModel();
              const selections = editor.getSelections();
              if (!selections || !model) return;
              const edits: editor.IIdentifiedSingleEditOperation[] = [];
              selections.forEach((selection) => {
                const { positionLineNumber, positionColumn } = selection;
                const lineContent = model.getLineContent(positionLineNumber);
                const matches = /[A-Z]+\d+\s=\s(.+)/.exec(lineContent);
                if (!matches) return null;
                const range = new monaco.Range(positionLineNumber, positionColumn, positionLineNumber, positionColumn);
                const text = parse(matches[1])
                  .map((arr) => `\n\t${arr.map((nums) => nums.join("")).join("-")}`)
                  .join("");
                edits.push({ range, text });
              });
              editor.executeEdits(undefined, edits);
            },
          });
          const savedValue = localStorage.getItem("editor-text");
          if (savedValue) {
            editor.setValue(savedValue);
            parseAll(savedValue, render);
          }
        }}
        onChange={(value) => {
          localStorage.setItem("editor-text", value || "");
          if (!value) return;
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
