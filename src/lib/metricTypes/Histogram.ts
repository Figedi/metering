import { Registry, Histogram as PromHistogram, HistogramConfiguration } from "prom-client";

export class Histogram {
    private wrapped: PromHistogram<any>;

    constructor(registry: Registry, private config: HistogramConfiguration<any>) {
        this.wrapped = new PromHistogram({ ...config, registers: [registry] });
    }

    public observe(labelSet: Record<string, string>, value: number): void {
        this.wrapped.observe(labelSet, value);
    }

    /**
     * Start a timer where the value in seconds will observed
     * @return Function to invoke when timer should be stopped
     */
    public startTimer(): (labelSet: Record<string, string>) => void {
        const cb = this.wrapped.startTimer();
        return (labelSet: Record<string, string>) => cb(labelSet);
    }

    public reset(): void {
        this.wrapped.reset();
    }

    public getName(): string {
        return this.config.name;
    }
}
