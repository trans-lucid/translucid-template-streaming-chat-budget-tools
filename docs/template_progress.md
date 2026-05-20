# Template Progress

| # | Template | Coverage | Local services | Status | Validation |
| -: | --- | --- | --- | --- | --- |
| 1 | async-webhook-ledger | backend reliability, webhooks, idempotency | Postgres, LocalStack, WireMock, MailHog | golden-template-candidate | remote CI previously accepted |
| 2 | rag-retrieval-quality-lab | AI backend, retrieval, citations | Qdrant, Postgres, MinIO, fake embeddings | golden-template-candidate | remote CI previously accepted |
| 3 | gpu-fault-correlation-drain-scheduler | ML infra, telemetry, scheduling | Prometheus/fake telemetry/LocalStack-style simulator | golden-template-candidate | local/remote validation tracked in repo |
| 4 | streaming-chat-budget-tools | full-stack AI, streaming, tools, budget | fake streaming model and tool simulator | golden-template-candidate | local validation passed; remote CI pending |
