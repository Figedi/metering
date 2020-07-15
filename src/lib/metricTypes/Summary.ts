import promClient from "prom-client";

export class Summary {
    private wrapped: promClient.Summary;

    constructor(driver: typeof promClient, private config: promClient.SummaryConfiguration) {
        this.wrapped = new driver.Summary(config);
    }

    public observe(labelSet: Record<string, string>, value: number): void {
        this.wrapped.observe(labelSet, value);
    }

    /**
     * Start a timer where the value in seconds will observed
     * @return Function to invoke when timer should be stopped
     */
    public startTimer(): (labelSet: Record<string, string>) => void {
        const cb = this.wrapped.startTimer();
        return (labelSet: Record<string, string>) => cb(labelSet);
    }

    public reset(): void {
        this.wrapped.reset();
    }

    public getName(): string {
        return this.config.name;
    }
}
