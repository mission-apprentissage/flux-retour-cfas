export function throwUnexpectedError(): never {
  throw new Error("Unexpected Error");
}

export function assertUnreachable(_key: never): never {
  throwUnexpectedError();
}

type ObjectEntry<T extends object> = { [K in keyof T]: [K, Required<T>[K]] }[keyof T] extends infer E
  ? E extends [infer K, infer V]
    ? K extends string | number
      ? [`${K}`, V]
      : never
    : never
  : never;

export function entries<T extends object>(obj: T): ObjectEntry<T>[] {
  return Object.entries(obj) as ObjectEntry<T>[];
}
