// to make the file a module and avoid the TypeScript error
export {};

declare module "next-plausible" {
  /**
   * @deprecated Ne pas utiliser directement, mais plutôt usePlausibleTracking()
   */
  export declare function usePlausible<E extends Events = any>(): <N extends keyof E>(
    eventName: N,
    ...rest: EventOptionsTuple<E[N]>
  ) => any;
}
