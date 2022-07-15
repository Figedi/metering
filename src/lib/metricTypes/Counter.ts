import { Registry, Counter as PromCounter, CounterConfiguration } from "prom-client";

export class Counter {
    private wrapped: PromCounter<any>;

    constructor(registry: Registry, private config: CounterConfiguration<any>) {
        this.wrapped = new PromCounter({ ...config, registers: [registry] });
    }

    public inc(labelSet: Record<string, string>, value = 1): void {
        this.wrapped.inc(labelSet, value);
    }

    public reset(): void {
        this.wrapped.reset();
    }

    public getName(): string {
        return this.config.name;
    }
}
