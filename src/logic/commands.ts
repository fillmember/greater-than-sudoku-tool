import sum from "lodash/sum";
import get from "lodash/get";

export type CompareMode = ">" | "<" | ">=" | "<=";

const compareFunctions: Record<CompareMode, (a: number, b: number) => boolean> = {
  ">": (a, b) => a > b,
  "<": (a, b) => a < b,
  ">=": (a, b) => a >= b,
  "<=": (a, b) => a <= b,
};

export function compareAandB(
  mode: CompareMode,
  data: Record<string, number[][][]>,
  nameA: string,
  indexA: string,
  nameB: string,
  indexB: string
) {
  const compare = compareFunctions[mode];
  if (nameA !== nameB) {
    // algorithm for cases where the sum is considering 2 different lines
    const arrSumA = data[nameA].map((set) => sum(get(set, indexA)));
    const arrSumB = data[nameB].map((set) => sum(get(set, indexB)));
    if (mode === "<" || mode == "<=") {
      const maxSumA = Math.max(...arrSumA);
      const minSumB = Math.min(...arrSumB);
      // any A needs to be smaller than the smallest of B
      data[nameA] = data[nameA].filter((_, index) => compare(arrSumA[index], minSumB));
      // any B needs to be greater than the greatest of A
      data[nameB] = data[nameB].filter((_, index) => compare(maxSumA, arrSumB[index]));
    } else if (mode === ">" || mode === ">=") {
      const minSumA = Math.min(...arrSumA);
      const maxSumB = Math.max(...arrSumB);
      // any B needs to be smaller than the smallest of A
      data[nameB] = data[nameB].filter((_, index) => compare(minSumA, arrSumB[index]));
      // any A needs to be greater than the greatest of B
      data[nameA] = data[nameA].filter((_, index) => compare(arrSumA[index], maxSumB));
    }
  } else {
    // algorithm for cases where the sum is considering within the same line
    data[nameA] = data[nameA].filter((set) => compare(sum(get(set, indexA)), sum(get(set, indexB))));
  }
}
