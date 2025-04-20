function filterArray(arr, predicate) {
    const result = [];
    for (const item of arr) {
      if (predicate(item)) {
        result.push(item);
      }
    }
    return result;
  }
  console.log(filterArray([1, 2, 3, 4, 5], n => n % 2 === 0));
