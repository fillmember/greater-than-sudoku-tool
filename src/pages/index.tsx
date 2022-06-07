import type { NextPage } from "next";
import { useEffect, useRef, useState } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import clone from "lodash/clone";
import type { editor } from "monaco-editor";
import { ResultLine } from "../components/REPLResultLine";
import { crossReference, parseAll } from "../logic";
import { configure } from "../editor";

const formatFormationsForPrint = (forms: number[][][]): string => forms.map((n) => "\t" + n.map((j) => j.join("")).join("-")).join("\n");

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
        onMount={(editor, _monaco) => {
          refEditor.current = editor;
          // register editor action
          // editor.addAction({
          //   id: "print-line-formations",
          //   label: "Print Line Formations",
          //   precondition: "editorTextFocus",
          //   keybindings: [_monaco.KeyMod.CtrlCmd | _monaco.KeyCode.Enter],
          //   run: async (_editor) => {
          //     const model = _editor.getModel();
          //     if (!model) return;
          //     const selections = _editor.getSelections();
          //     if (!selections) return;
          //     // parseAll if data is empty
          //     let latestData: Record<string, number[][][]>;
          //     if (Object.keys(data).length === 0) {
          //       console.log("reconstruct data because data is empty");
          //       latestData = await new Promise((resolve) => {
          //         parseAll(_editor.getValue(), (d: Record<string, number[][][]>) => resolve(d), clone(data));
          //       });
          //     } else {
          //       latestData = data;
          //     }
          //     // create edits
          //     const edits: editor.IIdentifiedSingleEditOperation[] = [];
          //     selections.forEach((selection) => {
          //       const { positionLineNumber, positionColumn } = selection;
          //       const lineContent = model.getLineContent(positionLineNumber);
          //       const matches = /^([A-Z]+\d+)\s?=/.exec(lineContent);
          //       if (!matches) return;
          //       const range = new _monaco.Range(positionLineNumber, positionColumn, positionLineNumber, positionColumn);
          //       const forms = latestData[matches[1]];
          //       if (!forms) return;
          //       const text = `\n${formatFormationsForPrint(forms)}`;
          //       edits.push({ range, text });
          //     });
          //     editor.executeEdits(undefined, edits);
          //   },
          // });
          // load saved value from LocalStorage
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
            onPrint={({ name }) => {
              if (!editor || !monaco) return;
              const selection = editor.getSelection();
              if (!selection) return;
              const text = "\n" + formatFormationsForPrint(data[name]);
              const { positionLineNumber, positionColumn } = selection;
              const range = new monaco.Range(positionLineNumber, positionColumn, positionLineNumber, positionColumn);
              const edits: editor.IIdentifiedSingleEditOperation[] = [{ range, text }];
              editor.executeEdits(undefined, edits);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default REPL;
