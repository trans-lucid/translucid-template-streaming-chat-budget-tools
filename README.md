# Streaming Chat Budget + Tool Use

This is an internal Translucid challenge template, not a generated candidate repository.

It creates production-shaped full-stack AI interview challenges where a candidate inherits a non-streaming chat app and must implement streaming response handling, tool-call lifecycle events, abort propagation, token/cost budget enforcement, tool-result caching, and UI state correctness.

The generated candidate repo is intentionally flawed. It should fail public validation for known reasons until the candidate fixes the production path.

## Local Simulator

The candidate repo includes a Docker-backed local simulator:

```txt
chat route -> fake streaming model service -> tool service -> budget/cache/report path
```

No external model providers, cloud services, API keys, or customer data are required.

## Template Commands

```bash
npm ci
npm run validate:solution
npm run validate:candidate-main-expected-failure
npm run render
npm run scan:safety
npm run validate:docker-integration
npm run validate
```

`validate:solution` proves the reference implementation passes public and hidden tests.

`validate:candidate-main-expected-failure` proves the starter fails public unit validation for stable expected markers.

`validate:docker-integration` starts Docker Compose, exercises the fake model/tool simulator through the candidate chat path, confirms the starter fails for expected reasons, and tears the simulator down.

`render` creates `generated/main` and `generated/solution`.

`scan:safety` verifies the rendered candidate main does not leak solution/evaluator/internal material.

## Expected Starter Failures

- `streaming_not_implemented`
- `budget_exceeded_without_guard`
- `tool_cache_miss`
- `stream_abort_not_propagated`
- `malformed_tool_output_crash`

## Public/Private Split

Rendered candidate main contains only candidate-safe files, public tests, public fixtures, and local simulator files.

Hidden tests, evaluator fixtures, rubrics, `SOLUTION.md`, reference solution code, source dossiers, and internal metadata stay in the rendered solution/internal output only.

## For Challenge Creation Agents

Do not infer how to use this template from README prose.

Read `translucid-template.json`.

Normal use:

```bash
make render
make scan-safety
make validate-solution
make validate-candidate-main-expected-failure
make validate-docker-integration
```

Use:

- `generated/main` as candidate-facing main branch
- `generated/solution` as private solution/evaluator branch

Do not manually copy `candidate/` to root.
Do not manually restructure `solution/`.
Do not edit hidden tests or evaluator imports unless a validation command fails and the exact blocker is recorded.

