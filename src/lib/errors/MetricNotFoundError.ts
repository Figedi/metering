import { BaseError } from "make-error";

export class MetricNotFoundError extends BaseError {
    constructor(public metricName: string) {
        super(`Could not find metric-name ${metricName}`);
    }
}
