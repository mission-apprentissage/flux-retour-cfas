/**
 * Classe Factory de base
 */
export class BaseFactory {
  constructor(props) {
    Object.entries(props).map(([key, value]) => (this[key] = value));
  }

  // eslint-disable-next-line no-unused-vars
  static create(props) {
    throw new Error("Method 'create()' must be implemented.");
  }
}
