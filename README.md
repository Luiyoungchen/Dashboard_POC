# Grafana Observability Project

A local observability setup for an **Express.js application** using **Prometheus** for metrics collection, **Morgan** for HTTP access logging, **Grafana Alloy** for log collection, **Loki** for log storage and querying, and **Grafana** for visualization.

## Current project capabilities

- Express.js application with `/`, `/slow`, and `/metrics` endpoints
- Default Node.js/process metrics exposed using `prom-client`
- Prometheus running inside Docker and scraping Express every 5 seconds
- Grafana running locally on Windows
- Prometheus successfully connected to Grafana
- Morgan writing HTTP access logs to `logs/access.log`
- Grafana Alloy tailing the access-log file
- Loki receiving and returning actual Express log entries
- Log rotation and Loki retention are still pending configuration

---

## Architecture

```text
                         METRICS PIPELINE

┌──────────────────────┐
│      Express.js      │
│        :4000         │
│      /metrics        │
└──────────┬───────────┘
           │ Metrics (every 5 seconds)
           ▼
┌──────────────────────┐
│     Prometheus       │
│        :9090         │
│   Docker container   │
└──────────┬───────────┘
           │ Prometheus data source
           ▼
┌──────────────────────┐
│       Grafana        │
│        :3000         │
│  Windows installation│
└──────────────────────┘


                          LOG PIPELINE

┌──────────────────────┐
│      Express.js      │
│        :4000         │
└──────────┬───────────┘
           │ HTTP request logs
           ▼
┌──────────────────────┐
│        Morgan        │
└──────────┬───────────┘
           │ Appends log entries
           ▼
┌──────────────────────┐
│ logs/access.log      │
└──────────┬───────────┘
           │ Reads log file
           ▼
┌──────────────────────┐
│    Grafana Alloy     │
│        :12345        │
└──────────┬───────────┘
           │ Pushes logs
           ▼
┌──────────────────────┐
│         Loki         │
│        :3100         │
└──────────┬───────────┘
           │ Loki data source
           ▼
┌──────────────────────┐
│       Grafana        │
│        :3000         │
└──────────────────────┘
```

Prometheus and Loki handle different types of observability data:

- **Metrics:** Prometheus collects numerical measurements from Express.
- **Logs:** Morgan writes request logs to a file; Alloy forwards them to Loki.
- **Visualization:** Grafana can query Prometheus for metrics and Loki for logs.

## 1. Technologies Used

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Backend web framework |
| `prom-client` | Exposes Node.js/process metrics in Prometheus format |
| Prometheus | Collects and stores metrics |
| Morgan | Writes HTTP access logs |
| Grafana Alloy | Reads log files and forwards logs to Loki |
| Loki | Stores and queries logs |
| Docker / Docker Compose | Runs Prometheus, Loki, and Alloy in containers |
| Grafana | Visualizes metrics and logs; installed locally on Windows |

---

## 2. Project Structure

The project currently follows this structure. The exact utility filename should match the import used in `index.js`.

```text
Grafana-observibility/
│
├── index.js
├── utils.js
├── package.json
├── package-lock.json
├── logs/
│   └── access.log
├── prometheus/
│   └── prometheus.yml
├── loki/
│   └── loki-config.yml
├── alloy/
│   └── config.alloy
└── docker-compose.yml
```

---

## 3. Initialize the Node.js Project

The project was initialized using:

```bash
npm init -y
```

The project uses CommonJS modules:

```json
"type": "commonjs"
```

---

## 4. Install Express

```bash
npm install express
```

Express is used to create the backend server and define HTTP endpoints.

---

## 5. Install Prometheus Client

```bash
npm install prom-client
```

`prom-client` allows the Express application to expose metrics that Prometheus can scrape.

---

## 6. Install Nodemon

Nodemon was installed as a development dependency:

```bash
npm install --save-dev nodemon
```

The `package.json` scripts are expected to include:

```json
"scripts": {
  "start": "node index.js",
  "dev": "nodemon index.js"
}
```

Start the application with:

```bash
npm start
```

Or run it in development mode:

```bash
npm run dev
```

---

## 7. Express Application

The main application is contained in `index.js` and runs on:

- Application: `http://localhost:4000`
- Metrics endpoint: `http://localhost:4000/metrics`

The main routes are:

| Route | Purpose |
|---|---|
| `/` | Confirms the Express server is running |
| `/slow` | Simulates an operation that takes approximately two seconds |
| `/metrics` | Exposes metrics in Prometheus format |

The `/metrics` endpoint is intended for monitoring software. Its response is plain text rather than a designed web page.

---

## 8. Heavy Task Simulation

The `/slow` endpoint uses a utility function from `utils.js` to simulate a slow operation.

Example implementation:

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

This function intentionally waits approximately **2000 milliseconds**.

Test it by opening:

