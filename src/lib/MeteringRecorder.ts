import promClient from "prom-client";

import { Gauge, Summary, Histogram, Counter } from "./metricTypes";

const DEFAULT_METRICS_INTERVAL_MS = 5000;

export class MeteringRecorder {
    private defaultMetricsInterval: NodeJS.Timeout;

    public getPrometheusResponse(): string {
        return promClient.register.metrics();
    }

    /**
     * Collects default metrics for node.js. Note when calling this, existing intervals are cleared
     */
    public enableDefaultMetrics(): NodeJS.Timeout {
        if (this.defaultMetricsInterval) {
            return this.defaultMetricsInterval;
        }
        this.defaultMetricsInterval = (promClient.collectDefaultMetrics({
            timeout: DEFAULT_METRICS_INTERVAL_MS,
        }) as unknown) as NodeJS.Timeout;
        return this.defaultMetricsInterval;
    }

    public disableDefaultMetrics(): void {
        clearInterval(this.defaultMetricsInterval ? this.defaultMetricsInterval : this.enableDefaultMetrics());
        delete this.defaultMetricsInterval;
        // Clear the register
        promClient.register.clear();
    }

    public createHistogram(name: string, help: string, labelNames: string[], buckets: number[]): Histogram {
        return new Histogram(promClient, { name, help, labelNames, buckets });
    }

    public createGauge(name: string, help: string, labelNames: string[]): Gauge {
        return new Gauge(promClient, { name, help, labelNames });
    }

    public createCounter(name: string, help: string, labelNames: string[]): Counter {
        return new Counter(promClient, { name, help, labelNames });
    }

    public createSummary(name: string, help: string, labelNames: string[], percentiles: number[]): Summary {
        return new Summary(promClient, { name, help, labelNames, percentiles });
    }
}
