module.exports = (array1, array2) => {
  // eslint-disable-next-line max-len
  const intersection = array1.filter((x) => array2.find((element) => String(element) === String(x)));

  return [...new Set(intersection)];
};
