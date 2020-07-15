import { IComputationMeasure, IIoMeasure } from "./types";
import { MeteringRecorder } from "../MeteringRecorder";
import { Histogram } from "../metricTypes/Histogram";

export class IoTimer {
    private histogram: Histogram;

    constructor(recorder: MeteringRecorder, labels: string[] = [], buckets: number[]) {
        this.histogram = recorder.createHistogram(
            "common__io_duration_seconds",
            "Time taken for an IO operation",
            ["counterpart", "operation", ...labels],
            buckets,
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
        block: () => Promise<T>,
    ): Promise<T> {
        const ioMeasure = this.create(counterpart, operation, labelSet);
        let blockResult: T;
        try {
            blockResult = await block();

            ioMeasure();
            if (compMeasure) {
                compMeasure.discountIo(ioMeasure);
            }
            return blockResult;
        } catch (error) {
            ioMeasure();
            if (compMeasure) {
                compMeasure.discountIo(ioMeasure);
            }
            throw error;
        }
    }
}
