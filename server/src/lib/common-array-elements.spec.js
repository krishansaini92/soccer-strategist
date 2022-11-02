const { describe, it } = require('mocha');
const chai = require('chai');
const commonArrayElements = require('./common-array-elements');

const { expect } = chai;

describe('Lib: CommonArrayElements', () => {
  it('should return common elements of 2 arrays', async () => {
    const array1 = [2, 3, 4];
    const array2 = [1, 2, 3, 4, 5];

    expect(commonArrayElements(array1, array2)).to.deep.equal([2, 3, 4]);
  });
});
