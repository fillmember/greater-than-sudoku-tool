import type { NextPage } from "next";
import Head from "next/head";
import { useEffect } from "react";
import range from "lodash/range";
import trim from "lodash/trim";
import uniq from "lodash/uniq";
import uniqBy from "lodash/uniqBy";
import debounce from "lodash/debounce";
import { combination, formation, kcombination } from "../logic";

const parseListSyntax = (input: string): ((result: number[][]) => number[]) => {
  if (!input) return () => [];
  const groups = input.split(",").filter(Boolean);
  return function (result: number[][]): number[] {
    return uniq(
      groups.flatMap((group) => {
        const list = group.split("").map(Number).filter(Boolean);
        const indices: number[] = [];
        result.forEach((candidate, index) => {
          if (list.every((listItem) => candidate.indexOf(listItem) > -1)) {
            indices.push(index);
          }
        });
        return indices;
      })
    );
  };
};

const regSum = /^([\d\~\,]+)\s?in/;
const regSize = /in\s?(\d+)/;
const regInclude = /[^!]\(([\d,]+)\)/;
const regExclude = /\!\(([\d,]+)\)/;
const regSingle = /^(\d)$/;
const regAnyLiteral = /^\.+$/;
const regCombinationLiteral = /^\((\d+)\)$/;
const regFormationLiteral = /^\[[\d,]+\]$/;
const regKCombination = /^K\(\d,\d+\)$/;
const parseFormation = (line: string): number[][][] => {
  const groups = line.split("-").map(trim).filter(Boolean);
  if (groups.length === 0) {
    return [];
  }
  const combinations = groups
    .map((str) => {
      if (regKCombination.test(str)) {
        const size = Number(str[2]);
        const set = str
          .slice(4, -1)
          .split("")
          .map(Number)
          .filter((v) => !Number.isNaN(v));
        return kcombination(size, set);
      }
      if (regCombinationLiteral.test(str)) {
        return str
          .split("")
          .map(Number)
          .filter((v) => !Number.isNaN(v))
          .map((v) => [v]);
      }
      if (regAnyLiteral.test(str)) {
        const f = formation(...str.split("").map(() => [[1], [2], [3], [4], [5], [6], [7], [8], [9]]));
        return uniqBy(f, (arr) => arr.flat().sort().join(""));
      }
      if (regSum.test(str)) {
        const sums: number[] = [];
        const size = Number((regSize.exec(str) || [])[1]) || 1;
        const sumInput = (regSum.exec(str) || [])[1];
        if (sumInput.indexOf("~") > -1) {
          const [min, max] = sumInput.split("~").map(trim).map(Number);
          range(min, max + 1, 1).forEach((value) => sums.push(value));
        } else if (sumInput.indexOf(",") > -1) {
          sumInput
            .split(",")
            .map(Number)
            .forEach((sum) => sums.push(sum));
        } else {
          sums.push(Number(sumInput));
        }
        let result = sums.flatMap((sum) => combination(size, sum));
        const includes = regInclude.exec(str);
        if (includes) {
          const indices = parseListSyntax(includes[1])(result);
          result = result.filter((_, i) => indices.indexOf(i) > -1);
        }
        const excludes = regExclude.exec(str);
        if (excludes) {
          const indices = parseListSyntax(excludes[1])(result);
          result = result.filter((_, i) => indices.indexOf(i) === -1);
        }
        return result;
      }
      if (regSingle.test(str)) {
        return [[Number(str)]];
      }
      if (regFormationLiteral.test(str)) {
        return str
          .slice(1, -1)
          .split(",")
          .map((str) =>
            str
              .split("")
              .map(Number)
              .filter((v) => !Number.isNaN(v))
              .map((v) => [v])
          );
      }
      return [];
    })
    .filter((arr) => arr instanceof Array && arr.length > 0);
  const formations = formation(...combinations);
  return formations;
};

const REPL: NextPage = () => {
  useEffect(() => {
    // @ts-ignore
    var editor = window.ace.edit("editor");
    // @ts-ignore
    window.editor = editor;
    try {
      editor.setValue(localStorage.getItem("editor-text"), -1);
    } catch (e) {}
    editor.session.setUseWrapMode(true);
    editor.commands.addCommand({
      name: "evaluateLine",
      bindKey: { win: "Ctrl-E", mac: "Control-E" },
      exec: function () {
        const cursor = editor.selection.getCursor();
        if (!cursor) return;
        const line = editor.session.getLine(cursor.row);
        if (line.slice(0, 2) === "F ") {
          const formations = parseFormation(line.slice(2));
          let result;
          if (formations.length > 0) {
            result = formations.map((f) => `  ${f.map((b) => b.join("")).join("-")}`).join("\n");
          } else {
            result = "  // no formation found";
          }
          editor.insert("\n" + result, { row: cursor.row + 1, column: 0 });
        }
      },
    });
    editor.session.on(
      "change",
      debounce(
        function () {
          localStorage.setItem("editor-text", editor.getValue());
        },
        1000,
        { leading: true }
      )
    );
    return () => editor.destroy();
  }, []);
  return (
    <div className="p-2 h-screen">
      <Head>
        <script type="text/javascript" charSet="utf-8" src="https://pagecdn.io/lib/ace/1.4.13/ace.min.js" async />
      </Head>
      <div id="editor" className="w-full h-full text-lg"></div>
    </div>
  );
};

export default REPL;
