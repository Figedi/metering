import { Primitive } from "../types";

export type SectionContext = { status: string; metadata: Record<string, Primitive> };

export class Section {
    private readonly status = {
        pending: "PENDING",
        failing: "FAULTED",
        ready: "READY",
    };

    constructor(private context: SectionContext) {}

    public addMetadata(metadata: Record<string, Primitive>): Section {
        this.context = { ...this.context, metadata: { ...this.context.metadata, ...metadata } };
        return this;
    }

    public signalFailing(): Section {
        this.context = { ...this.context, status: this.status.failing };
        return this;
    }

    public signalPending(): Section {
        this.context = { ...this.context, status: this.status.pending };
        return this;
    }

    public signalReady(): Section {
        this.context = { ...this.context, status: this.status.ready };
        return this;
    }

    public get json(): SectionContext {
        return this.context;
    }
}
