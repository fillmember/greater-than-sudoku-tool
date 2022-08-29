/**
 * Combination
 *
 * A possible combination of Cells for a House
 *
 */
export type Combination = number[];
/**
 *
 * House / Combinations
 *
 * 12in2 results in 3 possible combinations: [ [3,9], [4,8], [5,7] ]
 *
 */
export type House = number[][];
/**
 * Formation is Houses that see each other
 */
export type Formation = House[];

export type RecordOfFormations = Record<string, Formation>;
