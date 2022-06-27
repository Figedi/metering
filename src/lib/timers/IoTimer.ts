import { IComputationMeasure, IIoMeasure } from "./types";
import { MeteringRecorder } from "../MeteringRecorder";
import { Histogram } from "../metricTypes/Histogram";
import { HistogramConfiguration } from "prom-client";

export class IoTimer {
    private histogram: Histogram;

    constructor(recorder: MeteringRecorder, config: Partial<HistogramConfiguration<any>>) {
        this.histogram = recorder.createHistogram(
            config.name!,
            config.help!,
            ["counterpart", "operation", ...(config.labelNames ?? [])],
            config.buckets ?? [],
        );
    }

    public create(counterpart: string, operation: string, labelSet: Record<string, string>): IIoMeasure {
        const start = new Date().getTime();
        let duration: number | null = null;

        return Object.assign(
            () => {
                if (duration) {
                    throw new Error(`Can take measure for ${counterpart} ${operation} only once`);
                }
                duration = new Date().getTime() - start;
                this.histogram.observe({ counterpart, operation, ...labelSet }, duration / 1000);
            },
            {
                getDuration: () => {
                    if (duration === null) {
                        throw new Error(`Can't get duration for ${counterpart} ${operation} before calling measure().`);
                    }
                    return duration;
                },
            },
        );
    }

    public async take<T>(
        counterpart: string,
        operation: string,
        labelSet: Record<string, string>,
        compMeasure: IComputationMeasure | null,
        promFn: () => Promise<T>,
    ): Promise<T> {
        const ioMeasure = this.create(counterpart, operation, labelSet);
        try {
            const result = await promFn();

            ioMeasure();
            if (compMeasure) {
                compMeasure.discountIo(ioMeasure);
            }
            return result;
        } catch (error) {
            ioMeasure();
            if (compMeasure) {
                compMeasure.discountIo(ioMeasure);
            }
            throw error;
        }
    }
}
