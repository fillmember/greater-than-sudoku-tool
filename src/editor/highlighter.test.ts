/**
 * @jest-environment jsdom
 */

import "jest";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import { configure, id } from ".";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe("monaco highlighter", () => {
  beforeAll(() => {
    configure(monaco);
  });
  test("yee", async () => {
    const content = `#
B2 = 3in2-K(2,12in4)
# mi
C1 = 4in2-K(2,8~16in3)+(3,6,8) # yoyo
R1 = [123,256]-[45,78]
R2 = [123,257]-[45,79]
# INTERSECT R1.0, R2.0
B1 = 6in2
C2 = 7in2
DEDUPE B1.0 C2.0
B9 = 15in2-14~17in3
`;
    //                                     0         1         2
    //                                     0123456789012345678901234
    const result = monaco.editor.tokenize(content, id);
    const json = JSON.stringify(result);
    expect(json).not.toContain("invalid");
  });
});
