import { expect } from "chai";
import promClient from "prom-client";

import { MeteringRecorder } from "./MeteringRecorder";

describe("MeteringRecorder", () => {
    let recorder: MeteringRecorder;
    const resetRegistry = () => promClient.register.clear();

    beforeEach(() => {
        recorder = new MeteringRecorder();
        resetRegistry();
    });

    it("should allow creating a histogram and include the data in the formatted string", () => {
        const histogram = recorder.createHistogram("histogram", "histogram", [], [0.2]);
        histogram.observe({}, 1987);
        const result = recorder.getPrometheusResponse();
        expect(result).to.contain("histogram");
        expect(result).to.contain("1987");
    });

    it("should reset a single metric (strict reset)", () => {
        const gauge = recorder.createGauge("gauge", "gauge desc", ["label1", "label2"]);
        gauge.set({ label1: "42" }, 42);
        gauge.set({ label2: "1337" }, 1337);
        gauge.set({ label1: "42", label2: "1337" }, 1379);

        gauge.resetForLabels({ label1: "42" }, true);
        const result = recorder.getPrometheusResponse();
        // label1: 42 has been deleted
        expect(result).to.not.contain(`gauge{label1="42"} 42`);
        expect(result).to.contain(`gauge{label2="1337"} 1337`);
        expect(result).to.contain(`gauge{label1="42",label2="1337"} 1379`);
    });

    it("should reset a single metric (strict reset w/ more labels)", () => {
        const gauge = recorder.createGauge("gauge", "gauge desc", ["label1", "label2", "label3"]);
        gauge.set({ label1: "42" }, 42);
        gauge.set({ label2: "1337" }, 1337);
        gauge.set({ label1: "42", label2: "1337" }, 1379);
        gauge.set({ label1: "42", label2: "1337", label3: "21" }, 1400);

        gauge.resetForLabels({ label1: "42", label2: "1337" }, true);
        const result = recorder.getPrometheusResponse();
        // label1: 42 has been deleted
        expect(result).to.not.contain(`gauge{label1="42",label2="1337"} 1379`);
        expect(result).to.contain(`gauge{label1="42"} 42`);
        expect(result).to.contain(`gauge{label2="1337"} 1337`);
        expect(result).to.contain(`gauge{label1="42",label2="1337",label3="21"} 1400`);
    });

    it("should reset a single metric (loose reset)", () => {
        const gauge = recorder.createGauge("gauge", "gauge desc", ["label1", "label2"]);
        gauge.set({ label1: "42" }, 42);
        gauge.set({ label2: "1337" }, 1337);
        gauge.set({ label1: "42", label2: "1337" }, 1379);

        gauge.resetForLabels({ label1: "42" }, false);
        const result = recorder.getPrometheusResponse();
        // label1: 42 has been deleted
        expect(result).to.not.contain(`gauge{label1="42"} 42`);
        expect(result).to.not.contain(`gauge{label1="42",label2="1337"} 1379`);
        expect(result).to.contain(`gauge{label2="1337"} 1337`);
    });

    it("should reset a single metric (loose reset w/ more labels)", () => {
        const gauge = recorder.createGauge("gauge", "gauge desc", ["label1", "label2", "label3"]);
        gauge.set({ label1: "42" }, 42);
        gauge.set({ label2: "1337" }, 1337);
        gauge.set({ label1: "42", label2: "1337" }, 1379);
        gauge.set({ label1: "42", label2: "1337", label3: "21" }, 1400);

        gauge.resetForLabels({ label1: "42", label2: "1337" }, false);
        const result = recorder.getPrometheusResponse();
        // label1: 42 has been deleted
        expect(result).to.not.contain(`gauge{label1="42",label2="1337"} 1379`);
        expect(result).to.not.contain(`gauge{label1="42",label2="1337",label3="21"} 1400`);
        expect(result).to.contain(`gauge{label1="42"} 42`);
        expect(result).to.contain(`gauge{label2="1337"} 1337`);
    });

    it("should allow creating a gauge and include the data in the formatted string", () => {
        const gauge = recorder.createGauge("gauge", "gauge", []);
        gauge.inc({}, 398);
        const result = recorder.getPrometheusResponse();
        expect(result).to.contain("gauge");
        expect(result).to.contain("398");
    });

    it("should allow creating a counter and include the data in the formatted string", () => {
        const counter = recorder.createCounter("counter", "counter", []);
        counter.inc({}, 425);
        const result = recorder.getPrometheusResponse();
        expect(result).to.contain("counter");
        expect(result).to.contain("425");
    });

    it("should allow creating a summary and include the data in the formatted string", () => {
        const summary = recorder.createSummary("summary", "summary", [], [0.3]);
        summary.observe({}, 6587);
        const result = recorder.getPrometheusResponse();
        expect(result).to.contain("summary");
        expect(result).to.contain("6587");
    });
});