`http://localhost:4000/slow`

Expected response:

```json
{
  "status": "success",
  "message": "Heavy task completed in 2000 ms"
}
```

---

## 9. Prometheus Metrics

Default Node.js and process metrics are enabled using:

```javascript
const client = require("prom-client");

client.collectDefaultMetrics();
```

The metrics endpoint is:

`http://localhost:4000/metrics`

Example metrics include:

```text
process_cpu_user_seconds_total
process_resident_memory_bytes
nodejs_eventloop_lag_seconds
nodejs_version_info
```

These metrics are consumed by Prometheus. Custom HTTP metrics should be checked at the endpoint after any instrumentation changes.

---

## 10. Prometheus Configuration

The configuration file is `prometheus/prometheus.yml`.

```yaml
global:
  scrape_interval: 5s

scrape_configs:
  - job_name: "express-app"
    static_configs:
      - targets: ["host.docker.internal:4000"]
```

### Scrape interval

```yaml
scrape_interval: 5s
```

Prometheus checks the Express metrics endpoint every five seconds.

---

## 11. Why `host.docker.internal`?

Prometheus runs inside Docker, while Express runs directly on Windows.

Inside a container, `localhost` refers to that container itself. Therefore, `localhost:4000` would point to the Prometheus container, not the Windows-hosted Express application.

The target uses:

```yaml
targets: ["host.docker.internal:4000"]
```

The Compose configuration also includes the host-gateway mapping:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

This allows Prometheus to reach the Express application on the host.

---

## 12. Docker Compose

The `docker-compose.yml` file runs Prometheus, Loki, and Grafana Alloy. Grafana itself remains a local Windows installation.

The Compose file should contain all three services under `services:` and named volumes under the top-level `volumes:` key.

The Prometheus service includes:

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

The current Loki and Alloy services use the configuration files in `loki/` and `alloy/`, respectively.

---

## 13. Start the Observability Services

From the project directory, validate the Compose configuration:

```bash
docker compose config --quiet
```

Start the services:

```bash
docker compose up -d
```

Check running containers:

```bash
docker compose ps
```

The expected observability containers are:

```text
prometheus
loki
alloy
```

---

## 14. Prometheus Web Interface

Prometheus is available at:

`http://localhost:9090`

Open **Status → Targets** or visit:

`http://localhost:9090/targets`

The configured target is `express-app`. Its status should be **UP**, confirming that Prometheus can scrape the Express metrics endpoint.

---

## 15. Grafana

Grafana runs as a **Windows installation**, not as a Docker container.

- URL: `http://localhost:3000`
- Port: `3000`

A second Grafana container previously conflicted with the existing Windows installation because port `3000` was already occupied. The project therefore continues to use the existing Windows installation.

---

## 16. Grafana and Prometheus Connection

Inside Grafana:

1. Open **Connections → Data sources**.
2. Add or select **Prometheus**.
3. Set the server URL to `http://localhost:9090`.
4. Click **Save & test**.

The Prometheus data source was configured and tested successfully.

---

## 17. Application Access Logs with Morgan

Morgan records HTTP requests handled by Express and writes them to:

```text
logs/access.log
```

The logging middleware should be placed after the Express application is created and before route definitions.

Example configuration:

```javascript
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");

const logDirectory = path.join(__dirname, "logs");
fs.mkdirSync(logDirectory, { recursive: true });

const accessLogStream = fs.createWriteStream(
  path.join(logDirectory, "access.log"),
  { flags: "a" }
);

accessLogStream.on("error", (err) => {
  console.error("Access log write error:", err);
});

app.use(morgan("combined", { stream: accessLogStream }));
```

Morgan was installed using:

```bash
npm install morgan
```

The `"a"` flag means **append mode**: new log entries are added to the existing file rather than replacing its contents.

Because Prometheus requests `/metrics` every five seconds, those requests can also appear in the access log.

---

## 18. Loki and Grafana Alloy

### Loki

Loki receives, stores, and queries log entries. Its configuration file is:

```text
loki/loki-config.yml
```

Loki is available at `http://localhost:3100`.

Check readiness at:

`http://localhost:3100/ready`

A healthy service responds with:

```text
ready
```

### Grafana Alloy

Alloy's configuration file is:

```text
alloy/config.alloy
```

The current configuration watches `/var/log/express/*.log`, labels the stream with `job="express"` and `service_name="grafana-observibility"`, and forwards log entries to:

```text
http://loki:3100/loki/api/v1/push
```

This `loki` hostname is used for communication between containers on the Docker Compose network.

The Compose configuration mounts the local `./logs` directory into Alloy as `/var/log/express` in read-only mode. Alloy's UI is available at:

`http://localhost:12345`

---

## 19. Verify Logs in Loki

To generate fresh entries, visit:

- `http://localhost:4000/`
- `http://localhost:4000/slow`

