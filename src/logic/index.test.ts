import { row, column, block } from ".";
describe("Logic", () => {
  test("fn column", () => {
    for (let i = 0; i < 9; i++) {
      expect(column(9 * i + 0)).toBe(0);
      expect(column(9 * i + 1)).toBe(1);
      expect(column(9 * i + 2)).toBe(2);
      expect(column(9 * i + 3)).toBe(3);
      expect(column(9 * i + 4)).toBe(4);
      expect(column(9 * i + 5)).toBe(5);
      expect(column(9 * i + 6)).toBe(6);
      expect(column(9 * i + 7)).toBe(7);
      expect(column(9 * i + 8)).toBe(8);
    }
  });
  test("fn row", () => {
    for (let i = 0; i < 9; i++) {
      expect(row(9 * i + 0)).toBe(i);
      expect(row(9 * i + 1)).toBe(i);
      expect(row(9 * i + 2)).toBe(i);
      expect(row(9 * i + 3)).toBe(i);
      expect(row(9 * i + 4)).toBe(i);
      expect(row(9 * i + 5)).toBe(i);
      expect(row(9 * i + 6)).toBe(i);
      expect(row(9 * i + 7)).toBe(i);
      expect(row(9 * i + 8)).toBe(i);
    }
  });
  test("fn block", () => {
    expect(block(0)).toBe(0);
    expect(block(1)).toBe(0);
    expect(block(2)).toBe(0);
    expect(block(3)).toBe(1);
    expect(block(4)).toBe(1);
    expect(block(5)).toBe(1);
    expect(block(6)).toBe(2);
    expect(block(7)).toBe(2);
    expect(block(8)).toBe(2);
    //
    expect(block(9 + 0)).toBe(0);
    expect(block(9 + 1)).toBe(0);
    expect(block(9 + 2)).toBe(0);
    expect(block(9 + 3)).toBe(1);
    expect(block(9 + 4)).toBe(1);
    expect(block(9 + 5)).toBe(1);
    expect(block(9 + 6)).toBe(2);
    expect(block(9 + 7)).toBe(2);
    expect(block(9 + 8)).toBe(2);
    //
    expect(block(9 + 9 + 0)).toBe(0);
    expect(block(9 + 9 + 1)).toBe(0);
    expect(block(9 + 9 + 2)).toBe(0);
    expect(block(9 + 9 + 3)).toBe(1);
    expect(block(9 + 9 + 4)).toBe(1);
    expect(block(9 + 9 + 5)).toBe(1);
    expect(block(9 + 9 + 6)).toBe(2);
    expect(block(9 + 9 + 7)).toBe(2);
    expect(block(9 + 9 + 8)).toBe(2);
    //
    expect(block(9 + 9 + 9 + 0)).toBe(3 + 0);
    expect(block(9 + 9 + 9 + 1)).toBe(3 + 0);
    expect(block(9 + 9 + 9 + 2)).toBe(3 + 0);
    expect(block(9 + 9 + 9 + 3)).toBe(3 + 1);
    expect(block(9 + 9 + 9 + 4)).toBe(3 + 1);
    expect(block(9 + 9 + 9 + 5)).toBe(3 + 1);
    expect(block(9 + 9 + 9 + 6)).toBe(3 + 2);
    expect(block(9 + 9 + 9 + 7)).toBe(3 + 2);
    expect(block(9 + 9 + 9 + 8)).toBe(3 + 2);
  });
});
