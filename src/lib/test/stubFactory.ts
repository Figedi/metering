import { stub } from "sinon";
import { Counter, Gauge, Histogram, Summary } from "../metricTypes";
import { IIoMeasure, IComputationMeasure } from "../timers/types";
import { IoTimer, ComputationTimer } from "../timers";

function createCounter(): Counter {
    const inc = stub();
    return ({ inc } as unknown) as Counter;
}

function createGauge(): Gauge {
    const inc = stub();
    const startTimer = stub().returns(stub());
    const dec = stub();
    const set = stub();
    const setToCurrentTime = stub();
    return ({ inc, startTimer, dec, set, setToCurrentTime } as unknown) as Gauge;
}

function createHistogram(): Histogram {
    const observe = stub();
    const startTimer = stub().returns(stub());
    const reset = stub();
    return ({ observe, startTimer, reset } as unknown) as Histogram;
}

function createSummary(): Summary {
    const observe = stub();
    const startTimer = stub().returns(stub());
    const reset = stub();
    return ({ observe, startTimer, reset } as unknown) as Summary;
}

function createIoMeasure(): IIoMeasure {
    return Object.assign(stub(), { getDuration: stub() });
}

function createComputationMeasure(): IComputationMeasure {
    return Object.assign(stub(), {
        discountIo: stub(),
        getDuration: stub(),
    });
}

function createIoTimer(alwaysReturnTheSameMeasure = true): IoTimer {
    const measure = createIoMeasure();
    return ({
        create: () => (alwaysReturnTheSameMeasure ? measure : createIoMeasure()),
        take: stub().yields(),
    } as unknown) as IoTimer;
}

function createComputationTimer(alwaysReturnTheSameMeasure = true): ComputationTimer {
    const measure = createComputationMeasure();
    return ({
        create: () => (alwaysReturnTheSameMeasure ? measure : createComputationMeasure()),
    } as unknown) as ComputationTimer;
}

export const MeteringStubFactory = {
    createCounter,
    createGauge,
    createHistogram,
    createSummary,
    createIoMeasure,
    createComputationMeasure,
    createIoTimer,
    createComputationTimer,
};
