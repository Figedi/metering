import { VError } from "verror";

export class MetricNotFoundError extends VError {
    constructor(public metricName: string) {
        super(`Could not find metric-name ${metricName}`);
    }
}
