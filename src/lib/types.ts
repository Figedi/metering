export type Primitive = number | bigint | boolean | string | symbol;

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Loggerlike {
    trace: (...args: any[]) => any;
    debug: (...args: any[]) => any;
    info: (...args: any[]) => any;
    error: (...args: any[]) => any;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
