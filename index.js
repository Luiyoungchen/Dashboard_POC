const fs = require("fs");
const path = require("path");
const morgan = require("morgan");

const express = require("express");
const { doSomeHeavyTask } = require("./util");
const client = require("prom-client");

const app = express();
const PORT = 4000;

const logDirectory = path.join(__dirname, "logs");

fs.mkdirSync(logDirectory, { recursive: true });

const accessLogStream = fs.createWriteStream(
    path.join(logDirectory, "access.log"),
    { flags: "a" }
);

accessLogStream.on("error", (err) => {
    console.error("Access log write error:", err);
});

app.use(morgan("combined", {
    stream: accessLogStream
}));

client.collectDefaultMetrics();
// const reqResTime = new client.Histogram({
//     name: "http_request_duration_seconds",
//     help: "Duration of HTTP requests in seconds",
// });

const reqResTime = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.1, 0.5, 1, 1.5, 2, 5],
});
app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const timeTaken = Date.now() - start;
        reqResTime.observe({ method: req.method, route: req.url, status_code: res.statusCode }, timeTaken / 1000);
    });
    next();
});

app.get("/", (req, res) => {
    res.json({
        message: "Express server is running own by Angamba"
    });
});

app.get("/slow", async (req, res) => {
    try{
        const timeTaken = await doSomeHeavyTask();
        return res.json({
            status: "success",
            message: `Heavy task completed in ${timeTaken} ms`
        });
    }catch(err){
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
    console.log(`Server running at http://localhost:${PORT}`);
}); 