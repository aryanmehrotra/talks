# Your LLM Is Just Another Datasource (GopherCon India 2026)

## A RAG service in Go that never phones home

The chat model and the embedding model both load inside the process, on llama.cpp. No daemon,
no API key, because there's nowhere to send anything. The model is registered as a GoFr
datasource, so it is still traced, still metered and still answers the health check.

---

## Speaker

**Aryan Mehrotra**

LinkedIn: [https://www.linkedin.com/in/aryanmehrotra](https://www.linkedin.com/in/aryanmehrotra)

X: [https://x.com/_aryanmehrotra](https://x.com/_aryanmehrotra)

GitHub: [https://github.com/aryanmehrotra](https://github.com/aryanmehrotra)

---

## The code

The agent shown in the talk:
[github.com/aryanmehrotra/agents/tree/main/agents/retrieval/local-rag-agent](https://github.com/aryanmehrotra/agents/tree/main/agents/retrieval/local-rag-agent)

| File | What it shows |
|------|---------------|
| `kronk.go` | the custom `ai.Model` around Kronk, the logger adapter, the `kronk.embed` and `kronk.generate` spans |
| `vector.go` | cosine search in SurrealDB, the inlined query vector, the integer-scaled score |
| `main.go` | `app.AddLLM`, `app.AddSurrealDB`, the `/ingest` and `/ask` handlers, the grounding prompt |

Models (GGUF, Q8_0): `unsloth/Qwen3-0.6B-Q8_0.gguf` (639 MB) for chat and
`ggml-org/embeddinggemma-300m-qat-Q8_0.gguf` (329 MB) for embeddings.

---

## GoFr

Repository:
[https://github.com/gofr-dev/gofr](https://github.com/gofr-dev/gofr)

Documentation:
[https://gofr.dev/docs](https://gofr.dev/docs)

The agent is built on GoFr v1.58.0. Embeddings through `c.LLM().Embed` (the `ai.Embedder`
capability, with its own `llm.embed` span and metrics) shipped later, in GoFr v1.60.0
([#3757](https://github.com/gofr-dev/gofr/pull/3757), [#4108](https://github.com/gofr-dev/gofr/pull/4108)).

---

## What this talk uses

Versions are the ones the agent pins in its `go.mod`, unless the row says otherwise.

### The service

| What | Version | Role |
|------|---------|------|
| [Go](https://go.dev) | 1.26.3 | the whole service |
| [GoFr](https://github.com/gofr-dev/gofr) | v1.58.0 | HTTP, datasources, `ctx.LLM()`, tracing, metrics, health |
| [GoFr SurrealDB datasource](https://github.com/gofr-dev/gofr/tree/development/pkg/gofr/datasource/surrealdb) | v0.3.4 | `app.AddSurrealDB`, `c.SurrealDB.Query` |
| [Kronk](https://github.com/ardanlabs/kronk) (Ardan Labs) | v1.29.3 | loads llama.cpp and GGUF models in-process |
| [llama.cpp](https://github.com/ggml-org/llama.cpp) | b10107 (Kronk v1.29.3's pinned default), Metal build on the demo laptop | inference for both models |
| [SurrealDB](https://surrealdb.com/docs) | `surrealdb/surrealdb:latest`, in memory | vector store, cosine search |
| [OpenTelemetry Go](https://github.com/open-telemetry/opentelemetry-go) | v1.44.0 | the hand-added `kronk.embed` / `kronk.generate` spans |

### The models

| Model | File | Size | Licence | Role |
|-------|------|------|---------|------|
| [Qwen3-0.6B](https://huggingface.co/Qwen/Qwen3-0.6B) | `unsloth/Qwen3-0.6B-Q8_0.gguf` | 639 MB | Apache-2.0 | chat |
| [EmbeddingGemma-300M](https://huggingface.co/google/embeddinggemma-300m) (QAT) | `ggml-org/embeddinggemma-300m-qat-Q8_0.gguf` | 329 MB | Gemma Terms of Use | embeddings, 768 dimensions |

### Observability (the live demo)

From the agents repo's [`observability/`](https://github.com/aryanmehrotra/agents/tree/main/observability) folder:

| What | Version | Port | Role |
|------|---------|------|------|
| [Jaeger](https://www.jaegertracing.io) all-in-one | 1.60 | 16686 UI, 4317 OTLP | traces |
| [Prometheus](https://prometheus.io) | `latest` | 9090 | scrapes the agent's `:2132/metrics` |
| [Grafana](https://grafana.com) | `latest` | 3000 | the `llm.json` dashboard |

### The slides

| What | Version | Role |
|------|---------|------|
| [React](https://react.dev) | 19.3.0 | slides as components |
| [Vite](https://vite.dev) | 6.4.3 | dev server and build |
| [TypeScript](https://www.typescriptlang.org) | 5.9.3 | type-checks the deck |
| [Tailwind CSS](https://tailwindcss.com) | Play CDN | utility classes |
| [Inter](https://rsms.me/inter/) | Google Fonts | body text (as on gofr.dev) |
| [Lexend](https://www.lexend.com) | local woff2 from gofr.dev, `ss01` | headings (as on gofr.dev); SIL OFL 1.1, see `presentation/brand/lexend.txt` |
| GoFr brand assets | from [gofr-dev/website](https://github.com/gofr-dev/website) | logo, hero background circuit, glow images, code-window style |

---

## Slides

The deck is in `presentation/`. Its design follows gofr.dev: fonts, colours, code theme and assets
all come from [gofr-dev/website](https://github.com/gofr-dev/website).

```bash
cd presentation
npm install
npm run dev          # http://localhost:5173
```

| Key | Action |
|-----|--------|
| `Space` / `→` / `PageDown` | next step, then next slide |
| `←` / `PageUp` | previous |
| `F` | fullscreen |
| `S` | speaker notes |
| `Home` / `End` | first / last slide |

PDF: open `http://localhost:5173/?print`, then print to PDF with background graphics on. Every
slide renders at its final step, one per page.
