import promClient, { Registry } from "prom-client";

import { Gauge, Summary, Histogram, Counter } from "./metricTypes";
import { IoTimer } from "./timers";

export { Registry as PrometheusRegistry } from "prom-client"

export class MeteringRecorder {
    public client!: typeof promClient;
    public register!: Registry;
    private prefix!: string;

    // creates a new MeteringRecorder with an optional registry (e.g. for concurrent setups)
    constructor(prefix: string, registry?: Registry<any>) {
        this.prefix = prefix.endsWith("__") ? prefix : `${prefix}__`;
        this.client = promClient;
        this.register = registry ?? promClient.register;
    }

    public getPrometheusResponse(): Promise<string> {
        return this.register.metrics();
    }

    /**
     * Collects default metrics for node.js. Note when calling this, existing intervals are cleared
     */
    public enableDefaultMetrics(): void {
        this.client.collectDefaultMetrics({ prefix: this.prefix });
    }

    public disableDefaultMetrics(): void {
        this.register.clear();
    }

    public createHistogram(name: string, help: string, labelNames: string[], buckets: number[]): Histogram {
        return new Histogram(this.register, { name: `${this.prefix}${name}`, help, labelNames, buckets });
    }

    public createGauge(name: string, help: string, labelNames: string[]): Gauge {
        return new Gauge(this.register, { name: `${this.prefix}${name}`, help, labelNames });
    }

    public createCounter(name: string, help: string, labelNames: string[]): Counter {
        return new Counter(this.register, { name: `${this.prefix}${name}`, help, labelNames });
    }

    public createSummary(name: string, help: string, labelNames: string[], percentiles: number[]): Summary {
        return new Summary(this.register, { name: `${this.prefix}${name}`, help, labelNames, percentiles });
    }

    public createIoTimer(help: string, labelNames: string[], buckets?: number[]): IoTimer {
        return new IoTimer(this, {
            name: `${this.prefix}common_io_duration_seconds`,
            help,
            labelNames,
            buckets,
        });
    }
}
