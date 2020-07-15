import { Section, SectionContext } from "./Section";

export class MonitoringService {
    private readonly status = {
        pending: "PENDING",
        failing: "FAULTED",
        ready: "READY",
    };

    constructor(private context: { [section: string]: Section } = {}) {}

    public addSection(sectionName: string): MonitoringService {
        this.context = { ...this.context, [sectionName]: new Section({ status: this.status.pending, metadata: {} }) };
        return this;
    }

    public getSection(sectionName: string): Section {
        if (!this.context[sectionName]) {
            throw Error(`Section ${sectionName} has not been defined`);
        }
        return this.context[sectionName];
    }

    public getStatusCode(): number {
        if (this.isStatusReady()) return 200;
        if (this.isStatusFaulty()) return 500;
        return 503;
    }

    public getStatus(): string {
        if (this.isStatusReady()) return this.status.ready;
        if (this.isStatusFaulty()) return this.status.failing;
        return this.status.pending;
    }

    public getResponse(): { services: Record<string, SectionContext>; statusCode: number } {
        const services = Object.keys(this.context).reduce((acc, service) => {
            return { ...acc, [service]: this.context[service].json };
        }, {} as Record<string, SectionContext>);

        if (this.isStatusReady()) return { services, statusCode: 200 };
        if (this.isStatusFaulty()) return { services, statusCode: 500 };
        return { services, statusCode: 503 };
    }

    private isStatusReady(): boolean {
        return Object.values(this.context).every(section => section.json.status === this.status.ready);
    }

    private isStatusFaulty(): boolean {
        return Object.values(this.context).some(section => section.json.status === this.status.failing);
    }
}
