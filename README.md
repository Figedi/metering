# Metering

Prometheus metering module with separate server serving metrics.

## Features

This library is a small wrapper around [prom-client](https://github.com/siimon/prom-client) and provides some extra functionalities:

- Minimal server serving metrics through given endpoint, e.g. for usage in a k8s environment
  - Minimal health-service-like capabilities through user-defined sections
- utilities around IO-timing for summary/histogram metrics

## Usage 

Example using gauge/IOTimer
```typescript
import { MeteringRecorder, IoTimer } from "@figedi/metering"

const recorder = new MeteringRecorder();
const gauge = recorder.createGauge("some-metric-name", "current example-value", ["label_a", "label_b"]);
gauge.set({ label_a: "value-a" }, 42);

const ioTimer = new IoTimer(recorder, ["label_io"], [1, 10, 25, 50, 100, 500, 1000]);

const measure = ioTimer.create("example-svc", "someIoOperation", { "label_io": "value-io" });
// ... async op
measure(); 
```

Example for monitoring-service
```typescript
import { MeteringRecorder, MonitoringServer, MonitoringService } from "@figedi/metering"

const recorder = new MeteringRecorder();
const monitoringService = new MonitoringService().addSection("io")
const monitoringServer = new MonitoringServer(
  recorder,
  monitoringService,
  logger // some pino-like logger
);

// at bootstrap of svc
monitoringServer.start()
// sets some sections, which are exposed via /status, once all sections are signaled-ready, the route returns 200
monitoringService.getSection("io").addMetadata({ ctx: "some-metadata-value" }).signalReady();
// at shutdown of svc
monitoringServer.stop()
```