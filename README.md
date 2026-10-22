# Grafana Observability Project

A basic observability setup for an **Express.js application** using **Prometheus** for metrics collection and **Grafana** for visualization.

This project currently covers:

* Express.js application
* Prometheus metrics using `prom-client`
* Prometheus running inside Docker
* Grafana running locally on Windows
* Prometheus connected to Grafana
* Express application successfully scraped by Prometheus

---

## Architecture

```text
                    ┌──────────────────────┐
                    │      Express.js      │
                    │       :4000          │
                    │                      │
                    │       /metrics       │
                    └──────────┬───────────┘
                               │
                               │ Metrics
                               ▼
                    ┌──────────────────────┐
                    │      Prometheus      │
                    │       :9090          │
                    │       Docker         │
                    └──────────┬───────────┘
                               │
                               │ Prometheus
                               │ Data Source
                               ▼
                    ┌──────────────────────┐
                    │       Grafana        │
                    │       :3000          │
                    │    Windows App       │
                    └──────────────────────┘
```

---

# 1. Technologies Used

| Technology  | Purpose                            |
| ----------- | ---------------------------------- |
| Node.js     | JavaScript runtime                 |
| Express.js  | Backend web framework              |
| prom-client | Exposes Node.js/Prometheus metrics |
| Prometheus  | Collects and stores metrics        |
| Docker      | Runs Prometheus in a container     |
| Grafana     | Visualizes Prometheus metrics      |

---

# 2. Project Structure

Current project structure:

```text
Grafana-observibility/
│
├── index.js
├── utils.js
├── package.json
├── package-lock.json
│
├── prometheus/
│   └── prometheus.yml
│
└── docker-compose.yml
```

---

# 3. Initialize the Node.js Project

The project was initialized using:

```bash
npm init -y
```

The project uses CommonJS modules:

```json
"type": "commonjs"
```

---

# 4. Install Express

Express was installed using:

```bash
npm install express
```

Express is used to create the backend server.

---

# 5. Install Prometheus Client

The Prometheus Node.js client was installed using:

```bash
npm install prom-client
```

`prom-client` allows the Express application to expose metrics that Prometheus can scrape.

---

# 6. Install Nodemon

Nodemon was installed as a development dependency:

```bash
npm install --save-dev nodemon
```

The `package.json` contains:

```json
"scripts": {
  "start": "node index.js",
  "dev": "nodemon index.js"
}
```

The application can therefore be started using:

```bash
npm start
```

or during development:

```bash
npm run dev
```

---

# 7. Express Application

The main application is contained in:

```text
index.js
```

The application runs on:

```text
http://localhost:4000
```

Current implementation:

```javascript
const express = require("express");
const { doSomeHeavyTask } = require("./utils");
const client = require("prom-client");

const app = express();
const PORT = 4000;

client.collectDefaultMetrics();

app.get("/", (req, res) => {
    res.json({
        message: "Express server is running own by Angamba"
    });
});

app.get("/slow", async (req, res) => {
    try {
        const timeTaken = await doSomeHeavyTask();

        return res.json({
            status: "success",
            message: `Heavy task completed in ${timeTaken} ms`
        });
    } catch (err) {
        return res.status(500).json({
            status: "error",
            error: "Internal server error"
        });
    }
});

app.get("/metrics", async (req, res) => {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:4000`);
});
```

---

# 8. Heavy Task Simulation

The `/slow` endpoint uses a utility function from:

```text
utils.js
```

Current implementation:

```javascript
const doSomeHeavyTask = () => {
    return new Promise((resolve) => {
        const time = 2000;

        setTimeout(() => {
            resolve(time);
        }, time);
    });
};

module.exports = {
    doSomeHeavyTask
};
```

The function intentionally waits approximately **2000 milliseconds** to simulate a slow operation.

Request:

```text
GET http://localhost:4000/slow
```

Response:

```json
{
  "status": "success",
  "message": "Heavy task completed in 2000 ms"
}
```

---

# 9. Prometheus Metrics

The application uses:

```javascript
const client = require("prom-client");
```

Default Node.js/process metrics are enabled using:

```javascript
client.collectDefaultMetrics();
```

The application exposes the metrics through:

```text
GET /metrics
```

URL:

```text
http://localhost:4000/metrics
```

The endpoint returns Prometheus-compatible metrics such as:

```text
process_cpu_user_seconds_total
process_resident_memory_bytes
nodejs_eventloop_lag_seconds
nodejs_version_info
```

These metrics are consumed by Prometheus.

---

# 10. Prometheus Configuration

The Prometheus configuration is located at:

```text
prometheus/prometheus.yml
```

Current configuration:

```yaml
global:
  scrape_interval: 5s

scrape_configs:
  - job_name: "express-app"
    static_configs:
      - targets: ["host.docker.internal:4000"]
```

## Scrape Interval

```yaml
scrape_interval: 5s
```

Prometheus checks the Express application's `/metrics` endpoint every 5 seconds.

---

# 11. Why `host.docker.internal`?

Prometheus is running inside Docker, while Express is running directly on Windows.

The architecture is:

```text
Windows Host
│
├── Express
│    └── localhost:4000
│
└── Docker
     └── Prometheus
          └── :9090
