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

## Also used

Kronk (llama.cpp in-process, from Ardan Labs):
[https://github.com/ardanlabs/kronk](https://github.com/ardanlabs/kronk)

llama.cpp:
[https://github.com/ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp)

SurrealDB:
[https://surrealdb.com/docs](https://surrealdb.com/docs)

---

## Slides

The deck is in `presentation/`, built the same way as the Container Days London deck.

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
