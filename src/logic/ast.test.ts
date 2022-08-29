import { getAST, AstTree } from "./ast";

describe("Crazy AST", () => {
  const testsets: [string, AstTree][] = [
    // functions
    ["mi()", [{ type: "func", name: "mi", params: [], modifiers: [] }]],
    ["mi(2)", [{ type: "func", name: "mi", params: [{ type: "param", value: "2" }], modifiers: [] }]],
    [
      "mi(2,N4.3)",
      [
        {
          type: "func",
          name: "mi",
          params: [
            { type: "param", value: "2" },
            { type: "param", value: "N4.3" },
          ],
          modifiers: [],
        },
      ],
    ],
    [
      "mi(2,N4.3)+(8)",
      [
        {
          type: "func",
          name: "mi",
          params: [
            { type: "param", value: "2" },
            { type: "param", value: "N4.3" },
          ],
          modifiers: [{ type: "modifier", name: "+", value: "8" }],
        },
      ],
    ],
    [
      "mi(2,N4.3)+(8)!(7)",
      [
        {
          type: "func",
          name: "mi",
          params: [
            { type: "param", value: "2" },
            { type: "param", value: "N4.3" },
          ],
          modifiers: [
            { type: "modifier", name: "+", value: "8" },
            { type: "modifier", name: "!", value: "7" },
          ],
        },
      ],
    ],
    // groups
    [
      "1-2-3",
      [
        { type: "param", value: "1" },
        { type: "param", value: "2" },
        { type: "param", value: "3" },
      ],
    ],
    [
      "1-2-(345)",
      [
        { type: "param", value: "1" },
        { type: "param", value: "2" },
        {
          type: "group",
          children: [
            { type: "param", value: "3" },
            { type: "param", value: "4" },
            { type: "param", value: "5" },
          ],
        },
      ],
    ],
    [
      "[34,35]",
      [
        {
          type: "group",
          children: [
            { type: "param", value: "34" },
            { type: "param", value: "35" },
          ],
        },
      ],
    ],
    [
      "K(1,13in2)-15in2-4in2",
      [
        {
          type: "func",
          name: "K",
          params: [
            { type: "param", value: "1" },
            { type: "param", value: "13in2" },
          ],
          modifiers: [],
        },
        {
          type: "param",
          value: "15in2",
        },
        {
          type: "param",
          value: "4in2",
        },
      ],
    ],
    [
      "(123)-15in2",
      [
        {
          type: "group",
          children: [
            { type: "param", value: "1" },
            { type: "param", value: "2" },
            { type: "param", value: "3" },
          ],
        },
        {
          type: "param",
          value: "15in2",
        },
      ],
    ],
    [
      "REF(R4.0,K(1,REF(R4.1))+(457)!(2),B3.2)-18in3",
      [
        {
          type: "func",
          name: "REF",
          params: [
            { type: "param", value: "R4.0" },
            {
              type: "func",
              name: "K",
              modifiers: [
                { type: "modifier", name: "+", value: "457" },
                { type: "modifier", name: "!", value: "2" },
              ],
              params: [
                { type: "param", value: "1" },
                { type: "func", params: [{ type: "param", value: "R4.1" }], modifiers: [], name: "REF" },
              ],
            },
            { type: "param", value: "B3.2" },
          ],
          modifiers: [],
        },
        { type: "param", value: "18in3" },
      ],
    ],
  ];
  testsets.forEach(([input, expected]) => {
    it(`renders ${input}`, () => {
      expect(getAST(input as string)).toStrictEqual(expected);
    });
  });
});
