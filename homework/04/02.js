function uniqueSorted(arr) {
    const unique = [...new Set(arr)];
    unique.sort((a, b) => a - b);
    return unique;
  }
  console.log(uniqueSorted([5, 3, 8, 3, 1, 5, 8])); 
