import type { NextPage } from "next";
import { useState } from "react";
import dynamic from "next/dynamic";
import trim from "lodash/trim";
import get from "lodash/get";
import debounce from "lodash/debounce";
import { cartesian, parse } from "../logic";
import { ResultLine } from "../components/REPLResultLine";
import { identity, intersectionBy, isEqual, sortedUniq, uniq, zip } from "lodash";
const AceEditor = dynamic(
  async () => {
    const ace = await import("react-ace");
    require("ace-builds/src-noconflict/theme-github");
    require("ace-builds/src-noconflict/mode-markdown");
    return ace;
  },
  {
    loading: () => <>Loading...</>,
    ssr: false,
  }
);

const regFormation = /^(?:F\s)|(?:[A-Z]\d\s?=\s?)/;
const refCrossRef = /^X\s/;

// function evaluateFormation(editor: any, cursor: any, line: string, data: Record<string, number[][][]>): boolean {
//   const matches = regFormation.exec(line);
//   if (!matches) return false;
//   const head = matches[0];
//   const formations = parse(line.slice(head.length));
//   data[trim(head, " =")] = formations;
//   const indentation = new Array(head.length).fill(" ").join("");
//   let result;
//   if (formations.length > 0) {
//     result = "\n" + formations.map((f) => `${indentation}${f.map((b) => b.join("")).join("-")}`).join("\n");
//   } else {
//     result = "\n" + indentation + "// no possible formation";
//   }
//   editor.insert(result, { row: cursor.row, column: line.length });
//   return true;
// }
function arsig(arr: number[]): string {
  return arr.map(identity).join("");
}
const parseAll = debounce((value: string, render) => {
  const data: Record<string, number[][][]> = {};
  const lines = value.split("\n");
  lines.forEach((line) => {
    const formationMatches = regFormation.exec(line);
    if (formationMatches) {
      const head = formationMatches[0];
      const formations = parse(line.slice(head.length));
      data[trim(head, " =")] = formations;
    }
    const crossReferenceMatches = refCrossRef.exec(line);
    if (crossReferenceMatches) {
      const content = line.slice(2);
      try {
        const [command, ...accessors] = content.split(/[\,\s]/);
        const [[nameA, indexA], [nameB, indexB]] = accessors.map((str) => str.split("."));
        switch (command.toLowerCase()) {
          case "intersect":
            const targetA = sortedUniq(data[nameA].map((arr) => get(arr, indexA)));
            const targetB = sortedUniq(data[nameB].map((arr) => get(arr, indexB)));
            const intersected = intersectionBy(targetA, targetB, arsig);
            const sigsToKeep = intersected.map(arsig);
            data[nameA] = data[nameA].filter((form) => sigsToKeep.indexOf(arsig(get(form, indexA))) > -1);
            data[nameB] = data[nameB].filter((form) => sigsToKeep.indexOf(arsig(get(form, indexB))) > -1);
            break;
          case "dedupe":
            // ()
            const zipped = cartesian(data[nameA], data[nameB]).filter(([a, b]) => {
              const union = [...get(a, indexA), ...get(b, indexB)];
              return uniq(union).length === union.length;
            });
            data[nameA] = uniq(zipped.map((arr) => arr[0]));
            data[nameB] = uniq(zipped.map((arr) => arr[1]));
            break;
        }
      } catch (error) {}
    }
  });
  render(data);
}, 500);

const REPL: NextPage = () => {
  const [data, render] = useState<Record<string, number[][][]>>({});
  return (
    <div className="h-screen grid grid-cols-1 p-1">
      <AceEditor
        mode="markdown"
        theme="github"
        width="100%"
        height="50vh"
        fontSize={14}
        showPrintMargin={false}
        showGutter={false}
        tabSize={1}
        wrapEnabled={true}
        onLoad={(editor) => {
          const savedValue = localStorage.getItem("editor-text");
          if (savedValue) {
            editor.setValue(savedValue, -1);
          }
        }}
        onChange={(value) => {
          localStorage.setItem("editor-text", value);
          parseAll(value, render);
        }}
      />
      <div className="font-mono text-sm overflow-auto p-2 border-t">
        {Object.keys(data).map((key: string) => (
          <ResultLine key={key} name={key} formations={data[key]} />
        ))}
      </div>
    </div>
  );
};

export default REPL;
