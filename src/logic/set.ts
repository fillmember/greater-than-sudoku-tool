import intersectionBy from "lodash/intersectionBy";
import identity from "lodash/identity";
import memoize from "lodash/memoize";

export function arsig<T = unknown>(arr: T[]): string {
  return arr.map(identity).sort().join("");
}
export const memoArsig = memoize(arsig, (a) => a.join(""));
export function equalSet<T = unknown>(a: T[], b: T[]) {
  return arsig(a) === arsig(b);
}
export function intersect<T = unknown>(a: T[], b: T[]) {
  return intersectionBy(a, b, arsig);
}
