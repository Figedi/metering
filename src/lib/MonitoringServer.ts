import fastify, { FastifyInstance } from "fastify";

import type { MeteringRecorder } from "./MeteringRecorder";
import type { Loggerlike } from "./types";

type MonioringMiddlewareDependencies = {
    server: FastifyInstance;
    meteringRecorder: MeteringRecorder;
    enableDefaultMetrics?: boolean;
};

const assignMonitoringRoutes = ({
    server,
    meteringRecorder,
    enableDefaultMetrics,
}: MonioringMiddlewareDependencies) => {
    if (enableDefaultMetrics) {
        meteringRecorder.enableDefaultMetrics();
    }

    server.get("/metrics", async () => meteringRecorder.getPrometheusResponse());
};

export class MonitoringServer {
    private BIND_ADDRESS = "0.0.0.0";

    private server?: FastifyInstance;

    constructor(
        private recorder: MeteringRecorder,
        private logger: Loggerlike,
        private enableDefaultMetrics = true,
        private port = 9500,
    ) {}

    public async start(): Promise<void> {
        this.server = fastify();
        assignMonitoringRoutes({
            server: this.server,
            meteringRecorder: this.recorder,
            enableDefaultMetrics: this.enableDefaultMetrics,
        });

        await new Promise<void>((resolve, reject) =>
            this.server!.listen({ port: this.port, host: this.BIND_ADDRESS }, error => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            }),
        );
        this.logger.info(`Monitoring endpoint running at ${this.BIND_ADDRESS}:${this.port}`);
    }

    public async stop(): Promise<void> {
        if (this.server) {
            await this.server.close();
            delete this.server;
        }
    }
}
