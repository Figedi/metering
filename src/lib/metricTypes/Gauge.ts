import promClient from "prom-client";

import { difference, partition } from "lodash";
import { MetricNotFoundError } from "../errors/MetricNotFoundError";

export interface IMetricValue {
    value: number;
    timestamp?: number;
    labels: Record<string, string>;
}

export class Gauge {
    private wrapped: promClient.Gauge<any>;

    constructor(driver: typeof promClient, private config: promClient.GaugeConfiguration<any>) {
        this.wrapped = new driver.Gauge(config);
    }

    public startTimer(): (labelSet: Record<string, string>) => void {
        const cb = this.wrapped.startTimer();
        return (labelSet: Record<string, string>) => cb(labelSet);
    }

    public inc(labelSet: Record<string, string>, value = 1): void {
        this.wrapped.inc(labelSet, value);
    }

    public dec(labelSet: Record<string, string>, value = 1): void {
        this.wrapped.dec(labelSet, value);
    }

    public set(labelSet: Record<string, string>, value: number): void {
        this.wrapped.set(labelSet, value);
    }

    public setToCurrentTime(labelSet: Record<string, string>): void {
        this.wrapped.setToCurrentTime(labelSet);
    }

    public reset(): void {
        this.wrapped.reset();
    }

    /**
     * You cannot reset a gauge for a specific label-combination. This helper
     * resets all metrics which match a certain dictionary of labels
     * (e.g. reset by { "partnerId": "42" }).
     *
     * Additionally, a loose or a strict check is performed:
     * - The loose-check (strictCheck = false) resets metrics as long as they contain ANY of the
     *   given label-values.
     * - The strict-check (strictCheck = true) resets metrics as long as they contain ALL of the
     *   given label-values
     *
     * Returns the resetted metric-values
     *
     */
    public async resetForLabels(labels: Record<string, string>, strictCheck = true): Promise<IMetricValue[]> {
        const currentMetrics = await promClient.register.getMetricsAsJSON();
        const metric = currentMetrics.find(m => m.name === this.config.name);
        if (!metric) {
            throw new MetricNotFoundError(this.config.name);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const metricValues = (metric as any).values as IMetricValue[];
        const descriptor = (dict: Record<string, string>) =>
            Object.keys(dict)
                .sort()
                .map(labelName => `${labelName}=${dict[labelName]}`);

        const mandatoryDescriptor = descriptor(labels);
        const [resettableMetrics, keepableMetrics] = partition(metricValues, metricValue => {
            if (strictCheck) {
                // metricValue.labels is EXACTLY labels
                return mandatoryDescriptor.join("-") === descriptor(metricValue.labels).join("-");
            }
            // metricValue.labels needs to contain labels
            return difference(mandatoryDescriptor, descriptor(metricValue.labels)).length === 0;
        });

        this.reset();
        keepableMetrics.forEach(m => this.set(m.labels, m.value));

        return resettableMetrics;
    }

    public getName(): string {
        return this.config.name;
    }
}
