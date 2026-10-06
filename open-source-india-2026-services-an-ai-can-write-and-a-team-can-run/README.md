# Services an AI Can Write and a Team Can Run (Open Source India 2026)

## GoFr in a year when AI writes most of the code

AI assistants write a Go service in seconds and leave out the production parts: tracing,
metrics, health checks, retries, graceful shutdown. This ten-minute talk shows what changes
when the framework owns those parts, so the assistant writes less and the team reviews less.

**GoFr: An Opinionated Go Framework for accelerated microservice development.**

**Live slides:** [https://osi-2026-gofr-deck.zopcloud.zop.dev](https://osi-2026-gofr-deck.zopcloud.zop.dev)

[![Deploy to ZopCloud](https://zop.dev/deploytozopcloud-inkhard.svg)](https://zop.dev/zopday/app/deploy?repo=https://github.com/aryanmehrotra/talks&port=8080&app=zopcloud)

---

## Speaker

**Aryan Mehrotra**

LinkedIn: [https://www.linkedin.com/in/aryanmehrotra](https://www.linkedin.com/in/aryanmehrotra)

X: [https://x.com/_aryanmehrotra](https://x.com/_aryanmehrotra)

GitHub: [https://github.com/aryanmehrotra](https://github.com/aryanmehrotra)

---

## The slides

Open [`slides/index.html`](slides/index.html) in a browser. It is one self-contained file
plus the `brand/` assets, with no build step.

| Key | Action |
|-----|--------|
| `→` `Space` `PageDown`, or click the right two-thirds | next slide |
| `←` `PageUp`, or click the left third | previous slide |
| `Home` / `End` | first / last slide |

The repository root carries a `Dockerfile` that serves these slides with nginx on port 8080;
the button above deploys it to your own ZopCloud account.

Print to PDF from the browser for a 1920x1080 page per slide. Speaker notes are in each
slide's `<aside>` element in the source.

| # | Slide | What it carries |
|---|-------|-----------------|
| 1 | Cover | Services an AI can write and a team can run |
| 2 | AI already writes the code | 75% at Google, 84% of developers, 53% of Go developers daily |
| 3 | The bill arrives after the merge | 56% pass security tests, 5x review time, 3x incidents per PR |
| 4 | The idea | Put the production parts in the framework |
| 5 | One handler shape, the rest included | 13 lines of code, and what `gofr.New()` adds |
| 6 | The LLM is one more datasource | `app.AddLLM`, traced, metered, health-checked |
| 7 | One line makes your API agent tools | `app.EnableMCP()` and its safety defaults |
| 8 | Live demo | One service, three requests |
| 9 | What a team gets back | Review load, incidents, AI spend, integrations, lock-in |
| 10 | Everything in the box | The feature map to take away |
| 11 | Start tonight | Where to begin |

---

## The demo

The service on stage is [`examples/using-ai`](https://github.com/gofr-dev/gofr/tree/main/examples/using-ai)
from the GoFr repository: one inventory endpoint, one `/ask` endpoint, `app.AddLLM` and
`app.EnableMCP`.

```bash
curl localhost:8000/inventory/A1                          # a trace and a metric appear
curl -X POST localhost:8000/ask -d '{"prompt":"..."}'     # the LLM call is a span, tokens counted
# then point an MCP client at localhost:8200              # the agent finds /inventory as a tool
```

Metrics are at `localhost:2121/metrics`. The LLM key is read from `LLM_API_KEY`.

---

## Sources for the numbers

| Claim | Source |
|-------|--------|
| 75% of Google's new code is AI-generated | [Semafor, 24 Apr 2026](https://www.semafor.com/article/04/24/2026/google-ceo-says-75-of-companys-new-code-is-ai-generated) |
| 84% of developers use or plan to use AI tools; 46% distrust its accuracy | [Stack Overflow Developer Survey 2025](https://survey.stackoverflow.co/2025/ai) |
| 53% of Go developers use AI tools daily | [Go Developer Survey 2025](https://go.dev/blog/survey2025) |
| 56% of AI-written code passes security tests | [Veracode 2026 GenAI Code Security Report](https://www.veracode.com/news/llms-are-getting-smarter-but-not-safer-veracode-2026-genai-code-security-report-finds-ai-generated-code-security-has-stalled-at-56%25-pass-rate/) |
| 5x review time, 3x incidents per PR, 34% more tasks | [Faros AI, AI Engineering Report 2026](https://faros.ai/research/ai-acceleration-whiplash) |
| MCP is governed by the Agentic AI Foundation | [Linux Foundation announcement, 9 Dec 2025](https://aaif.io/news/linux-foundation-announces-formation-of-aaif) |

The Veracode and Faros figures are vendor studies. GoFr behaviour on the slides was checked
against the v1.62.0 source.

---

## GoFr

Repository:
[https://github.com/gofr-dev/gofr](https://github.com/gofr-dev/gofr)

Documentation:
[https://gofr.dev](https://gofr.dev)

Guide for AI coding assistants:
[https://gofr.dev/AGENTS.md](https://gofr.dev/AGENTS.md)
