export function throwUnexpectedError(message: string = "Unexpected Error"): never {
  throw new Error(message);
}

export function assertUnreachable(key: never): never {
  throwUnexpectedError(`Unexpected case ${JSON.stringify(key)}`);
}

export function ignoretUnreachable(_key: never): void {}

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

// see https://github.com/microsoft/TypeScript/issues/31501
export type OmitUnion<T, K extends keyof any> = T extends any ? Pick<T, Exclude<keyof T, K>> : never;