```

Inside a Docker container, `localhost` refers to the container itself.

Therefore, this would not work:

```yaml
targets: ["localhost:4000"]
```

Instead:

```yaml
targets: ["host.docker.internal:4000"]
```

allows the Prometheus container to access the Express application running on the Windows host.

---

# 12. Docker Compose

The project contains:

```text
docker-compose.yml
```

Current configuration:

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

---

# 13. Start Prometheus

From the project directory:

```bash
docker compose up -d
```

Prometheus is started as a Docker container.

Check running containers:

```bash
docker ps
```

Expected output includes:

```text
prometheus
```

with:

```text
0.0.0.0:9090->9090/tcp
```

---

# 14. Prometheus Web Interface

Prometheus is available at:

```text
http://localhost:9090
```

The Prometheus target was checked under:

```text
Status → Targets
```

The configured target:

```text
express-app
```

shows:

```text
UP
```

This confirms that Prometheus is successfully collecting metrics from the Express application.

---

# 15. Grafana

Grafana is running as a **Windows installation**, not as a Docker container.

Grafana uses port:

```text
3000
```

It is available at:

```text
http://localhost:3000
```

The running process was verified using:

```bash
netstat -ano | findstr :3000
```

The process was identified using:

```bash
tasklist /FI "PID eq 5740"
```

which showed:

```text
grafana.exe
```

Therefore, a second Grafana container was not required.

---

# 16. Grafana and Prometheus Connection

Inside Grafana:

```text
Connections
    ↓
Data Sources
    ↓
Add new data source
    ↓
Prometheus
```

The Prometheus server URL was configured as:

```text
http://localhost:9090
```

The connection was tested successfully using:

```text
Save & test
```

Therefore:

```text
Grafana → Prometheus
```

is successfully connected.

---

# 17. Current Observability Pipeline

The current working pipeline is:

```text
                     Metrics
                        │
                        ▼
┌─────────────────────────────────────┐
│            Express.js               │
│                                     │
│  Port: 4000                         │
│                                     │
│  /                                  │
│  /slow                              │
│  /metrics                           │
└──────────────────┬──────────────────┘
                   │
                   │ Prometheus scrape
                   │ Every 5 seconds
                   ▼
┌─────────────────────────────────────┐
│            Prometheus               │
│                                     │
│  Docker Container                   │
│  Port: 9090                         │
└──────────────────┬──────────────────┘
                   │
                   │ Data Source
                   ▼
┌─────────────────────────────────────┐
│             Grafana                 │
│                                     │
│  Windows Installation               │
│  Port: 3000                         │
└─────────────────────────────────────┘
```

---

# 18. Docker Commands

### Check Docker version

```bash
docker --version
```

### Check Docker Compose

```bash
docker compose version
```

### Start services

```bash
docker compose up -d
```

### Check running containers

```bash
docker ps
```

### Stop the Prometheus stack

```bash
docker compose down
```

### View Prometheus logs

```bash
docker logs prometheus
```

---

# 19. Important Port Configuration

| Component  |   Port | Status  |
| ---------- | -----: | ------- |
| Express.js | `4000` | Running |
| Prometheus | `9090` | Docker  |
| Grafana    | `3000` | Windows |

---

# 20. Grafana Docker Port Conflict

A Docker Grafana container was attempted using:

```bash
docker run -d -p 3000:3000 --name=grafana grafana/grafana-oss
```

However, Docker returned:

```text
ports are not available
```

because port `3000` was already being used by the existing Windows Grafana installation.

The existing process was confirmed as:

```text
grafana.exe
```

Therefore, the project currently uses:

```text
Grafana → Windows installation → :3000
```

and:

```text
Prometheus → Docker → :9090
```

There is no need to run a second Grafana instance.

---

# 21. Current Status

The following components are working:

* [x] Node.js project initialized
* [x] Express.js installed
* [x] Express server running
* [x] `/` endpoint working
* [x] `/slow` endpoint working
* [x] `prom-client` installed
* [x] `/metrics` endpoint working
* [x] Prometheus configuration created
* [x] Prometheus running in Docker
* [x] Express registered as a Prometheus target
* [x] Prometheus target status is `UP`
* [x] Grafana running on Windows
* [x] Prometheus added as Grafana data source
* [x] Grafana successfully connected to Prometheus

---

# 22. Next Steps

The current implementation provides basic Node.js/process metrics.

The next stage will be to add **application-level HTTP metrics**, such as:

* HTTP request count
* Requests per second (RPS)
* Request latency
* HTTP status codes
* 4xx/5xx error count
* Endpoint-specific performance
* `/slow` response time
* Application uptime

After that, the observability stack can be extended with:

```text
Express.js
   │
   ├── Prometheus → Metrics
   │
   ├── Loki → Logs
   │
   └── OpenTelemetry → Telemetry/Instrumentation
             │
             ▼
          Grafana
```

The eventual Grafana dashboard can contain panels for:

```text
┌─────────────────────────────────────────┐
│           Application Dashboard         │
├───────────────┬───────────────┬─────────┤
│ Request Rate  │ Error Rate    │ Uptime  │
├───────────────┴───────────────┴─────────┤
│             Request Latency             │
├─────────────────────────────────────────┤
│             CPU / Memory                │
├─────────────────────────────────────────┤
│              Application Logs           │
└─────────────────────────────────────────┘
```

---

## Project Goal

The goal of this project is to build a practical **application observability stack** where application metrics can be collected, stored, queried, and visualized using modern monitoring tools.

Current stage:

**Express.js → Prometheus → Grafana**

Future stage:

**Express.js → Prometheus + Loki + OpenTelemetry → Grafana**
