import range from "lodash/range";
import uniq from "lodash/uniq";
import uniqBy from "lodash/uniqBy";
import trim from "lodash/trim";
import { kcombination, formation, combination, digits } from ".";

const fnReturnEmptyArray = () => [];
const wrapWithArray = <T = unknown>(v: T): T[] => [v];
function splitToNumbers(input: string, delimiter = ""): number[] {
  return input
    .split(delimiter)
    .map(Number)
    .filter((v) => !Number.isNaN(v));
}

export const parseListSyntax = (input: string): ((result: number[][]) => number[]) => {
  if (!input) return fnReturnEmptyArray;
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

export const regSum = /^([\d\~\,]+)\s?in/;
export const regSize = /in\s?(\d+)/;
export const regInclude = /[^!]\(([\d,]+)\)/;
export const regExclude = /\!\(([\d,]+)\)/;
export const regSingle = /^(\d)$/; // 3
export const regAnyLiteral = /^\.+$/; // ...
export const regCombinationLiteral = /^\((\d+)\)$/; // (123)
export const regFormationLiteral = /^\[[\d,]+\]$/; // [12,13,14]
export const regKCombination = /^K\(\d,\d+\)$/; // K(2, 123)
export const parse = (line: string): number[][][] => {
  const groups = line.split("-").map(trim).filter(Boolean);
  if (groups.length === 0) {
    return [];
  }
  const combinations: number[][][] = groups
    .map((str: string): number[][] => {
      if (regKCombination.test(str)) {
        const size = Number(str[2]);
        const set = splitToNumbers(str.slice(4, -1));
        return kcombination(size, set);
      }
      if (regCombinationLiteral.test(str)) {
        return splitToNumbers(str).map(wrapWithArray);
      }
      if (regAnyLiteral.test(str)) {
        const formations = formation(...str.split("").map(() => digits.map(wrapWithArray)));
        return uniqBy(formations, (arr) => arr.flat().sort().join("")).map((item) => item.map((v) => v[0]));
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
          .map((str) => splitToNumbers(str));
      }
      return [];
    })
    .filter((arr) => arr instanceof Array && arr.length > 0);
  const formations: number[][][] = formation(...combinations);
  return formations;
};
