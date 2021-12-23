export const emptyCells = "000000000000000000000000000000000000000000000000000000000000000000000000000000000";
export const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const initialPossibilities = emptyCells.split("").map(() => digits.slice(0));
export function row(index: number): number {
  return Math.floor(index / 9);
}
export function column(index: number): number {
  return index % 9;
}
export function block(index: number): number {
  const x = column(index);
  const y = row(index);
  return Math.floor(y / 3) * 3 + Math.floor(x / 3);
}

export const stringToNumber = (str: string): number[] =>
  str
    .split("")
    .map(Number)
    .filter((v) => !Number.isNaN(v))
    .map((v) => [v]);

export * from "./math";
