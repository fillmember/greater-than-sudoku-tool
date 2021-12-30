import { arsig, memoArsig } from "./set";
describe("set", () => {
  describe("arsig", () => {
    test("basic", () => {
      expect(arsig([1, 2, 3])).toBe("123");
      expect(arsig([1, 2, 3])).toBe(arsig([1, 3, 2]));
      expect(arsig([1, 2, 3])).toBe(arsig([3, 2, 1]));
    });
  });
  describe("memo arsig", () => {
    test("cache id", () => {
      memoArsig([1, 2, 3]);
      memoArsig([1, 3, 2]);
      memoArsig([3, 2, 1]);
      expect(memoArsig.cache.has("123")).toBe(true);
      expect(memoArsig.cache.has("132")).toBe(true);
      expect(memoArsig.cache.has("321")).toBe(true);
    });
  });
});
