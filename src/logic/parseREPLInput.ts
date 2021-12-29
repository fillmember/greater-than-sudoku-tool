import range from "lodash/range";
import uniq from "lodash/uniq";
import uniqBy from "lodash/uniqBy";
import trim from "lodash/trim";
import { kcombination, formation, combination, digits, findClosingParenthesis } from ".";

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
