import fastifyPlugin from "fastify-plugin";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { Histogram, LabelValues, Registry, Summary } from "prom-client";
import type { IMetricsPluginOptions, IMetricsRouteContextConfig } from "./serverTypes";

// ================================ stolen from https://github.com/SkeLLLa/fastify-metrics until I can register a custom client ================================

interface IConstructiorDeps {
    /** Fastify instance */
    fastify: FastifyInstance;
    /** Metric plugin options */
    options: IMetricsPluginOptions;
}

interface IReqMetrics<T extends string> {
    hist: (labels?: LabelValues<T>) => number;
    sum: (labels?: LabelValues<T>) => void;
}

declare module "fastify" {
    interface FastifyContextConfig extends IMetricsRouteContextConfig {
        /** Override route definition */
        statsId?: string;
        /** Disables metric collection on this route */
        disableMetrics?: boolean;
    }
}

export class FastifyMetrics {
    private static getRouteSlug(args: { method: string; url: string }): string {
        return `[${args.method}] ${args.url}`;
    }

    private readonly metricStorage = new WeakMap<FastifyRequest, IReqMetrics<string>>();
    private readonly routesWhitelist = new Set<string>();
    private readonly methodBlacklist = new Set<string>();

    public readonly register: Registry;

    /** Creates metrics collector instance */
    constructor(private readonly deps: IConstructiorDeps) {
        this.register = this.deps.options.register;

        this.setMethodBlacklist();
        this.setRouteWhitelist();
        this.collectRouteMetrics();
    }

    /** Populates methods blacklist to exclude them from metrics collection */
    private setMethodBlacklist(): void {
        if (this.deps.options.routeMetrics?.enabled === false) {
            return;
        }

        (this.deps.options.routeMetrics?.methodBlacklist ?? ["HEAD", "OPTIONS", "TRACE", "CONNECT"])
            .map(v => v.toUpperCase())
            .forEach(v => this.methodBlacklist.add(v));
    }

    /** Populates routes whitelist if */
    private setRouteWhitelist(): void {
        if (
            this.deps.options.routeMetrics?.enabled === false ||
            this.deps.options.routeMetrics?.registeredRoutesOnly === false
        ) {
            return;
        }

        this.deps.fastify.addHook("onRoute", routeOptions => {
            // routeOptions.method;
            // routeOptions.schema;
            // routeOptions.url; // the complete URL of the route, it will include the prefix if any
            // routeOptions.path; // `url` alias
            // routeOptions.routePath; // the URL of the route without the prefix
            // routeOptions.prefix;

            if (this.deps.options.routeMetrics?.routeBlacklist?.includes(routeOptions.url)) {
                return;
            }

            [routeOptions.method].flat().forEach(method => {
                if (!this.methodBlacklist.has(method)) {
                    this.routesWhitelist.add(
                        FastifyMetrics.getRouteSlug({
                            method,
                            url: routeOptions.url,
                        }),
                    );
                }
            });
        });
    }

    /** Collect per-route metrics */
    private collectRouteMetrics(): void {
        if (this.deps.options.routeMetrics?.enabled === false) {
            return;
        }

        const labelNames = {
            method: this.deps.options.routeMetrics?.overrides?.labels?.method ?? "method",
            status: this.deps.options.routeMetrics?.overrides?.labels?.status ?? "status_code",
            route: this.deps.options.routeMetrics?.overrides?.labels?.route ?? "route",
        };

        const routeHist = new Histogram<string>({
            ...this.deps.options.routeMetrics?.overrides?.histogram,
            name: this.deps.options.routeMetrics?.overrides?.histogram?.name ?? "http_request_duration_seconds",
            help: this.deps.options.routeMetrics?.overrides?.histogram?.help ?? "request duration in seconds",
            labelNames: [labelNames.method, labelNames.route, labelNames.status] as const,
            registers: [this.register],
        });
        const routeSum = new Summary<string>({
            ...this.deps.options.routeMetrics?.overrides?.summary,
            name: this.deps.options.routeMetrics?.overrides?.summary?.name ?? "http_request_summary_seconds",
            help: this.deps.options.routeMetrics?.overrides?.summary?.help ?? "request duration in seconds summary",
            labelNames: [labelNames.method, labelNames.route, labelNames.status] as const,
            registers: [this.register],
        });

        this.deps.fastify
            .addHook("onRequest", (request, _, done) => {
                if (request.context.config.disableMetrics === true || !request.raw.url) {
                    done();
                    return;
                }

                if (this.deps.options.routeMetrics?.registeredRoutesOnly === false) {
                    if (!this.methodBlacklist.has(request.routerMethod ?? request.method)) {
                        this.metricStorage.set(request, {
                            hist: routeHist.startTimer(),
                            sum: routeSum.startTimer(),
                        });
                    }

                    done();
                    return;
                }

                if (
                    this.routesWhitelist.has(
                        FastifyMetrics.getRouteSlug({
                            method: request.routerMethod,
                            url: request.routerPath,
                        }),
                    )
                ) {
                    this.metricStorage.set(request, {
                        hist: routeHist.startTimer(),
                        sum: routeSum.startTimer(),
                    });
                }

                done();
                return;
            })
            .addHook("onResponse", (request, reply, done) => {
                const metrics = this.metricStorage.get(request);
                if (!metrics) {
                    done();
                    return;
                }

                const statusCode =
                    this.deps.options.routeMetrics?.groupStatusCodes === true
                        ? `${Math.floor(reply.statusCode / 100)}xx`
                        : reply.statusCode;
                const route =
                    request.context.config.statsId ??
                    request.routerPath ??
                    this.deps.options.routeMetrics?.invalidRouteGroup ??
                    "__unknown__";
                const method = request.routerMethod ?? request.method;

                const labels = {
                    [labelNames.method]: method,
                    [labelNames.route]: route,
                    [labelNames.status]: statusCode,
                };
                metrics.sum(labels);
                metrics.hist(labels);

                done();
            });
    }
}

export const fastifyMetering = fastifyPlugin<IMetricsPluginOptions>(
    async (fastify: FastifyInstance, options: IMetricsPluginOptions, next: () => void) => {
        new FastifyMetrics({ fastify, options });
        next();
    },
    ">=4.0.0",
);
