export const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
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

export function findClosingParenthesis(str: string, startIndex = 0) {
  let index = startIndex;
  let counter = 1;
  while (counter > 0 && index < str.length) {
    index = index + 1;
    const c = str[index];
    if (c === "(") counter++;
    if (c === ")") counter--;
  }
  return index;
}

export * from "./set";
export * from "./math";
export * from "./parse";
