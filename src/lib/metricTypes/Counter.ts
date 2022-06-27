import promClient from "prom-client";

export class Counter {
    private wrapped: promClient.Counter<any>;

    constructor(driver: typeof promClient, private config: promClient.CounterConfiguration<any>) {
        this.wrapped = new driver.Counter(config);
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
