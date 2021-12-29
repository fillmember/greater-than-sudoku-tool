import type { NextPage } from "next";
import dynamic from "next/dynamic";
import trim from "lodash/trim";
import { parse } from "../logic";
import { useRef } from "react";
const AceEditor = dynamic(
  async () => {
    const ace = await import("react-ace");
    require("ace-builds/src-noconflict/theme-monokai");
    require("ace-builds/src-noconflict/mode-markdown");
    return ace;
  },
  {
    loading: () => <>Loading...</>,
    ssr: false,
  }
);

const regFormation = /^(?:F\s)|(?:[A-Z]\d\s?=\s?)/;
const regCrossRef = /^X\s/;

function evaluateFormation(editor: any, cursor: any, line: string, data: Record<string, number[][][]>): boolean {
  const matches = regFormation.exec(line);
  if (!matches) return false;
  const head = matches[0];
  const formations = parse(line.slice(head.length));
  data[trim(head, " =")] = formations;
  const indentation = new Array(head.length).fill(" ").join("");
  let result;
  if (formations.length > 0) {
    result = "\n" + formations.map((f) => `${indentation}${f.map((b) => b.join("")).join("-")}`).join("\n");
  } else {
    result = "\n" + indentation + "// no possible formation";
  }
  editor.insert(result, { row: cursor.row, column: line.length });
  return true;
}
function evaluateCrossReference(editor: any, cursor: any, line: string, data: Record<string, number[][][]>): boolean {
  if (!regCrossRef.test(line)) return false;
  console.log(data);
}

const REPL: NextPage = () => {
  const rData = useRef({});
  const data = rData.current;
  return (
    <div className="h-screen">
      <AceEditor
        mode="markdown"
        theme="monokai"
        width="100%"
        height="100%"
        fontSize={18}
        showPrintMargin={false}
        tabSize={1}
        wrapEnabled
        commands={[
          {
            name: "evaluate",
            bindKey: { win: "Ctrl-E", mac: "Control-E" },
            exec(editor) {
              const cursor = editor.selection.getCursor();
              if (!cursor) return;
              const line = editor.session.getLine(cursor.row);
              if (evaluateFormation(editor, cursor, line, data)) return;
              if (evaluateCrossReference(editor, cursor, line, data)) return;
            },
          },
        ]}
        onLoad={(editor) => {
          const savedValue = localStorage.getItem("editor-text");
          if (savedValue) {
            editor.setValue(savedValue, -1);
          }
        }}
        onChange={(value) => {
          localStorage.setItem("editor-text", value);
        }}
      />
    </div>
  );
};

export default REPL;
