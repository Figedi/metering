import Koa from "koa";
import { Server } from "http";

import { MeteringRecorder } from "./MeteringRecorder";
import { MonitoringService } from "./monitoringService/MonitoringService";
import { Loggerlike } from "./types";

type MonioringMiddlewareDependencies = {
    meteringRecorder: MeteringRecorder;
    enableDefaultMetrics?: boolean;
    monitoringService: MonitoringService;
};

const createMonitoringMiddleware = ({
    meteringRecorder,
    enableDefaultMetrics,
    monitoringService,
}: MonioringMiddlewareDependencies) => {
    if (enableDefaultMetrics) {
        meteringRecorder.enableDefaultMetrics();
    }

    return async <T>(ctx: Koa.ParameterizedContext, next: () => Promise<T>) => {
        if (ctx.path === "/metrics" && ctx.method === "GET") {
            ctx.body = meteringRecorder.getPrometheusResponse();
        }

        if (ctx.path === "/status" && ctx.method === "GET") {
            ctx.body = monitoringService.getResponse();
            ctx.status = monitoringService.getStatusCode();
        }

        return next();
    };
};

export class MonitoringServer {
    private static BIND_ADDRESS = "0.0.0.0";

    private app?: Koa;
    private server: Server | null;

    constructor(
        private recorder: MeteringRecorder,
        private monitoringService: MonitoringService,
        private logger: Loggerlike,
        private enableDefaultMetrics = true,
        private port = 9500,
    ) {}

    public async start(): Promise<void> {
        this.app = new Koa();

        this.app.use(
            createMonitoringMiddleware({
                meteringRecorder: this.recorder,
                monitoringService: this.monitoringService,
                enableDefaultMetrics: this.enableDefaultMetrics,
            }),
        );
        this.server = this.app.listen(this.port, MonitoringServer.BIND_ADDRESS);
        this.logger.info(`Metering endpoint running at ${MonitoringServer.BIND_ADDRESS}:${this.port}`);
    }

    public async stop(): Promise<void> {
        if (this.server) {
            await new Promise((resolve, reject) => this.server!.close(e => (e ? reject(e) : resolve())));
            this.server = null;
        }
    }
}
