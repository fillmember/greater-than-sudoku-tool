import type { NextPage } from "next";
import type { editor as EditorType } from "monaco-editor";
import type { RecordOfFormations } from "types";

import { useEffect, useRef, useState } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import clone from "lodash/clone";
import { ResultLine } from "components/REPLResultLine";
import { crossReference, parseAll } from "logic/parse";
import { configure } from "editor";
import { match, refCrossRef, regFormation } from "logic/regexps";

const formatFormationsForPrint = (forms: number[][][]): string => forms.map((n) => "\t" + n.map((j) => j.join("")).join("-")).join("\n");

const REPL: NextPage = () => {
  const monaco = useMonaco();
  const refEditor = useRef<EditorType.IStandaloneCodeEditor | null>(null);
  const editor = refEditor.current;
  const editorContent = editor?.getValue();
  const [data, setData] = useState<RecordOfFormations>({});
  const render = (newData: RecordOfFormations, newInstructs: string[]) => {
    let shouldReapplyInstructions = true;
    let loop = 0;
    while (shouldReapplyInstructions && loop < 5) {
      const copyOfData: RecordOfFormations = {};
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
    <div className="font-mono h-screen grid grid-rows-2 md:grid-cols-2 md:grid-rows-1">
      <Editor
        language="yee"
        options={{
          autoIndent: "none",
          codeLens: false,
          minimap: { enabled: false },
          cursorStyle: "line",
          fontSize: 14,
          lineHeight: 24,
          wordWrap: "on",
          lineNumbers: "off",
        }}
        onMount={(editor, _monaco) => {
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
      <div className="overflow-auto border-t pt-1 md:border-l px-1 md:pt-0">
        {editorContent?.split("\n").map((line, index, contentLines) => {
          const matchFormation = match(regFormation, line);
          if (matchFormation.matched) {
            const key = matchFormation.result[1];
            return (
              <ResultLine
                key={index}
                formations={data[key]}
                name={key}
                data={data}
                onItemClick={({ name, groupIndex }) => {
                  if (!editor) return;
                  let textToAdd = `${name}.${groupIndex}`;
                  const selection = editor.getSelection();
                  if (selection) {
                    const line = contentLines[selection.positionLineNumber - 1];
                    const lineBeforeMe = line.slice(0, selection.positionColumn - 1);
                    const charRightBefore = line[selection.positionColumn - 2];
                    match(regFormation, line).then(() => {
                      const behindAnOpenRefFn = match(/REF\([^)-]*?$/, lineBeforeMe);
                      if (behindAnOpenRefFn.matched) {
                        switch (charRightBefore) {
                          case "(":
                          case ",":
                            // prepend nothing
                            break;
                          default:
                            textToAdd = `,${textToAdd}`;
                        }
                      } else {
                        // End of line
                        textToAdd = `REF(${textToAdd})`;
                        if (charRightBefore !== "-") textToAdd = `-${textToAdd}`;
                      }
                      return true;
                    }) ||
                      match(refCrossRef, line).then(() => {
                        if (charRightBefore !== " ") textToAdd = ` ${textToAdd}`;
                        return true;
                      });
                  }
                  editor.trigger("keyboard", "type", { text: textToAdd });
                  editor.focus();
                }}
                onPrint={({ name }) => {
                  if (!editor || !monaco) return;
                  const selection = editor.getSelection();
                  if (!selection) return;
                  const text = "\n" + formatFormationsForPrint(data[name]);
                  const { positionLineNumber, positionColumn } = selection;
                  const range = new monaco.Range(positionLineNumber, positionColumn, positionLineNumber, positionColumn);
                  const edits: EditorType.IIdentifiedSingleEditOperation[] = [{ range, text }];
                  editor.executeEdits(undefined, edits);
                  editor.focus();
                }}
              />
            );
          }
          return (
            <div key={index} className="h-[24px]">
              &nbsp;
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default REPL;
