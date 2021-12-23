import uniq from "lodash/uniq";
export function combination(size: number, sum: number): number[][] {
  if (sum === 0) return [];
  if (size === 1) {
    if (sum > 9) return [];
    return [[sum]];
  }
  const result: number[][] = [];
  const max = Math.min(9, Math.floor(sum / 2));
  for (let i = 1; i <= max; i++) {
    const subCombination = combination(size - 1, sum - i);
    subCombination.forEach((combo) => {
      const combination: number[] = [i, ...combo].sort();
      const stringed = combination.toString();
      const uniqued = uniq(combination);
      if (uniqued.length === combination.length && result.every((item) => item.toString() !== stringed)) {
        result.push(combination);
      }
    });
  }
  return result;
}

function equalSet(a: unknown[], b: unknown[]) {
  return a.sort().toString() === b.sort().toString();
}

export function kcombination<T = unknown>(size: number, set: T[]): T[][] {
  if (size <= 0 || set.length === 0 || size > set.length) return [];
  if (size === set.length) return [set];
  if (size === 1) return set.map((v) => [v]);
  const result: T[][] = [];
  set.forEach((value: T, index: number) => {
    const subset = set.filter((_, i) => i !== index);
    const subcombos = kcombination<T>(size - 1, subset);
    subcombos.forEach((e) => {
      const candidate = [value, ...e];
      if (result.every((existingResult) => !equalSet(candidate, existingResult))) {
        result.push(candidate);
      }
    });
  });
  return result;
}

export function cartesian<T = unknown>(...groups: T[][]): T[][] {
  let result = groups[0].map((v) => [v]);
  for (let i = 1; i < groups.length; i++) {
    result = result.flatMap((currentCombinations) => groups[i].map((groupElement) => [...currentCombinations, groupElement]));
  }
  return result;
}

// formation = deduped cartesian
export function formation(...groups: number[][][]): number[][][] {
  if (groups.length === 0) return [];
  return cartesian(...groups).filter((combination) => {
    const flatten = combination.flat(2);
    return uniq(flatten).length === flatten.length;
  });
}
