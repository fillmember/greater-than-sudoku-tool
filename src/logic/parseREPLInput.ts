import range from "lodash/range";
import uniq from "lodash/uniq";
import uniqBy from "lodash/uniqBy";
import trim from "lodash/trim";
import { kcombination, formation, combination, digits } from ".";

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

export const regSum = /^([\d\~\,]+)\s?in/;
export const regSize = /in\s?(\d+)/;
export const regInclude = /\+\(([\d,]+)\)/;
export const regExclude = /\!\(([\d,]+)\)/;
export const regSingle = /^(\d)$/; // 3
export const regAnyLiteral = /^(\.+)/; // ...
export const regCombinationLiteral = /^\((\d+)\)$/; // (123)
export const regFormationLiteral = /^\[[\d,]+\]$/; // [12,13,14]
export const regKCombination = /^K\((\d,\d+)\)/; // K(2, 123)

export function tryParseForResult(reg: RegExp, str: string, fn: (match1: string) => number[][]): false | number[][] {
  const matches = reg.exec(str);
  if (!matches) return false;
  const match1 = matches[1];
  const afterMatch1 = str.slice(str.indexOf(match1) + match1.length);
  let result = fn(match1);
  result = parseIncludeExclude("include", afterMatch1, result);
  result = parseIncludeExclude("exclude", afterMatch1, result);
  return result;
}

export const parse = (line: string): number[][][] => {
  const groups = line.split("-").map(trim).filter(Boolean);
  if (groups.length === 0) {
    return [];
  }
  const combinations: number[][][] = groups
    .map((str: string): number[][] => {
      // simple ones without include/exclude
      if (regSingle.test(str)) {
        return [[Number(str)]];
      }
      if (regCombinationLiteral.test(str)) {
        return splitToNumbers(str).map(wrapWithArray);
      }
      if (regFormationLiteral.test(str)) {
        return trim(str, "[]")
          .split(",")
          .map((str) => splitToNumbers(str));
      }
      // with include exclude
      const resultKCombination = tryParseForResult(regKCombination, str, (m) => {
        const [size, set] = m.split(",");
        return kcombination(Number(size), splitToNumbers(set));
      });
      if (resultKCombination !== false) return resultKCombination;
      const resultAnyLiteral = tryParseForResult(regAnyLiteral, str, (m) => {
        const formations = formation(...m.split("").map(() => digits.map(wrapWithArray)));
        return uniqBy(formations, (arr) => arr.flat().sort().join("")).map((item) => item.map((v) => v[0]));
      });
      if (resultAnyLiteral !== false) return resultAnyLiteral;
      const resultSum = tryParseForResult(regSum, str, () => {
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
        return sums.flatMap((sum) => combination(size, sum));
      });
      if (resultSum !== false) return resultSum;
      return [];
    })
    .filter((arr) => arr instanceof Array && arr.length > 0);
  return formation(...combinations);
};
