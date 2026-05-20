import http from "node:http";

const port = Number(process.env.PORT ?? 8095);

const metrics = {
  completeCalls: 0,
  streamCalls: 0,
  toolCalls: {
    weather: 0,
    account: 0
  },
  abortedStreams: 0
};

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function json(response, status, payload) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(payload));
}

function writeNdjson(response, payload) {
  response.write(`${JSON.stringify(payload)}\n`);
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/healthz") {
      json(response, 200, { ok: true });
      return;
    }

    if (request.method === "GET" && request.url === "/metrics") {
      json(response, 200, metrics);
      return;
    }

    if (request.method === "POST" && request.url === "/reset") {
      metrics.completeCalls = 0;
      metrics.streamCalls = 0;
      metrics.toolCalls.weather = 0;
      metrics.toolCalls.account = 0;
      metrics.abortedStreams = 0;
      json(response, 200, { ok: true });
      return;
    }

    if (request.method === "POST" && request.url === "/model/complete") {
      metrics.completeCalls += 1;
      const payload = await readJson(request);
      json(response, 200, {
        text: `Blocking answer for: ${payload.message ?? "unknown"}`,
        usageTokens: 88
      });
      return;
    }

    if (request.method === "POST" && request.url === "/model/stream") {
      metrics.streamCalls += 1;
      const payload = await readJson(request);
      response.writeHead(200, { "content-type": "application/x-ndjson" });
      writeNdjson(response, { type: "token", text: "Checking " });
      writeNdjson(response, { type: "token", text: "live context " });
      if (payload.toolName) {
        writeNdjson(response, { type: "tool_call", toolName: payload.toolName, toolCallId: `tool-${payload.toolName}-sim` });
      }
      writeNdjson(response, { type: "token", text: "before answering." });
      writeNdjson(response, { type: "done", usageTokens: 74 });
      response.end();
      return;
    }

    if (request.method === "POST" && request.url?.startsWith("/tools/")) {
      const toolName = request.url.split("/").at(-1);
      const payload = await readJson(request);
      if (toolName === "weather") {
        metrics.toolCalls.weather += 1;
      } else if (toolName === "account") {
        metrics.toolCalls.account += 1;
      }
      if (payload.prompt && String(payload.prompt).includes("malformed")) {
        json(response, 200, { unexpected: true });
        return;
      }
      json(response, 200, {
        summary: `${toolName} result for ${payload.userId ?? "unknown-user"}`,
        evidence: `tool:${toolName}:local-simulator`
      });
      return;
    }

    json(response, 404, { error: "not_found" });
  } catch (error) {
    json(response, 500, { error: String(error instanceof Error ? error.message : error) });
  }
});

server.listen(port, () => {
  console.log(`chat simulator listening on ${port}`);
});

