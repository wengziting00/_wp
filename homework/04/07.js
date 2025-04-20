class Vector {
    constructor(components) {
      this.components = components;
    }
  
    add(v) {
      return new Vector(this.components.map((n, i) => n + v.components[i]));
    }
  
    sub(v) {
      return new Vector(this.components.map((n, i) => n - v.components[i]));
    }
  
    dot(v) {
      return this.components.reduce((sum, n, i) => sum + n * v.components[i], 0);
    }
  }
