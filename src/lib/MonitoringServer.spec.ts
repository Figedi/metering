import { expect } from "chai";
import Koa from "koa";
import request from "request-promise-native";
import { stub } from "sinon";
import { MonitoringServer } from "./MonitoringServer";
import { MeteringRecorder } from "./MeteringRecorder";
import { MonitoringService } from "./monitoringService/MonitoringService";

describe("MonitoringServer", async () => {
    const REQUEST_TIMEOUT = 50;
    const METRICS_ENDPOINT_URL = "http://127.0.0.1:9500/metrics";
    const STATUS_ENDPOINT_URL = "http://127.0.0.1:9500/status";
    let monitoringServer: MonitoringServer;
    let meteringRecorder: MeteringRecorder;
    let monitoringService: MonitoringService;
    let logger;

    const assertEndpointDown = async () => {
        try {
            // tslint:disable-next-line:await-promise
            await request({ uri: METRICS_ENDPOINT_URL, timeout: REQUEST_TIMEOUT });
        } catch (err) {
            // expects that the connection gets refused or that the connection fails with a timeout
            if (err.message.match(/ECONNREFUSED/) || (err.error.code === "ETIMEDOUT" && err.error.connect === true)) {
                return;
            }
            throw err;
        }
        throw new Error("Endpoint still available at port 9500. It is supposed to be down.");
    };

    const assertEndpointUp = async (uri: string) => {
        // tslint:disable-next-line:await-promise
        const result = await request({ uri, timeout: REQUEST_TIMEOUT });
        expect(result).to.be.a("string");
        expect(result.length).to.be.greaterThan(0);
    };

    beforeEach(async () => {
        logger = {
            info: stub(),
            error: stub(),
            trace: stub(),
            debug: stub(),
        };
        meteringRecorder = new MeteringRecorder();
        monitoringService = new MonitoringService();
        monitoringServer = new MonitoringServer(meteringRecorder, monitoringService, logger);
        await monitoringServer.start();
    });

    afterEach(async () => {
        await monitoringServer.stop();
    });

    it("should expose the HTTP route /metrics on port 9500", () => assertEndpointUp(METRICS_ENDPOINT_URL));
    it("should expose the HTTP route /status on port 9500", () => assertEndpointUp(STATUS_ENDPOINT_URL));
    it("should not conflict with other koa instances when starting a server", async () => {
        const app = new Koa();
        app.use(async (ctx, next) => {
            if (ctx.path !== "/something") {
                return next();
            }
            ctx.body = "something";
        });
        const server = app.listen(3000, "localhost");
        await assertEndpointUp("http://localhost:3000/something");
        await assertEndpointUp(METRICS_ENDPOINT_URL);
        server.close();
    });

    it("should shut down the HTTP endpoint", async () => {
        await monitoringServer.stop();
        await assertEndpointDown();
    });

    it("should allow calling shutdown multiple times", async () => {
        await monitoringServer.stop();
        await assertEndpointDown();
    });

    it("should return metrics recorded with MeteringRecorder", async () => {
        meteringRecorder
            .createCounter("testMetric", "this is a test metric", ["label1", "label2"])
            .inc({ label1: "foo", label2: "bar" }, 1);
        // tslint:disable-next-line:await-promise
        expect(await request(METRICS_ENDPOINT_URL)).to.contain("testMetric");
    });
});
