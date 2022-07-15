import type { HTTPMethods } from "fastify";
import type { HistogramConfiguration, Registry, SummaryConfiguration } from "prom-client";

// ================================ stolen from https://github.com/SkeLLLa/fastify-metrics until I can register a custom client ================================

export interface IMetricsRouteContextConfig {
    /** Override route definition */
    statsId?: string;
    /** Disables metric collection on this route */
    disableMetrics?: boolean;
}

export interface ISummaryOverrides extends Partial<SummaryConfiguration<string>> {
    /**
     * Request duration summary name override
     *
     * @defaultValue `http_request_summary_seconds`
     */
    name?: string;
    /**
     * Request duration summary help override
     *
     * @defaultValue `request duration in seconds summary`
     */
    help?: string;
    /**
     * Request duration percentiles override
     *
     * @defaultValue `[0.5, 0.9, 0.95, 0.99]`
     */
    percentiles?: number[];
}

export interface IHistogramOverrides extends Partial<HistogramConfiguration<string>> {
    /**
     * Request duration histogram name override
     *
     * @defaultValue `http_request_duration_seconds`
     */
    name?: string;
    /**
     * Request duration histogram help override
     *
     * @defaultValue `request duration in seconds`
     */
    help?: string;
    /**
     * Request duration buckets override
     *
     * @defaultValue `[0.05, 0.1, 0.5, 1, 3, 5, 10]`
     */
    buckets?: number[];
}

export interface IRouteLabelsOverrides {
    /**
     * Method name
     *
     * @defaultValue `method`
     */
    method?: string;
    /**
     * Route name
     *
     * @defaultValue `route`
     */
    route?: string;
    /**
     * Status code
     *
     * @defaultValue `status_code`
     */
    status?: string;
}

export interface IRouteMetricsOverrides {
    /** Label Overrides */
    labels?: IRouteLabelsOverrides;

    /** Histogram overrides */
    histogram?: IHistogramOverrides;

    /** Summary overrides */
    summary?: ISummaryOverrides;
}

export interface IRouteMetricsConfig {
    /**
     * Enables collection of fastify routes metrics response time.
     *
     * @defaultValue `false`
     */
    enabled?: boolean;

    /**
     * Collect metrics only for registered routes. If `false`, then metrics for
     * unknown routes `/unknown-unregistered-route` will be collected as well.
     *
     * @defaultValue `true`
     */
    registeredRoutesOnly?: boolean;

    /**
     * Groups status code labels by first digit 200 becomes 2XX in metrics.
     *
     * @defaultValue `false`
     */
    groupStatusCodes?: boolean;

    /**
     * A list of routes that will be excluded from metrics collection.
     *
     * @defaultValue `undefined`
     */
    routeBlacklist?: readonly string[];

    /**
     * A list of HTTP methods that will be excluded from metrics collection
     *
     * @defaultValue `['HEAD', 'OPTIONS', 'TRACE', 'CONNECT']`
     */
    methodBlacklist?: readonly HTTPMethods[];

    /**
     * Unknown route label. If registeredRoutesOnly routes set to `false` unknown
     * routes will have following url.
     *
     * @defaultValue `__unknown__`
     */
    invalidRouteGroup?: string;

    /** Metric configuration overrides */
    overrides?: IRouteMetricsOverrides;
}

export interface IMetricsPluginOptions {
    register: Registry;

    /**
     * Per route metrics config. Collect response time metric on requests
     *
     * @defaultValue `{ enabled: true }`
     */
    routeMetrics?: IRouteMetricsConfig;
}
