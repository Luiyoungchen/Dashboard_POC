const express = require("express");
const { doSomeHeavyTask } = require("./util");
const client = require("prom-client");

const app = express();
const PORT = 4000;

client.collectDefaultMetrics();
// const reqResTime = new client.Histogram({
//     name: "http_request_duration_seconds",
//     help: "Duration of HTTP requests in seconds",
// });



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