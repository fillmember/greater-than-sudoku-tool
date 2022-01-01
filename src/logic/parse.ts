import debounce from "lodash/debounce";
import get from "lodash/get";
import range from "lodash/range";
import trim from "lodash/trim";
import uniq from "lodash/uniq";
import uniqBy from "lodash/uniqBy";
import sum from "lodash/sum";
import memoize from "lodash/memoize";
import { cartesian, kcombination, formation, combination, digits, findClosingParenthesis } from ".";
import { intersect, arsig } from "../logic/set";
const memosum = memoize(sum);

const wrapWithArray = <T = unknown>(v: T): T[] => [v];
function splitToNumbers(input: string, delimiter = ""): number[] {
  return input
    .split(delimiter)
    .map(Number)
    .filter((v) => !Number.isNaN(v));
}
export const matchFromListSyntax = (input: string): ((result: number[][]) => number[]) => {
  if (!input) return () => [];
  const groups = input.split(",").filter(Boolean);
  return function (result: number[][]): number[] {
    return uniq(
      groups.flatMap((group) => {
        const list = splitToNumbers(group);
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
export const parseIncludeExclude = (mode: "include" | "exclude", str: string, result: number[][]): number[][] => {
  const isModeInclude = mode === "include";
  const matches = (isModeInclude ? regInclude : regExclude).exec(str);
  if (matches) {
    const indices = matchFromListSyntax(matches[1])(result);
    const filtered = result.filter((_, i) => {
      const indicesHasIndex = indices.indexOf(i) > -1;
      return isModeInclude ? indicesHasIndex : !indicesHasIndex;
    });
    return filtered;
  }
  return result;
};

export const regSum = /^([\d\~\,]+)\s?in\s?(\d+)/;
export const regInclude = /\+\(([\d,]+)\)/;
export const regExclude = /\!\(([\d,]+)\)/;
export const regSingle = /^(\d+)$/; // 3
export const regAnyLiteral = /^(\.+)/; // ...
export const regCombinationLiteral = /^\((\d+)\)$/; // (123)
export const regFormationLiteral = /^\[[\d,]+\]$/; // [12,13,14]
export const regKCombination = /^K\(\s?(\d)\s?,.+\)/;

export function tryParseForResult(reg: RegExp, str: string, fn: (...matches: string[]) => number[][]): false | number[][] {
  const matches = reg.exec(str);
  if (!matches) return false;
  const match1 = matches[1];
  const [_, ...fnArgs] = matches;
  const afterMatch1 = str.slice(str.indexOf(match1) + match1.length);
  let result = fn(...fnArgs);
  result = parseIncludeExclude("include", afterMatch1, result);
  result = parseIncludeExclude("exclude", afterMatch1, result);
  return result;
}

const groupToCombination = (str: string): number[][] => {
  // simple ones without include/exclude
  if (regSingle.test(str)) {
    return [splitToNumbers(str)];
  }
  if (regCombinationLiteral.test(str)) {
    return splitToNumbers(str).map(wrapWithArray);
  }
  if (regFormationLiteral.test(str)) {
    return uniq(trim(str, "[]").split(",")).map((str) => splitToNumbers(str));
  }
  // with include exclude
  if (regKCombination.test(str)) {
    const matches = regKCombination.exec(str);
    if (!matches) return [];
    const ksize = Number(matches[1]);
    const iFirstComma = str.indexOf(",");
    const iFirstParenthesisClosing = findClosingParenthesis(str, str.indexOf("("));
    const content = trim(str.slice(iFirstComma + 1, iFirstParenthesisClosing));
    const addition = trim(str.slice(iFirstParenthesisClosing + 1));
    const combinations = groupToCombination(content);
    if (!combinations) return [];
    let result = combinations.flatMap((set) => kcombination(ksize, set));
    result = uniqBy(result, (arr) => arr.sort().join(""));
    result = parseIncludeExclude("include", addition, result);
    result = parseIncludeExclude("exclude", addition, result);
    return result;
  }
  const resultAnyLiteral = tryParseForResult(regAnyLiteral, str, (m) => {
    const formations = formation(...m.split("").map(() => digits.map(wrapWithArray)));
    return uniqBy(formations, (arr) => arr.flat().sort().join("")).map((item) => item.map((v) => v[0]));
  });
  if (resultAnyLiteral !== false) return resultAnyLiteral;
  const resultSum = tryParseForResult(regSum, str, (sumInput: string, size: string): number[][] => {
    const sums: number[] = [];
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
    return sums.flatMap((sum) => combination(Number(size), sum));
  });
  if (resultSum !== false) return resultSum;
  return [];
};

export const parse = (line: string): number[][][] => {
  const groups = line.split("-").map(trim).filter(Boolean);
  if (groups.length === 0) {
    return [];
  }
  const combinations: number[][][] = groups.map(groupToCombination).filter((arr) => arr instanceof Array && arr.length > 0);
  return formation(...combinations);
};
export const regFormation = /^(?:F\s)|(?:[A-Z]\d\s?=\s?)/;
export const refCrossRef = /^INTERSECT|SEE|SUM|A<B/;
export const parseAll = debounce((value: string, submit) => {
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
      const content = line;
      try {
        const [command, ...args] = content.split(/\s?[\,\s]\s?/);
        const [[nameA, indexA], [nameB, indexB]] = args.map((str) => str.split("."));
        switch (command) {
          case "INTERSECT":
            const targetA = uniq(data[nameA].map((arr) => get(arr, indexA)));
            const targetB = uniq(data[nameB].map((arr) => get(arr, indexB)));
            const intersected = intersect(targetA, targetB);
            const sigsToKeep = intersected.map(arsig);
            data[nameA] = data[nameA].filter((form) => sigsToKeep.indexOf(arsig(get(form, indexA))) > -1);
            data[nameB] = data[nameB].filter((form) => sigsToKeep.indexOf(arsig(get(form, indexB))) > -1);
            break;
          case "SEE":
            const zipped = cartesian(data[nameA], data[nameB]).filter(([a, b]) => {
              const union = [...get(a, indexA), ...get(b, indexB)];
              return uniq(union).length === union.length;
            });
            data[nameA] = uniq(zipped.map((arr) => arr[0]));
            data[nameB] = uniq(zipped.map((arr) => arr[1]));
            break;
          case "SUM":
            const zipped2 = cartesian(data[nameA], data[nameB]).filter(([a, b]) => {
              const arr = [...get(a, indexA), ...get(b, indexB)];
              return sum(arr) === Number(args[2]);
            });
            data[nameA] = uniq(zipped2.map((arr) => arr[0]));
            data[nameB] = uniq(zipped2.map((arr) => arr[1]));
            break;
          case "A<B":
            const offset = Number(args[2]);
            const zipped3 = cartesian(data[nameA], data[nameB]).filter(([a, b]) => {
              const sumA = memosum(get(a, indexA));
              const sumB = memosum(get(b, indexB));
              return sumA < sumB + offset;
            });
            data[nameA] = uniq(zipped3.map((arr) => arr[0]));
            data[nameB] = uniq(zipped3.map((arr) => arr[1]));
            break;
        }
      } catch (error) {}
    }
  });
  submit(data);
}, 500);
