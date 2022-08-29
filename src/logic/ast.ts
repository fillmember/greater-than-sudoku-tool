import { noop } from "lodash";
import { findClosingParenthesis } from "./utils";

export type Modifier = { type: "modifier"; name: string; value: string };
export type Func = {
  type: "func";
  name: string;
  params: AstTree;
  modifiers: Modifier[];
  parent?: { type: string; name?: string };
  result?: any;
};
export type Param = { type: "param"; value: string; parent?: { type: string; name?: string }; result?: any };
export type Group = { type: "group"; children: Param[]; parent?: { type: string; name?: string }; result?: any };
export type AstNode = Param | Group | Func;
export type AstTree = AstNode[];

export function getAST(str: string): AstTree {
  str = str.replaceAll(" ", "");
  let result: AstTree = [];
  let marker = 0;
  let walker = 0;
  while (walker < str.length) {
    const char = str[walker];
    switch (char) {
      case "[": {
        const closing = findClosingParenthesis(str, walker, { open: "[", close: "]" });
        const subStr = str.slice(walker + 1, closing);
        result.push({
          type: "group",
          children: subStr.split(",").map((str) => ({ type: "param", value: str })),
        });
        walker = closing;
        marker = walker + 1;
        break;
      }
      case "(":
        const closing = findClosingParenthesis(str, walker);
        const name = str.slice(marker, walker);
        const subStr = str.slice(walker + 1, closing);
        switch (name) {
          case "!":
          case "+":
            const func = result[result.length - 1] as Func;
            if (!func.modifiers) throw new Error("Modifier must follow func");
            func.modifiers.push({ type: "modifier", name, value: subStr });
            break;
          case "": // nameless -> not function but group
            result.push({
              type: "group",
              children: subStr.split("").map<Param>((str) => ({ type: "param", value: str, parent: { type: "group" } })),
            });
            break;
          default: {
            result.push({
              type: "func",
              name,
              params: getAST(subStr).map((n) => {
                n.parent = { type: "func", name };
                return n;
              }),
              modifiers: [],
            });
          }
        }
        walker = closing;
        marker = walker + 1;
        break;
      case "-":
      case ",":
        if (marker !== walker) {
          result.push({ type: "param", value: str.slice(marker, walker) });
        }
        marker = walker + 1;
        break;
    }
    walker++;
  }
  const strLast = str.slice(marker, walker);
  if (marker !== walker && strLast) {
    strLast && result.push({ type: "param", value: strLast } as Param);
  }
  return result;
}

interface WalkAstTreeHandlers {
  func?: Record<string, (node: Func, tree: AstTree) => void>;
  group?: (node: Group, tree: AstTree) => void;
  param?: (node: Param, tree: AstTree) => void;
  all?: (node: AstNode, tree: AstTree) => void;
}

export function walkAstTree(tree: AstTree, handlers: WalkAstTreeHandlers) {
  const { all = noop, func = {}, group = noop, param = noop } = handlers;
  tree.forEach((node) => {
    switch (node.type) {
      case "func": {
        walkAstTree(node.params, handlers);
        const fn = func[node.name];
        if (fn) {
          fn(node, tree);
          all(node, tree);
        }
        break;
      }
      case "group":
        walkAstTree(node.children, handlers);
        group(node, tree);
        all(node, tree);
        break;
      case "param":
        param(node, tree);
        all(node, tree);
        break;
    }
  });
}
