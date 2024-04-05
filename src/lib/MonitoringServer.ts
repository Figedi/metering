import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

import type { MeteringRecorder } from "./MeteringRecorder";
import type { Loggerlike } from "./types";

type MonioringMiddlewareDependencies = {
    server: FastifyInstance;
    meteringRecorder: MeteringRecorder;
    enableDefaultMetrics?: boolean;
    collectExtraMetrics?: () => Promise<string>;
};

const assignMonitoringRoutes = ({
    server,
    meteringRecorder,
    enableDefaultMetrics,
    collectExtraMetrics,
}: MonioringMiddlewareDependencies) => {
    if (enableDefaultMetrics) {
        meteringRecorder.enableDefaultMetrics();
    }

    server.get("/metrics", async (_: FastifyRequest, reply: FastifyReply) => {
        const metrics = await meteringRecorder.getPrometheusResponse();
        if (collectExtraMetrics) {
            const extraMetrics = await collectExtraMetrics();
            return reply.type("text/plain").send(metrics + extraMetrics);
        }
        return reply.type("text/plain").send(metrics);
    });
};

export class MonitoringServer {
    private BIND_ADDRESS = "0.0.0.0";

    private server?: FastifyInstance;

    constructor(
        private recorder: MeteringRecorder,
        private logger: Loggerlike,
        private enableDefaultMetrics = true,
        private port = 9500,
        private collectExtraMetrics: () => Promise<string>,
    ) {}

    public async start(): Promise<void> {
        this.server = fastify();
        assignMonitoringRoutes({
            server: this.server,
            meteringRecorder: this.recorder,
            enableDefaultMetrics: this.enableDefaultMetrics,
            collectExtraMetrics: this.collectExtraMetrics,
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
