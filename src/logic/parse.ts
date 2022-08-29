import { debounce, get, range, trim, uniq, uniqBy, inRange, sum, pick, identity, lowerCase } from "lodash";
import { digits, findClosingParenthesis } from "./utils";
import { cartesian, kcombination, formation, combination } from "./math";
import { intersect, arsig, hasOverlap } from "../logic/set";
import { compareAandB, getArgs2, getCommandHead } from "./commands";
import {
  regInclude,
  regExclude,
  regSingle,
  regCombinationLiteral,
  regFormationLiteral,
  regREF,
  regKCombination,
  regAnyLiteral,
  regSum,
  refCrossRef,
  regFormation,
  match,
  regFormationPosition,
} from "./regexps";

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

export const groupToCombination = (str: string, data: Record<string, number[][][]>): number[][] => {
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
    const iFirstParenthesisClosing = findClosingParenthesis(str, str.indexOf("("));
    const mainFunctionArguments = str.slice(0, iFirstParenthesisClosing + 1);
    const matches = regREF.exec(mainFunctionArguments);
    if (!matches) return [];
    const rawArguments = matches[1].split(",").filter((str) => str.length > 0);
    const addition = trim(str.slice(iFirstParenthesisClosing + 1));
    if (rawArguments.length === 0) return [];
    let result: number[][] = [];
    const args = rawArguments.map((arg) => {
      const [name, index] = arg.split(".");
      return { name, index: Number(index) };
    });
    if (uniq(args.map((g) => g.name)).length === 1) {
      // algorithm for referencing from one single line: just merge references into one group
      const referredLine = data[args[0].name];
      if (referredLine) {
        const indicesToKeep = args.map((g) => g.index);
        referredLine.forEach((c) => {
          result.push(indicesToKeep.flatMap((j) => c[j]));
        });
      }
    } else {
      // algorithm for referencing from more lines: create a group of cartesian combinations
      result = cartesian(...args.map(({ name, index }) => data[name].map((l) => l[index])).map(uniq)).map((g) => g.flat());
    }
    result = uniqBy(result, (arr) => arr.map(identity).sort().join(""));
    result = parseIncludeExclude("include", addition, result);
    result = parseIncludeExclude("exclude", addition, result);
    return result;
  }
  if (regKCombination.test(str)) {
    const matches = regKCombination.exec(str);
    if (!matches) return [];
    const ksize = Number(matches[1]);
    const iFirstComma = str.indexOf(",");
    const iFirstParenthesisClosing = findClosingParenthesis(str, str.indexOf("("));
    const content = trim(str.slice(iFirstComma + 1, iFirstParenthesisClosing));
    const addition = trim(str.slice(iFirstParenthesisClosing + 1));
    const combinations = groupToCombination(content, data);
    if (!combinations) return [];
    let result = combinations.flatMap((set) => kcombination(ksize, set));
    result = uniqBy(result, (arr) => arr.map(identity).sort().join(""));
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
export const parse = (line: string, data: Record<string, number[][][]>): number[][][] => {
  const groups = line.split("-").map(trim).filter(Boolean);
  if (groups.length === 0) {
    return [];
  }
  const combinations: number[][][] = groups
    .map((group) => groupToCombination(group, data))
    .filter((arr) => arr instanceof Array && arr.length > 0);
  return formation(...combinations);
};

export const crossReference = (line: string, data: Record<string, number[][][]>) => {
  if (refCrossRef.test(line) === false) return;
  try {
    const [command, restOfArgs] = getCommandHead(line);
    switch (command) {
      case "FN": {
        const code = line.slice(command.length);
        try {
          const fn = new Function("d", "t", code);
          const has = (set: any, target: any) => set.indexOf(target) > -1;
          fn(data, { sum, has });
          return true;
        } catch (error) {
          console.log("silently failing at running user function", error);
          return false;
        }
      }
      case "A_IN_B": {
        if (typeof restOfArgs === "string") return;
        const { nameA, indexA, nameB, indexB } = getArgs2(restOfArgs);
        data[nameA] = data[nameA].filter((formA) => {
          const a: number[] = get(formA, indexA);
          const result = data[nameB].some((formB) => {
            const b: number[] = get(formB, indexB);
            return a.every((digit: number) => b.indexOf(digit) > -1);
          });
          return result;
        });
        return true;
      }
      case "A_HAS_B": {
        if (typeof restOfArgs === "string") return;
        const { nameA, indexA, nameB, indexB } = getArgs2(restOfArgs);
        data[nameA] = data[nameA].filter((formA) => {
          const a: number[] = get(formA, indexA);
          const result = data[nameB].some((formB) => {
            const b: number[] = get(formB, indexB);
            return b.every((digit: number) => a.indexOf(digit) > -1);
          });
          return result;
        });
        data[nameB] = data[nameB].filter((formB) => {
          const b: number[] = get(formB, indexB);
          const result = data[nameA].some((formA) => {
            const a: number[] = get(formA, indexA);
            return b.every((digit: number) => a.indexOf(digit) > -1);
          });
          return result;
        });
        return true;
      }
      case "INTERSECT": {
        if (typeof restOfArgs === "string") return;
        const { nameA, indexA, nameB, indexB } = getArgs2(restOfArgs);
        const targetA = uniq(data[nameA].map((arr) => get(arr, indexA)));
        const targetB = uniq(data[nameB].map((arr) => get(arr, indexB)));
        const intersected = intersect(targetA, targetB);
        const sigsToKeep = intersected.map(arsig);
        data[nameA] = data[nameA].filter((form) => sigsToKeep.indexOf(arsig(get(form, indexA))) > -1);
        data[nameB] = data[nameB].filter((form) => sigsToKeep.indexOf(arsig(get(form, indexB))) > -1);
        return true;
      }
      case "SEE": {
        if (typeof restOfArgs === "string") return;
        const { nameA, indexA, nameB, indexB } = getArgs2(restOfArgs);
        const zipped = cartesian(data[nameA], data[nameB]).filter(([a, b]) => {
          const union = [...get(a, indexA), ...get(b, indexB)];
          return uniq(union).length === union.length;
        });
        data[nameA] = uniq(zipped.map((arr) => arr[0]));
        data[nameB] = uniq(zipped.map((arr) => arr[1]));
        return true;
      }
      case "SUM": {
        if (typeof restOfArgs === "string") return;
        const { nameA, indexA, nameB, indexB } = getArgs2(restOfArgs);
        const { unique = true } = restOfArgs.slice(3).reduce((options, currentItem) => {
          switch (lowerCase(trim(currentItem, "- "))) {
            case "-no-overlap":
            case "-u":
            case "unique":
              return { ...options, unique: true };
            case "-allow-overlap":
            case "notunique":
              return { ...options, unique: false };
            default:
              return options;
          }
        }, {} as Record<string, boolean>);
        let min: number, max: number;
        const numArg2 = Number(restOfArgs[2]);
        const numArg3 = Number(restOfArgs[3]);
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
            const _a = get(set, indexA);
            const sa = sum(_a);
            return data[nameB].some((setb) => {
              const _b = get(setb, indexB);
              return inRange(sa + sum(_b), min, max) && (unique ? !hasOverlap(_a, _b) : true);
            });
          });
          data[nameB] = data[nameB].filter((set) => {
            const _b = get(set, indexB);
            const sb = sum(_b);
            return data[nameA].some((seta) => {
              const _a = get(seta, indexA);
              return inRange(sb + sum(_a), min, max) && (unique ? !hasOverlap(_a, _b) : true);
            });
          });
        } else {
          // algorithm for cases where the sum is considering within the same line
          data[nameA] = data[nameA].filter((set) => {
            const a = get(set, indexA);
            const b = get(set, indexB);
            return inRange(sum(a) + sum(b), min, max);
          });
        }
        return true;
      }
      case "A>B": {
        if (typeof restOfArgs === "string") return;
        const { nameA, indexA, nameB, indexB } = getArgs2(restOfArgs);
        compareAandB(">", data, nameA, indexA, nameB, indexB);
        return true;
      }
      case "A<B": {
        if (typeof restOfArgs === "string") return;
        const { nameA, indexA, nameB, indexB } = getArgs2(restOfArgs);
        compareAandB("<", data, nameA, indexA, nameB, indexB);
        return true;
      }
      case "A>=B": {
        if (typeof restOfArgs === "string") return;
        const { nameA, indexA, nameB, indexB } = getArgs2(restOfArgs);
        compareAandB(">=", data, nameA, indexA, nameB, indexB);
        return true;
      }
      case "A<=B": {
        if (typeof restOfArgs === "string") return;
        const { nameA, indexA, nameB, indexB } = getArgs2(restOfArgs);
        compareAandB("<=", data, nameA, indexA, nameB, indexB);
        return true;
      }
      case "A=B": {
        if (typeof restOfArgs === "string") return;
        const { nameA, indexA, nameB, indexB } = getArgs2(restOfArgs);
        compareAandB("=", data, nameA, indexA, nameB, indexB);
        return true;
      }
      case "BORDER": {
        if (typeof restOfArgs === "string") return;
        const [nameA, nameB, ...rawRelations] = restOfArgs;
        const relations = rawRelations
          .map((rule) => {
            const [indexA, indexB, sumInput] = rule.split(/[\+\=]/);
            let sum = [];
            if (sumInput.indexOf("~") > -1) {
              sum = sumInput.split("~").map(Number);
            } else {
              const n = Number(sumInput);
              sum = [n, n + 1];
            }
            return { indexA: Number(indexA), indexB: Number(indexB), sum };
          })
          .filter((x) => Object.values(x).every((n) => !Number.isNaN(n) && n !== undefined));
        const disjoint = (a: number[], b: number[]): boolean => {
          const sa = arsig(a);
          const sb = arsig(b).split("");
          return sb.every((digit) => sa.indexOf(digit) === -1);
        };
        data[nameA] = data[nameA].filter((groupA) =>
          data[nameB].some((groupB) =>
            relations.every(
              ({ indexA, indexB, sum: target }) =>
                inRange(sum(groupA[indexA]) + sum(groupB[indexB]), target[0], target[1] + 1) && disjoint(groupA[indexA], groupB[indexB])
            )
          )
        );
        data[nameB] = data[nameB].filter((groupB) =>
          data[nameA].some((groupA) =>
            relations.every(
              ({ indexA, indexB, sum: target }) =>
                inRange(sum(groupB[indexB]) + sum(groupA[indexA]), target[0], target[1] + 1) && disjoint(groupA[indexA], groupB[indexB])
            )
          )
        );
        return true;
      }
    }
  } catch (error) {
    console.error("crossRef error", error);
  }
  return false;
};
export const parseAll = debounce((value: string, submit, existingData: Record<string, number[][][]> = {}) => {
  const data: Record<string, number[][][]> = existingData;
  const dataKeysToKeep: string[] = [];
  const lines = value.split("\n");
  const instructions: string[] = [];
  lines
    .filter((line) => line.length > 0)
    .forEach((line) => {
      if (trim(line)[0] === "#") {
        return;
      }
      match(regFormation, line).then(([_, head, strFormation]) => {
        const formations = parse(trim(strFormation), data);
        data[head] = formations;
        dataKeysToKeep.push(head);
      });
      match(regFormationPosition, line).then(([_, position]) => {});
      match(refCrossRef, line).then(() => {
        crossReference(line, data) && instructions.push(line);
      });
    });
  submit(pick(data, dataKeysToKeep), instructions);
}, 500);
