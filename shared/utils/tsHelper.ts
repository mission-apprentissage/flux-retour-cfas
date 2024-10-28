export function throwUnexpectedError(message: string = "Unexpected Error"): never {
  throw new Error(message);
}

export function assertUnreachable(key: never): never {
  throwUnexpectedError(`Unexpected case ${JSON.stringify(key)}`);
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
