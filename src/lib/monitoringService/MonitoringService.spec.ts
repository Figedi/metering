import { expect } from "chai";
import { MonitoringService } from "./MonitoringService";

describe("MonitoringService", () => {
    let monitoringService: MonitoringService;
    const status = {
        pending: "PENDING",
        failing: "FAULTED",
        ready: "READY",
    };

    beforeEach(() => {
        monitoringService = new MonitoringService();
    });

    it("should return a section if exists", () => {
        monitoringService.addSection("magicWound");
        expect(monitoringService.getResponse().services).to.haveOwnProperty("magicWound");
    });

    it("should fail when fetching a non existent section", () => {
        expect(() => monitoringService.getSection("noSection")).to.throw("Section noSection has not been defined");
    });

    it("should add new metadata to a section", () => {
        const section = monitoringService
            .addSection("section")
            .getSection("section")
            .addMetadata({ shouldDelay: 30, someOtherValue: "string" }).json;
        expect(section.metadata).deep.equal({ shouldDelay: 30, someOtherValue: "string" });
    });

    it("should change status to FAULTED on signalFailing", () => {
        monitoringService.addSection("section").getSection("section").signalFailing();
        expect(monitoringService.getStatus()).to.equal(status.failing);
    });

    it("should change status to PENDING on signalPending", () => {
        monitoringService.addSection("section").getSection("section").signalFailing().signalPending();
        expect(monitoringService.getStatus()).to.equal(status.pending);
    });

    it("should change status to READY on signalReady", () => {
        monitoringService.addSection("section").getSection("section").signalReady();
        expect(monitoringService.getStatus()).to.equal(status.ready);
    });

    it("should return status code 200 when status is READY", () => {
        monitoringService.addSection("database").getSection("database").signalReady();
        expect(monitoringService.getStatusCode()).to.equal(200);
    });

    it("should return status code 500 when status is PENDING", () => {
        monitoringService.addSection("database").getSection("database").signalPending();
        expect(monitoringService.getStatusCode()).to.equal(503);
    });

    it("should return status code 500 when status is FAULTED", () => {
        monitoringService.addSection("database").getSection("database").signalFailing();
        expect(monitoringService.getStatusCode()).to.equal(500);
    });

    it("should always return a response with statusCode and services status", () => {
        monitoringService.addSection("database").addSection("sockets").getSection("sockets").signalFailing();
        expect(monitoringService.getResponse()).to.deep.equal({
            services: {
                database: { status: status.pending, metadata: {} },
                sockets: { status: status.failing, metadata: {} },
            },
            statusCode: 500,
        });
    });
});
