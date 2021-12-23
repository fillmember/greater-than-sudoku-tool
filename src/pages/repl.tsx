import type { NextPage } from "next";
import Head from "next/head";
import { useEffect } from "react";
import debounce from "lodash/debounce";
import { parse } from "../logic";

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
          const formations = parse(line.slice(2));
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
