export const regFormation = /^([A-Z]\d)\s?=\s?([^<#]+)/;
export const regFormationPosition = /<\s?(.+)/;
export const refCrossRef = /^INTERSECT|SEE|SUM|A<B|A>B|A<=B|A=B|A>=B|BORDER|A_HAS_B|A_IN_B|FN/;
export const regSum = /^([\d\~\,]+)\s?in\s?(\d+)/;
export const regInclude = /\+\(([\d,]+)\)/;
export const regExclude = /\!\(([\d,]+)\)/;
export const regOutsideInclude = /oi\(([\d,]+)\)/;
export const regOutsideExclude = /ox\(([\d,]+)\)/;
export const regSingle = /^(\d+)$/; // 3
export const regAnyLiteral = /^(\.+)/; // ...
export const regCombinationLiteral = /^\((\d+)\)$/; // (123)
export const regFormationLiteral = /^\[[\d,]+\]$/; // [12,13,14]
export const regKCombination = /^K\(\s?(\d)\s?,(.+?)\)/;
export const regREF = /^REF\((.+)\)/;

export function match(regexp: RegExp, string: string) {
  const result = string?.match(regexp);
  return {
    matched: !!result,
    result: result as RegExpMatchArray,
    then(fn: (result: RegExpMatchArray) => any) {
      if (!!result) {
        return fn(result);
      }
      return null;
    },
  };
}
