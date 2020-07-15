export interface IIoMeasure {
    (): void;
    getDuration(): number;
}

export interface IComputationMeasure {
    (): void;
    getDuration(): number;
    discountIo(measure: IIoMeasure): void;
}
