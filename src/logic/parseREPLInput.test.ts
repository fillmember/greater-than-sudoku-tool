import { parse, matchFromListSyntax } from ".";

describe("parseREPLInput", () => {
  describe("parse", () => {
    describe("single literal", () => {
      test("basic", () => {
        expect(parse("1-2-3")).toEqual([[[1], [2], [3]]]);
        expect(parse("123")).toEqual([[[1, 2, 3]]]);
      });
    });
    describe("sum/size syntax", () => {
      test("basic", () => {
        expect(parse("12in2")).toEqual([[[3, 9]], [[4, 8]], [[5, 7]]]);
        expect(parse("10in3")).toEqual([[[1, 2, 7]], [[1, 3, 6]], [[1, 4, 5]], [[2, 3, 5]]]);
      });
      test("combo", () => {
        expect(parse("13in2-14in2")).toEqual([
          [
            [4, 9],
            [6, 8],
          ],
          [
            [6, 7],
            [5, 9],
          ],
        ]);
      });
      test("with include & exclude", () => {
        expect(parse("5in2!(1)")).toEqual([[[2, 3]]]);
        expect(parse("5in2+(1)")).toEqual([[[1, 4]]]);
      });
    });
    describe("formation literal", () => {
      test("basic", () => {
        expect(parse("[127,136,145,235]")).toEqual([[[1, 2, 7]], [[1, 3, 6]], [[1, 4, 5]], [[2, 3, 5]]]);
        expect(parse("[127]")).toEqual([[[1, 2, 7]]]);
      });
    });
    describe("any literal", () => {
      test("basic", () => {
        expect(parse(".")).toEqual([[[1]], [[2]], [[3]], [[4]], [[5]], [[6]], [[7]], [[8]], [[9]]]);
      });
      test("include / exclude", () => {
        expect(parse("..+(14)")).toEqual([[[1, 4]]]);
        expect(parse("..!(1,2,3,4,5,6,7)")).toEqual([[[8, 9]]]);
      });
    });
    describe("combination literal", () => {
      test("basic", () => {
        expect(parse("(12)")).toEqual([[[1]], [[2]]]);
        expect(parse("(123456789)")).toEqual([[[1]], [[2]], [[3]], [[4]], [[5]], [[6]], [[7]], [[8]], [[9]]]);
      });
    });
    describe("K Combination", () => {
      test("basic", () => {
        expect(parse("K(2,123)")).toEqual([[[1, 2]], [[1, 3]], [[2, 3]]]);
      });
      test("with include / exclude", () => {
        expect(parse("K(2,123)+(2)")).toEqual([[[1, 2]], [[2, 3]]]);
        expect(parse("K(2,123)!(2)")).toEqual([[[1, 3]]]);
      });
      test("compound", () => {
        expect(parse("K(2, 6in3)")).toEqual([[[1, 2]], [[1, 3]], [[2, 3]]]);
        expect(parse("K(2, 6~7in3)")).toEqual([[[1, 2]], [[1, 3]], [[2, 3]], [[1, 4]], [[2, 4]]]);
        expect(parse("K(1, [123,124])")).toEqual([[[1]], [[2]], [[3]], [[4]]]);
      });
    });
  });
  describe("parseListSyntax", () => {
    test("basic", () => {
      const list1 = [[1], [2], [3], [4]];
      const list2 = [
        [1, 5],
        [2, 5],
        [1, 3],
        [1, 4],
      ];
      expect(matchFromListSyntax("1,2")(list1)).toEqual([0, 1]);
      expect(matchFromListSyntax("1,2")(list2)).toEqual([0, 2, 3, 1]);
      expect(matchFromListSyntax("25")(list2)).toEqual([1]);
    });
  });
});
