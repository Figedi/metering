import promClient from "prom-client";

import { Gauge, Summary, Histogram, Counter } from "./metricTypes";
import { IoTimer } from "./timers";

export class MeteringRecorder {
    private prefix!: string;
    constructor(prefix: string) {
        this.prefix = prefix.endsWith("__") ? prefix : `${prefix}__`;
    }

    public getPrometheusResponse(): Promise<string> {
        return promClient.register.metrics();
    }

    /**
     * Collects default metrics for node.js. Note when calling this, existing intervals are cleared
     */
    public enableDefaultMetrics(): void {
        promClient.collectDefaultMetrics({ prefix: this.prefix });
    }

    public disableDefaultMetrics(): void {
        promClient.register.clear();
    }

    public createHistogram(name: string, help: string, labelNames: string[], buckets: number[]): Histogram {
        return new Histogram(promClient, { name: `${this.prefix}${name}`, help, labelNames, buckets });
    }

    public createGauge(name: string, help: string, labelNames: string[]): Gauge {
        return new Gauge(promClient, { name: `${this.prefix}${name}`, help, labelNames });
    }

    public createCounter(name: string, help: string, labelNames: string[]): Counter {
        return new Counter(promClient, { name: `${this.prefix}${name}`, help, labelNames });
    }

    public createSummary(name: string, help: string, labelNames: string[], percentiles: number[]): Summary {
        return new Summary(promClient, { name: `${this.prefix}${name}`, help, labelNames, percentiles });
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
