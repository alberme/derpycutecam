/*
Provides an index within the bounds of an array. Useful for
carousel scrolling 
*/
export const wrapIndex = (length: number, index: number) =>
  ((index % length) + length) % length;
