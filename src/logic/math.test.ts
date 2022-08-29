import { formation, combination, cartesian, kcombination } from "./math";

describe("combination", () => {
  test("size = 2", () => {
    expect(combination(2, 3)).toEqual([[1, 2]]);
    expect(combination(2, 5)).toEqual([
      [1, 4],
      [2, 3],
    ]);
    expect(combination(2, 10)).toEqual([
      [1, 9],
      [2, 8],
      [3, 7],
      [4, 6],
    ]);
    expect(combination(2, 15)).toEqual([
      [6, 9],
      [7, 8],
    ]);
  });
  test("size = 3 - impossible", () => {
    expect(combination(3, 5)).toEqual([]);
    expect(combination(3, 26)).toEqual([]);
  });
  test("size = 3", () => {
    expect(combination(3, 6)).toEqual([[1, 2, 3]]);
    expect(combination(3, 7)).toEqual([[1, 2, 4]]);
  });
  test("size = 4", () => {
    expect(combination(4, 10)).toEqual([[1, 2, 3, 4]]);
    expect(combination(4, 11)).toEqual([[1, 2, 3, 5]]);
  });
});

describe("kcombination", () => {
  test("size > set size", () => {
    expect(kcombination(4, [1, 2])).toEqual([]);
  });
  test("size = 0", () => {
    expect(kcombination(0, ["a", 2])).toEqual([]);
  });
  test("set size = 0", () => {
    expect(kcombination(1, [])).toEqual([]);
  });
  test("size = 1", () => {
    expect(kcombination(1, ["a", 2, "n"])).toEqual([["a"], [2], ["n"]]);
  });
  test("size = set size", () => {
    expect(kcombination(2, [1, false])).toEqual([[1, false]]);
  });
  test("K 2 SET 3", () => {
    expect(kcombination(2, ["a", "b", "c"])).toEqual([
      ["a", "b"],
      ["a", "c"],
      ["b", "c"],
    ]);
  });
});

describe("cartesian", () => {
  test("3 groups", () => {
    expect(cartesian([1, 2], [3, 4], [5, 6])).toEqual([
      [1, 3, 5],
      [1, 3, 6],
      [1, 4, 5],
      [1, 4, 6],
      [2, 3, 5],
      [2, 3, 6],
      [2, 4, 5],
      [2, 4, 6],
    ]);
  });
  test("element is array", () => {
    expect(cartesian([[1], [2]], [[3], [4]], [[5], [6]])).toEqual([
      [[1], [3], [5]],
      [[1], [3], [6]],
      [[1], [4], [5]],
      [[1], [4], [6]],
      [[2], [3], [5]],
      [[2], [3], [6]],
      [[2], [4], [5]],
      [[2], [4], [6]],
    ]);
  });
});

describe("formation", () => {
  expect(formation(combination(2, 14), combination(2, 15))).toEqual([
    [
      [5, 9],
      [7, 8],
    ],
  ]);
  expect(formation(combination(2, 14), combination(2, 14))).toEqual([
    [
      [5, 9],
      [6, 8],
    ],
    [
      [6, 8],
      [5, 9],
    ],
  ]);
});
