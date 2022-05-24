import debounce from "lodash/debounce";
import get from "lodash/get";
import range from "lodash/range";
import trim from "lodash/trim";
import uniq from "lodash/uniq";
import uniqBy from "lodash/uniqBy";
import inRange from "lodash/inRange";
import sum from "lodash/sum";
import memoize from "lodash/memoize";
import { cartesian, kcombination, formation, combination, digits, findClosingParenthesis } from ".";
import { intersect, arsig } from "../logic/set";
import { compareAandB } from "./commands";
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
export const regREF = /^REF\((.+)\)/;

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

const groupToCombination = (str: string, data?: Record<string, number[][][]>): number[][] => {
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
  if (regREF.test(str)) {
    if (!data) return [];
    const matches = regREF.exec(str);
    if (!matches) return [];
    const rawArguments = matches[1].split(",").filter((str) => str.length > 0);
    if (rawArguments.length === 0) return [];
    const args = rawArguments.map((arg) => {
      const [name, index] = arg.split(".");
      return { name, index: Number(index) };
    });
    if (uniq(args.map((g) => g.name)).length === 1) {
      console.log("single line ref mode");
      // algorithm for referencing from one single line: just merge references into one group
      const referredLine = data[args[0].name];
      const indicesToKeep = args.map((g) => g.index);
      const result: number[][] = [];
      referredLine.forEach((c) => {
        result.push(indicesToKeep.flatMap((j) => c[j]));
      });
      return result;
    } else {
      // algorithm for referencing from more lines: create a group of cartesian combinations
      return cartesian(...args.map(({ name, index }) => data[name].map((l) => l[index])).map(uniq)).map((g) => g.flat());
    }
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

export const parse = (line: string, data?: Record<string, number[][][]>): number[][][] => {
  const groups = line.split("-").map(trim).filter(Boolean);
  if (groups.length === 0) {
    return [];
  }
  const combinations: number[][][] = groups
    .map((group) => groupToCombination(group, data))
    .filter((arr) => arr instanceof Array && arr.length > 0);
  return formation(...combinations);
};
export const regFormation = /^(?:F\s)|(?:[A-Z]\d\s?=\s?)/;
export const refCrossRef = /^INTERSECT|SEE|SUM|A<B|A>B|A<=B|A=B|A>=B|BORDER/;
export const parseAll = debounce((value: string, submit) => {
  const data: Record<string, number[][][]> = {};
  const lines = value.split("\n");
  lines
    .filter((line) => line.length > 0)
    .forEach((line) => {
      if (trim(line)[0] === "#") {
        return;
      }
      const formationMatches = regFormation.exec(line);
      if (formationMatches) {
        const head = formationMatches[0];
        const formations = parse(line.slice(head.length), data);
        data[trim(head, " =")] = formations;
      }
      const crossReferenceMatches = refCrossRef.exec(line);
      if (crossReferenceMatches) {
        const content = line;
        try {
          const [command, ...args] = content.split(/\s?[\,\s]\s?/);
          const [[nameA, indexA], [nameB, indexB]] = args.map((str) => str.split("."));
          switch (command) {
            case "INTERSECT": {
              const targetA = uniq(data[nameA].map((arr) => get(arr, indexA)));
              const targetB = uniq(data[nameB].map((arr) => get(arr, indexB)));
              const intersected = intersect(targetA, targetB);
              const sigsToKeep = intersected.map(arsig);
              data[nameA] = data[nameA].filter((form) => sigsToKeep.indexOf(arsig(get(form, indexA))) > -1);
              data[nameB] = data[nameB].filter((form) => sigsToKeep.indexOf(arsig(get(form, indexB))) > -1);
              break;
            }
            case "SEE": {
              const zipped = cartesian(data[nameA], data[nameB]).filter(([a, b]) => {
                const union = [...get(a, indexA), ...get(b, indexB)];
                return uniq(union).length === union.length;
              });
              data[nameA] = uniq(zipped.map((arr) => arr[0]));
              data[nameB] = uniq(zipped.map((arr) => arr[1]));
              break;
            }
            case "SUM": {
              let min: number, max: number;
              const numArg2 = Number(args[2]);
              const numArg3 = Number(args[3]);
              if (Number.isNaN(numArg3)) {
                min = numArg2;
                max = numArg2 + 1;
              } else {
                min = numArg2;
                max = numArg3 + 1;
              }
              // algorithm for cases where the sum is considering 2 different lines
              if (nameA !== nameB) {
                data[nameA] = data[nameA].filter((set) => {
                  const sa = sum(get(set, indexA));
                  return data[nameB].some((setb) => inRange(sa + sum(get(setb, indexB)), min, max));
                });
                data[nameB] = data[nameB].filter((set) => {
                  const sb = sum(get(set, indexB));
                  return data[nameA].some((seta) => inRange(sb + sum(get(seta, indexA)), min, max));
                });
              } else {
                // algorithm for cases where the sum is considering within the same line
                data[nameA] = data[nameA].filter((set) => {
                  const a = get(set, indexA);
                  const b = get(set, indexB);
                  return inRange(sum(a) + sum(b), min, max);
                });
              }
              break;
            }
            case "A>B": {
              compareAandB(">", data, nameA, indexA, nameB, indexB);
              break;
            }
            case "A<B": {
              compareAandB("<", data, nameA, indexA, nameB, indexB);
              break;
            }
            case "A>=B": {
              compareAandB(">=", data, nameA, indexA, nameB, indexB);
              break;
            }
            case "A<=B": {
              compareAandB("<=", data, nameA, indexA, nameB, indexB);
              break;
            }
            case "A=B": {
              compareAandB("=", data, nameA, indexA, nameB, indexB);
              break;
            }
            case "BORDER": {
              const [nameA, nameB, ...rawRelations] = args;
              const relations = rawRelations
                .map((rule) => {
                  const [indexA, indexB, sum] = rule.split(/[\+\=]/).map(Number);
                  return { indexA, indexB, sum };
                })
                .filter((x) => Object.values(x).every((n) => !Number.isNaN(n) && n !== undefined));
              data[nameA] = data[nameA].filter((groupA) =>
                relations.every(({ indexA, indexB, sum: target }) => {
                  const sumA = sum(groupA[indexA]);
                  return data[nameB].some((groupB) => sumA + sum(groupB[indexB]) === target);
                })
              );
              data[nameB] = data[nameB].filter((groupB) =>
                relations.every(({ indexA, indexB, sum: target }) => {
                  const sumB = sum(groupB[indexB]);
                  return data[nameA].some((groupA) => sumB + sum(groupA[indexA]) === target);
                })
              );
            }
          }
        } catch (error) {}
      }
    });
  submit(data);
}, 500);
