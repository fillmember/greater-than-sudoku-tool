import type { NextPage } from "next";
import { useEffect, useRef, useState } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import clone from "lodash/clone";
import type { editor } from "monaco-editor";
import { ResultLine } from "../components/REPLResultLine";
import { crossReference, parseAll } from "../logic";
import { configure } from "../editor";

const REPL: NextPage = () => {
  const monaco = useMonaco();
  const refEditor = useRef<editor.IStandaloneCodeEditor | null>(null);
  const editor = refEditor.current;
  const [data, setData] = useState<Record<string, number[][][]>>({});
  const render = (newData: Record<string, number[][][]>, newInstructs: string[]) => {
    let shouldReapplyInstructions = true;
    let loop = 0;
    while (shouldReapplyInstructions && loop < 5) {
      const copyOfData: Record<string, number[][][]> = {};
      for (var k in newData) {
        copyOfData[k] = newData[k].map((x) => x);
      }
      newInstructs.forEach((line) => {
        crossReference(line, copyOfData);
      });
      const somethingChanged = Object.keys(copyOfData).some((k) => copyOfData[k].length !== newData[k].length);
      if (somethingChanged) {
        newData = copyOfData;
        shouldReapplyInstructions = true;
      } else {
        shouldReapplyInstructions = false;
      }
      loop = loop + 1;
    }
    setData(newData);
  };
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
        height="60vh"
        onMount={(editor) => {
          refEditor.current = editor;
          const savedValue = localStorage.getItem("editor-text");
          if (savedValue) {
            editor.setValue(savedValue);
            parseAll(savedValue, render, clone(data));
          }
        }}
        onChange={(value) => {
          localStorage.setItem("editor-text", value || "");
          if (!value) return;
          parseAll(value, render, clone(data));
        }}
      />
      <div className="font-mono text-sm overflow-auto p-2 border-t">
        {Object.keys(data).map((key: string) => (
          <ResultLine
            key={key + data[key].length}
            name={key}
            formations={data[key]}
            onItemClick={({ name, groupIndex }) => {
              if (!editor) return;
              editor.trigger("keyboard", "type", { text: `${name}.${groupIndex} ` });
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default REPL;