The Loki labels API is:

`http://localhost:3100/loki/api/v1/labels`

A PowerShell query for recent Express logs:

```powershell
Invoke-RestMethod -Uri 'http://localhost:3100/loki/api/v1/query_range?query=%7Bjob%3D%22express%22%7D&since=1h&limit=20' |
    ConvertTo-Json -Depth 10
```

A successful result contains `status: "success"` and log streams under `data.result`.

The following labels and log source have been verified:

```text
job="express"
service_name="grafana-observibility"
filename="/var/log/express/access.log"
```

The Loki query returned actual HTTP access-log entries, confirming that **Morgan → access.log → Alloy → Loki** is working.

### Add Loki to Grafana

The Loki data source still needs to be confirmed in Grafana:

1. Open `http://localhost:3000`.
2. Go to **Connections → Data sources**.
3. Choose **Add data source → Loki**.
4. Set the URL to `http://localhost:3100`.
5. Click **Save & test**.

Use `localhost` because Grafana runs directly on Windows. The `http://loki:3100` address is for other containers on the Docker network.

---

## 20. Important: Log Growth and Retention

The access-log file currently uses append mode and will continue growing as requests arrive. Over time, an unbounded log file can consume significant disk space.

Recommended next improvements:

1. **Log rotation:** Rotate or archive `access.log` when it reaches a size limit or age threshold.
2. **Loki retention:** Configure how long Loki should keep stored log data.
3. **Optional filtering:** Exclude frequent `/metrics` requests from Morgan logging if they are not useful for troubleshooting.

**Important distinction:** Loki retention does not delete the original `logs/access.log` file. File rotation and Loki retention are separate controls.

Log rotation and Loki retention have **not yet been configured**.

---

## 21. Useful Docker Commands

### Check Docker version

```bash
docker --version
```

### Check Docker Compose version

```bash
docker compose version
```

### Validate Compose configuration

```bash
docker compose config --quiet
```

### Start all configured services

```bash
docker compose up -d
```

### Check running containers

```bash
docker ps
```

### Stop services

```bash
docker compose down
```

This stops and removes the Compose containers and network. Named volumes are not removed unless explicitly requested.

### View service logs

```bash
docker logs prometheus
docker logs loki
docker logs alloy
```

---

## 22. Important Port Configuration

| Component | Port | Runtime |
|---|---:|---|
| Express.js | `4000` | Windows / Node.js |
| Prometheus | `9090` | Docker |
| Loki | `3100` | Docker |
| Grafana Alloy UI | `12345` | Docker |
| Grafana | `3000` | Windows installation |

---

## 23. Troubleshooting

| Issue | Checks |
|---|---|
| Express does not respond | Confirm `npm run dev` is running and open `http://localhost:4000`. |
| Prometheus target is DOWN | Open `http://localhost:4000/metrics`, then inspect `http://localhost:9090/targets`. |
| Loki is not ready | Check `http://localhost:3100/ready` and `docker logs loki`. |
| Loki query returns no entries | Generate requests, inspect `logs/access.log`, and check `docker logs alloy`. |
| Alloy is not collecting logs | Check its UI at `http://localhost:12345`, verify the mounted log path, and inspect `docker logs alloy`. |
| Grafana cannot connect to Loki | Since Grafana runs on Windows, use `http://localhost:3100`. |
| Port `3000` is already in use | Keep using the existing Windows Grafana installation; do not start another Grafana container on the same port. |

---

## 24. Current Status

### Completed and verified

- [x] Node.js project initialized
- [x] Express.js application and `/` endpoint working
- [x] `/slow` test endpoint working
- [x] `prom-client` installed and `/metrics` endpoint working
- [x] Prometheus configuration created
- [x] Prometheus running in Docker
- [x] Express registered as a Prometheus target
- [x] Prometheus target status is `UP`
- [x] Grafana running on Windows
- [x] Prometheus added as a Grafana data source
- [x] Morgan writing access logs to `logs/access.log`
- [x] Loki running and responding as ready
- [x] Alloy tailing the access-log file
- [x] Loki query returning real Express access-log entries

### Remaining work

- [ ] Confirm Loki data source with **Save & test** in Grafana
- [ ] Create Grafana dashboards for metrics and logs
- [ ] Configure access-log rotation
- [ ] Configure Loki retention
- [ ] Continue improving custom HTTP metrics and dashboard panels as needed

---

## 25. Project Goal

The goal is to build a practical application observability stack where application metrics and logs can be collected, stored, queried, and visualized using modern monitoring tools.

**Metrics pipeline:** Express.js → Prometheus → Grafana

**Log pipeline:** Express.js → Morgan → `access.log` → Grafana Alloy → Loki → Grafana

**Future enhancements:** Build dashboards for request rate, latency, error rates, CPU and memory, and application logs; then consider additional instrumentation with OpenTelemetry.
