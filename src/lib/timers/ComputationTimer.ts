import { snakeCase } from "lodash";
import { MeteringRecorder } from "../MeteringRecorder";
import { Histogram } from "../metricTypes/Histogram";
import { IIoMeasure, IComputationMeasure } from "./types";

export class ComputationTimer {
    private histograms: Record<string, Histogram> = {};

    constructor(private recorder: MeteringRecorder) {}

    public create(subservice: string, operation: string, description: string, buckets: number[]): IComputationMeasure {
        const name = snakeCase(`${subservice}__computation_${operation}`);
        if (!this.histograms[name]) {
            this.histograms[name] = this.recorder.createHistogram(name, description, ["with_io"], buckets);
        }
        const start = new Date().getTime();
        let duration: number | null = null;
        let ioDiscount = 0;

        return Object.assign(
            () => {
                if (duration) {
                    throw new Error(`Can take measure for ${operation} only once`);
                }
                duration = new Date().getTime() - start;
                this.histograms[name].observe({ with_io: "true" }, duration / 1000);
                this.histograms[name].observe({ with_io: "false" }, (duration - ioDiscount) / 1000);
            },
            {
                discountIo: (measure: IIoMeasure) => {
                    ioDiscount -= measure.getDuration();
                },
                getDuration: () => {
                    if (duration === null) {
                        throw new Error(`Can't get duration for ${operation} before calling measure().`);
                    }
                    return duration;
                },
            },
        );
    }
}
