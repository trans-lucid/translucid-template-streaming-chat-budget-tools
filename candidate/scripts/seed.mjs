const baseUrl = process.env.CHAT_SIMULATOR_URL ?? "http://localhost:8095";

async function waitForSimulator() {
  const deadline = Date.now() + 30_000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/healthz`);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`chat simulator not ready at ${baseUrl}: ${lastError}`);
}

await waitForSimulator();
await fetch(`${baseUrl}/reset`, { method: "POST" });
console.log(`seeded chat simulator at ${baseUrl}`);

