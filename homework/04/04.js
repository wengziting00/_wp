function deepMerge(obj1, obj2) {
    for (const key in obj2) {
      if (
        typeof obj2[key] === 'object' &&
        obj2[key] !== null &&
        typeof obj1[key] === 'object' &&
        obj1[key] !== null
      ) {
        deepMerge(obj1[key], obj2[key]);
      } else {
        obj1[key] = obj2[key];
      }
    }
    return obj1;
  }
