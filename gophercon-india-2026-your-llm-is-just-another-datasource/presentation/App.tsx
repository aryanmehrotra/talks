import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { Terminal } from './components/Terminal';
import { Code, range } from './components/Code';
import { COLORS } from './constants';
import { SlideData } from './types';

const STAGE_W = 1920;
const STAGE_H = 1080;
const EVENT = 'GopherCon India 2026';
const TALK = 'Your LLM Is Just Another Datasource';

// ─── Building blocks ──────────────────────────────────────────────────────────────────────────────

const Reveal = ({ show, children, className = "" }: { show: boolean, children: React.ReactNode, className?: string }) => (
  <div className={`reveal ${show ? '' : 'reveal-hidden'} ${className}`}>{children}</div>
);

// Section eyebrow: gofr.dev's `font-display font-semibold uppercase tracking-wider`, in the site's
// link colour (sky-400) so the section a slide belongs to reads at a glance.
const Kicker = ({ children, color = COLORS.sky400 }: { children: React.ReactNode, color?: string }) => (
  <div className="eyebrow text-[1.3rem] mb-5" style={{ color }}>{children}</div>
);

const Header = ({ kicker, title }: { kicker?: string, title: React.ReactNode }) => (
  <div className="mb-12">
    {kicker && <Kicker>{kicker}</Kicker>}
    <h2 className="h2-text max-w-[1560px]">{title}</h2>
  </div>
);

// The emphasised half of a headline gets the hero h1 gradient (indigo-200 → sky-400 → indigo-200).
const Cyan = ({ children }: { children: React.ReactNode }) => <span className="gofr-gradient">{children}</span>;

// gofr.dev's dark panel: Callout's `bg-slate-800/60 ring-1 ring-slate-300/10`, rounded.
const Card = ({ children, className = "", highlight = false }: { children: React.ReactNode, className?: string, highlight?: boolean }) => (
  <div className={`relative rounded-2xl p-10 ${className}`}
       style={{
         background: `${COLORS.slate800}99`,
         boxShadow: highlight ? `0 0 0 2px ${COLORS.sky400}` : '0 0 0 1px rgba(203,213,225,0.10)',
       }}>
    {children}
  </div>
);

const Label = ({ children, color = COLORS.slate400 }: { children: React.ReactNode, color?: string }) => (
  <div className="eyebrow text-[1.2rem] mb-4" style={{ color }}>{children}</div>
);

const Mono = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <span className={`font-mono ${className}`}>{children}</span>
);

// A one-line takeaway placed directly under the evidence it summarises (hero h2 style: slate-300).
const Caption = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <p className={`body-text mt-10 ${className}`}>{children}</p>
);
const W = ({ children }: { children: React.ReactNode }) => <span className="text-white">{children}</span>;

const Stat = ({ value, label, dim = false }: { value: React.ReactNode, label: string, dim?: boolean }) => (
  <div className="transition-opacity duration-500" style={{ opacity: dim ? 0.35 : 1 }}>
    <div className="font-display font-bold text-[5.5rem] leading-none tracking-tight gofr-gradient inline-block">{value}</div>
    <div className="eyebrow text-[1.2rem] mt-4">{label}</div>
  </div>
);

// gofr.dev's secondary pill: rounded-full, bg-white/[0.08], font-semibold, white text.
const Pill = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <span className={`inline-flex items-center rounded-full px-5 py-2 font-semibold text-white ${className}`} style={{ background: 'rgba(255,255,255,0.08)' }}>{children}</span>
);

const LiveBadge = ({ text = 'Live demo' }: { text?: string }) => {
  const offline = text.toLowerCase() === 'offline';
  const dot = offline ? COLORS.amber500 : COLORS.emerald500;
  return (
    <Pill className="text-[1.25rem] space-x-3">
      <span className="w-3 h-3 rounded-full animate-pulse" style={{ background: dot }}></span>
      <span>{text}</span>
    </Pill>
  );
};

// One row of a trace waterfall. start/width are percentages of the request. Spans GoFr emits are
// solid; spans the agent opens itself are dashed outlines, so the two read apart without new colors.
type Tone = 'root' | 'gofr' | 'own' | 'gap';
interface SpanRow { name: string; depth: number; start: number; width: number; tone: Tone; note?: string; }

const toneStyle = (tone: Tone): React.CSSProperties => {
  switch (tone) {
    case 'root': return { background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)' };
    case 'gofr': return { background: `${COLORS.sky300}40`, border: `2px solid ${COLORS.sky300}` };
    case 'own': return { background: 'transparent', border: `2px dashed ${COLORS.sky400}` };
    default: return { background: `repeating-linear-gradient(135deg, ${COLORS.amber500}26 0 10px, transparent 10px 20px)`, border: `2px dashed ${COLORS.amber500}` };
  }
};

const Waterfall = ({ rows, labelWidth = 330 }: { rows: SpanRow[], labelWidth?: number }) => (
  <div className="space-y-3">
    {rows.map((r, i) => (
      <div key={i} className="flex items-center h-16">
        <div className="flex-shrink-0 font-mono text-[1.3rem] truncate" style={{ width: labelWidth, paddingLeft: r.depth * 24, color: r.tone === 'gap' ? COLORS.amber500 : r.tone === 'root' ? COLORS.white : r.tone === 'own' ? COLORS.sky400 : COLORS.sky300 }}>
          {r.name}
        </div>
        <div className="relative flex-1 h-full">
          <div className="absolute top-2 bottom-2 rounded-lg flex items-center px-4" style={{ left: `${r.start}%`, width: `${r.width}%`, ...toneStyle(r.tone) }}>
            {r.note && <span className="font-mono text-[1.15rem] whitespace-nowrap" style={{ color: r.tone === 'gap' ? COLORS.amber500 : COLORS.white }}>{r.note}</span>}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const Legend = () => (
  <div className="mt-6 flex space-x-10 text-[1.2rem]" style={{ color: COLORS.slate400 }}>
    <span className="flex items-center"><span className="inline-block w-8 h-4 mr-3 rounded" style={toneStyle('gofr')}></span>from GoFr</span>
    <span className="flex items-center"><span className="inline-block w-8 h-4 mr-3 rounded" style={toneStyle('own')}></span>added by hand</span>
  </div>
);

// Demo console lines.
const Prompt = ({ children }: { children: React.ReactNode }) => (
  <div><span style={{ color: COLORS.sky400 }} className="font-bold">❯ </span><span className="text-white">{children}</span></div>
);
const Note = ({ children }: { children: React.ReactNode }) => <div className="italic" style={{ color: COLORS.slate400 }}># {children}</div>;
const Out = ({ children, color = COLORS.white }: { children: React.ReactNode, color?: string }) => <div className="pl-7" style={{ color }}>{children}</div>;
const Gap = () => <div>&nbsp;</div>;
const Show = ({ when, children }: { when: boolean, children: React.ReactNode }) => (
  <div className={`reveal ${when ? '' : 'reveal-hidden'}`}>{children}</div>
);

const Strike = ({ on, children }: { on: boolean, children: React.ReactNode }) => (
  <span className="relative inline-block">
    <span className="transition-opacity duration-500" style={{ opacity: on ? 0.35 : 1 }}>{children}</span>
    <span className="absolute left-[-2%] top-1/2 h-[0.09em] rounded-full transition-all duration-500"
          style={{ background: COLORS.amber500, width: on ? '104%' : '0%' }}></span>
  </span>
);

const WifiOff = ({ off }: { off: boolean }) => (
  <svg viewBox="0 0 120 120" className="w-[240px] h-[240px]">
    <g fill="none" strokeLinecap="round" strokeWidth="9" stroke={off ? COLORS.slate400 : COLORS.sky300} style={{ transition: 'stroke 500ms', opacity: off ? 0.35 : 1 }}>
      <path d="M14 46 a66 66 0 0 1 92 0" />
      <path d="M30 63 a42 42 0 0 1 60 0" />
      <path d="M46 80 a19 19 0 0 1 28 0" />
    </g>
    <circle cx="60" cy="96" r="7" fill={off ? COLORS.slate400 : COLORS.sky300} style={{ opacity: off ? 0.35 : 1 }} />
    <line x1="18" y1="18" x2="102" y2="106" stroke={COLORS.amber500} strokeWidth="10" strokeLinecap="round"
          strokeDasharray="130" strokeDashoffset={off ? 0 : 130} style={{ transition: 'stroke-dashoffset 600ms ease' }} />
  </svg>
);

const SocialRow = ({ icon, handle }: { icon: React.ReactNode, handle: string }) => (
  <div className="flex items-center space-x-6 w-full">
    <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-full font-display font-semibold text-[1.3rem]" style={{ color: COLORS.sky300 }}>
      {icon}
    </div>
    <span className="text-[1.7rem] font-medium tracking-tight text-white">{handle}</span>
  </div>
);

const Socials = () => (
  <div className="flex flex-col space-y-4">
    <SocialRow icon="GH" handle="github.com/aryanmehrotra" />
    <SocialRow icon="in" handle="linkedin.com/in/aryanmehrotra" />
    <SocialRow icon="X" handle="x.com/_aryanmehrotra" />
  </div>
);

// ─── Slides ───────────────────────────────────────────────────────────────────────────────────────

const SLIDES: SlideData[] = [
  // 1 ─ Title
  {
    id: 1, layout: 'centered', title: 'Title', speaker: 'A',
    speakerNotes: 'Hi, I am Aryan. For the next half hour: a RAG service in Go that never sends a prompt anywhere. Two models, one process, no API key. And the part I actually want you to steal: it is still traced, metered and health-checked like any other dependency you already run.',
    content: () => (
      <div className="h-full flex items-center space-x-24">
        <img src="./brand/complete-gorg-logo.svg" alt="GoFr" className="h-[420px] w-auto animate-gentle-drift flex-shrink-0" />
        <div className="max-w-[1150px]">
          <Kicker>{EVENT}</Kicker>
          <h1 className="h1-text text-[7rem] gofr-gradient">Your LLM Is Just Another Datasource</h1>
          <p className="body-text mt-8 text-[2.2rem]">A RAG service in Go that never phones home.</p>
          <div className="mt-14 flex items-center space-x-4">
            <span className="inline-flex items-center rounded-full px-6 py-3 text-[1.35rem] font-semibold" style={{ background: COLORS.sky300, color: COLORS.bg }}>Aryan Mehrotra</span>
            <Pill className="text-[1.35rem] !py-3 !px-6">Maintainer, GoFr</Pill>
            <Pill className="text-[1.35rem] !py-3 !px-6">Senior SDE, zop.dev</Pill>
          </div>
        </div>
      </div>
    ),
  },

  // 2 ─ whoami
  {
    id: 2, layout: 'split', title: 'whoami', speaker: 'A',
    speakerNotes: 'Quick intro. I maintain GoFr, an open-source Go framework. It matters here for one reason: building this found a hole in it, and I fixed it upstream. That comes near the end.',
    content: () => (
      <div className="h-full grid grid-cols-[520px_1fr] gap-24 items-center">
        <div className="rounded-2xl overflow-hidden aspect-square" style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.10), 0 25px 50px -12px rgba(0,0,0,0.5)' }}>
          <img src="./AryanMehrotra.jpg" alt="Aryan Mehrotra" className="w-full h-full object-cover" />
        </div>
        <div>
          <Kicker>whoami</Kicker>
          <h2 className="h2-text text-[4.5rem]">Aryan Mehrotra</h2>
          <div className="body-text mt-6 space-y-2">
            <div>Senior Software Engineer · <W>zop.dev</W></div>
            <div>Maintainer · <W>GoFr</W>, an open-source Go framework</div>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            {['GopherCon Africa', 'Conf42 Golang', 'Open Source India', 'Container Days London'].map(t => (
              <Pill key={t} className="text-[1.2rem] !font-medium">{t}</Pill>
            ))}
          </div>
          <div className="mt-14"><Socials /></div>
        </div>
      </div>
    ),
  },

  // 3 ─ The myth
  {
    id: 3, layout: 'centered', title: 'The myth', steps: 3, speaker: 'A',
    speakerNotes: 'Raise your hand if you have been told this. You want to do anything with LLMs, go learn Python. [next] I do not think that is true. [next] And I would rather show it than argue about it. So, straight to a demo.',
    content: (step) => (
      <div className="h-full flex flex-col justify-center">
        <p className="font-display font-semibold text-[3.2rem]" style={{ color: COLORS.slate400 }}>“Want LLMs in your service?</p>
        <p className="font-display font-bold text-[8rem] leading-none mt-6 tracking-tight">
          <Strike on={step >= 1}>Go learn Python.”</Strike>
        </p>
        <Reveal show={step >= 2} className="mt-20">
          <p className="font-display font-bold text-[4.5rem]"><Cyan>No. Let me show you.</Cyan></p>
        </Reveal>
      </div>
    ),
  },

  // 4 ─ Demo: ingest + ask
  {
    id: 4, layout: 'code', title: 'Demo: ingest and ask', steps: 3, speaker: 'A',
    speakerNotes: 'LIVE DEMO. Switch to the terminal. POST /ingest with the handbook text. It is chunked, embedded by a model inside the process, and stored in SurrealDB. [next] Ask a question that needs two facts. [next] Two facts, both cited [1], plus the cosine score of the passage that grounded them. The live API prints JSON; this slide is the same session, formatted. If the demo breaks, stay on this slide and narrate it.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <div className="flex items-start justify-between">
          <Header kicker="1 · Demo" title={<>Ingest a doc. Ask a question.<br /><Cyan>Get an answer with citations.</Cyan></>} />
          <LiveBadge />
        </div>
        <Terminal title="local-rag-agent · :8010" hideOutput fontSize={27}>
          <Note>ingest: chunked, embedded locally (EmbeddingGemma), stored in SurrealDB</Note>
          <Prompt>POST /ingest  source=handbook</Prompt>
          <Out><span style={{ color: COLORS.emerald500 }}>stored</span> 1/1 chunk(s) from handbook</Out>
          <Gap />
          <Show when={step >= 1}>
            <Note>ask: embedded locally, matched by cosine, answered by a local model</Note>
            <Prompt>POST /ask  "how many days can I work from home, and the internet reimbursement?"</Prompt>
          </Show>
          <Show when={step >= 2}>
            <Out>- Employees may work up to 3 days per week remotely <Cyan>[1]</Cyan>.</Out>
            <Out>- The company reimburses home internet up to $50 per month <Cyan>[1]</Cyan>.</Out>
            <Out color={COLORS.slate400}>└ source=handbook  cosine=0.792</Out>
          </Show>
        </Terminal>
      </div>
    ),
  },

  // 5 ─ Demo: pull the network
  {
    id: 5, layout: 'split', title: 'Demo: offline', steps: 3, speaker: 'A',
    speakerNotes: 'Now I turn Wi-Fi off. Actually do it and show the menu bar. Check at the venue that the clicker and the projector do not ride on Wi-Fi. [next] Ask again. Same answer, same citation. [next] No API key exists to set, and no prompt leaves this laptop. What is left on the network is loopback: SurrealDB and the trace collector, both on localhost. One honest footnote: GoFr sends an anonymous start-up ping by default; GOFR_TELEMETRY=false turns it off, and it is off here. I am leaving Wi-Fi off for the rest of the talk.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <div className="flex items-start justify-between">
          <Header kicker="1 · Demo" title={<>Now I pull the network.</>} />
          <LiveBadge text={step >= 1 ? 'Offline' : 'Live demo'} />
        </div>
        <div className="grid grid-cols-[320px_1fr] gap-16 items-center">
          <div className="flex flex-col items-center">
            <WifiOff off={step >= 1} />
            <div className="eyebrow text-[1.4rem] mt-6" style={{ color: step >= 1 ? COLORS.amber500 : COLORS.slate400 }}>
              {step >= 1 ? 'wi-fi: off' : 'wi-fi: on'}
            </div>
          </div>
          <div>
            <Terminal title="local-rag-agent · offline" hideOutput fontSize={27}>
              <Prompt>POST /ask  "how many days can I work from home?"</Prompt>
              <Show when={step >= 1}>
                <Out>Employees may work up to 3 days per week remotely <Cyan>[1]</Cyan>.</Out>
                <Out color={COLORS.slate400}>└ source=handbook  cosine=0.79</Out>
              </Show>
            </Terminal>
            <Reveal show={step >= 2} className="mt-14">
              <div className="grid grid-cols-3 gap-8">
                <Stat value="0" label="API keys" />
                <Stat value="0" label="prompts leave the laptop" />
                <Stat value="1" label="process, both models" />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    ),
  },

  // 6 ─ How it runs
  {
    id: 6, layout: 'diagram', title: 'How it runs', steps: 3, speaker: 'A',
    speakerNotes: 'Here is the whole thing. One Go binary. Both models are GGUF files loaded into this process on llama.cpp, through Kronk from Ardan Labs. [next] The chat model is Qwen3 0.6B at Q8, 639 MB on disk. The embedder is EmbeddingGemma 300M, 329 MB. [next] No model server, no model sidecar, no key. The vectors live in SurrealDB, which is just a database on localhost, the same as any service already has.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="2 · How it runs" title={<>Two GGUF models. <Cyan>Inside the process.</Cyan></>} />
        <div className="flex items-center space-x-8 mt-4">
          <div className="flex-1 rounded-[2rem] border-2 p-10 relative" style={{ borderColor: `${COLORS.sky300}88`, background: `${COLORS.sky300}08` }}>
            <div className="absolute -top-5 left-10 px-4 eyebrow text-[1.15rem]" style={{ background: COLORS.bg, color: COLORS.sky300 }}>one go process · local-rag-agent</div>
            <div className="grid grid-cols-[230px_1fr] gap-8 items-center">
              <Card className="!p-7">
                <Label>HTTP :8010</Label>
                <div className="font-mono text-[1.4rem] space-y-2"><div>POST /ingest</div><div>POST /ask</div></div>
              </Card>
              <div className="space-y-6">
                {[
                  { call: 'c.LLM().Chat', role: 'chat', model: 'Qwen3-0.6B', size: '639 MB' },
                  { call: 'embedText', role: 'embed', model: 'EmbeddingGemma-300M', size: '329 MB' },
                ].map(m => (
                  <div key={m.role} className="flex items-center">
                    <div className="w-[200px] flex flex-col items-start">
                      <Mono className="text-[1.3rem] whitespace-nowrap">{m.call}</Mono>
                      <span style={{ color: COLORS.sky400 }} className="text-[2.4rem] leading-none mt-1">⟶</span>
                    </div>
                    <Card className="!p-6 flex-1">
                      <div className="flex items-center justify-between space-x-6">
                        <div className="whitespace-nowrap">
                          <div className="eyebrow text-[1.15rem]" style={{ color: COLORS.slate400 }}>llama.cpp · {m.role}</div>
                          <div className="font-display font-semibold text-[1.9rem] mt-2">{m.model}</div>
                        </div>
                        <Reveal show={step >= 1}>
                          <div className="text-right whitespace-nowrap">
                            <div className="font-mono font-bold text-[1.7rem]" style={{ color: COLORS.sky300 }}>{m.size}</div>
                            <div className="font-mono text-[1.15rem]" style={{ color: COLORS.slate400 }}>GGUF · Q8_0</div>
                          </div>
                        </Reveal>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start">
            <Mono className="text-[1.3rem]">c.SurrealDB</Mono>
            <span style={{ color: COLORS.sky400 }} className="text-[2.4rem] leading-none mt-1">⟶</span>
            <Mono className="text-[1.15rem] mt-1 text-slate-400">localhost</Mono>
          </div>
          <Card className="w-[250px] text-center !px-6">
            <Label>vectors</Label>
            <div className="font-display font-semibold text-[2rem]">SurrealDB</div>
            <div className="font-mono text-[1.15rem] mt-3" style={{ color: COLORS.slate400 }}>cosine search</div>
          </Card>
        </div>
        <Reveal show={step >= 2} className="mt-14 flex space-x-6">
          {['No model server', 'No model sidecar', 'No API key'].map(t => (
            <Pill key={t} className="text-[1.6rem] !px-7 !py-3"><span style={{ color: COLORS.amber500 }}>✕</span>&nbsp;&nbsp;{t}</Pill>
          ))}
        </Reveal>
      </div>
    ),
  },

  // 7 ─ Boot
  {
    id: 7, layout: 'code', title: 'Boot', steps: 3, speaker: 'A',
    speakerNotes: 'Start-up. Install the llama.cpp backend; it is cached after the first run. [next] Resolve both models. Any GGUF works: a Hugging Face reference or a path on disk. [next] Load each into its own Kronk instance. Only the very first run needs the network, to download. After that the laptop can stay offline.',
    content: (step) => {
      const focus = [range(1, 3), range(5, 7), range(9, 10)][step];
      return (
        <div className="h-full flex flex-col">
          <Header kicker="2 · How it runs" title={<>Start-up is three calls. <Cyan>Only the first run touches the network.</Cyan></>} />
          <Terminal title="kronk.go · bootstrapKronk (errors elided)" hideOutput fontSize={24}>
            <Code focus={focus} code={`
lib, _ := libs.New()
lib.Download(ctx, klog)                          // llama.cpp backend, cached
kronk.Init(kronk.WithLibPath(lib.LibsPath()))

mdls, _ := models.New()
cp, _ := mdls.Download(ctx, klog, chatSrc)       // HF ref or a local .gguf
ep, _ := mdls.Download(ctx, klog, embedSrc)

chat, _  := kronk.New(model.WithModelFiles(cp.ModelFiles), model.WithLog(klog))
embed, _ := kronk.New(model.WithModelFiles(ep.ModelFiles), model.WithLog(klog))
`} />
          </Terminal>
          <div className="mt-8 flex items-center justify-between rounded-2xl px-8 py-5 font-mono text-[1.25rem]" style={{ background: `${COLORS.slate800}99`, boxShadow: "0 0 0 1px rgba(203,213,225,0.10)" }}>
            <span><span style={{ color: COLORS.sky400 }} className="font-bold">CHAT_MODEL</span>=unsloth/Qwen3-0.6B-Q8_0.gguf</span>
            <span><span style={{ color: COLORS.sky400 }} className="font-bold">EMBED_MODEL</span>=ggml-org/embeddinggemma-300m-qat-Q8_0.gguf</span>
          </div>
        </div>
      );
    },
  },

  // 8 ─ GoFr, minimal
  {
    id: 8, layout: 'grid', title: 'GoFr in one slide', steps: 2, speaker: 'A',
    speakerNotes: 'One slide on GoFr, because the rest of the talk leans on one idea from it. You register a datasource once. [next] From then on every call through it gets a span, metrics, a debug log line, and a place on the health endpoint. You do not write that code. Hold on to that, because an LLM is about to become one of these.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="3 · The idea" title={<>Register a datasource once.<br /><Cyan>Every call through it is observed.</Cyan></>} />
        <div className="grid grid-cols-2 gap-14 items-start">
          <Terminal title="main.go" hideOutput fontSize={26}>
            <Code focus={step >= 1 ? [5] : []} code={`
app := gofr.New()

app.AddMongo(mongo.New(cfg))
app.AddSurrealDB(surrealdb.New(cfg))
app.AddLLM(model)        // ← this talk

app.POST("/ask", ask)
app.Run()
`} />
          </Terminal>
          <Reveal show={step >= 1}>
            <div className="grid grid-cols-2 gap-6">
              {[
                ['Traces', 'a span per call'],
                ['Metrics', 'counts, tokens'],
                ['Logs', 'per call, at debug'],
                ['Health', '/.well-known/health'],
              ].map(([k, v]) => (
                <Card key={k} className="!p-8">
                  <div className="font-display font-bold text-[2.4rem]" style={{ color: COLORS.sky300 }}>{k}</div>
                  <div className="font-mono text-[1.2rem] mt-3" style={{ color: COLORS.slate400 }}>{v}</div>
                </Card>
              ))}
            </div>
            <div className="mt-8 font-mono text-[1.2rem]" style={{ color: COLORS.slate400 }}>gofr.dev · open source · Apache-2.0</div>
          </Reveal>
        </div>
      </div>
    ),
  },

  // 9 ─ The idea
  {
    id: 9, layout: 'comparison', title: 'The idea', steps: 2, speaker: 'A',
    speakerNotes: 'So here is the idea. This is a database call in a handler. [next] And this is a model call. Same shape: a context in, a client off the context, a result and an error out. If the second one is a datasource, it gets everything the first one gets.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="3 · The idea" title={<>A model call has the same shape<br /><Cyan>as a database call.</Cyan></>} />
        <div className="grid grid-cols-2 gap-12">
          <div>
            <Label>a datasource you already trust</Label>
            <Terminal title="a handler" hideOutput fontSize={29}>
              <Code code={`
rows, err := c.SurrealDB.Query(c, q, vars)
`} />
            </Terminal>
            <div className="mt-6 font-mono text-[1.35rem]" style={{ color: COLORS.slate400 }}>span <W>SurrealDB.Query</W></div>
          </div>
          <Reveal show={step >= 1}>
            <Label color={COLORS.sky300}>a model running in this process</Label>
            <div className="rounded-2xl p-[2px]" style={{ background: `linear-gradient(to top, ${COLORS.indigo400}, ${COLORS.cyan400}, ${COLORS.sky500})` }}>
              <Terminal title="a handler" hideOutput fontSize={29}>
                <Code code={`
resp, err := c.LLM().Chat(c, msgs)
`} />
              </Terminal>
            </div>
            <div className="mt-6 font-mono text-[1.35rem]" style={{ color: COLORS.slate400 }}>span <W>llm.chat</W> · metric <W>app_llm_request_count</W></div>
          </Reveal>
        </div>
        <Reveal show={step >= 1} className="mt-16">
          <div className="flex items-center space-x-6 font-display font-semibold text-[2.6rem]">
            <span>Same shape</span>
            <span style={{ color: COLORS.sky400 }}>⟶</span>
            <Cyan>traced, metered, health-checked.</Cyan>
          </div>
        </Reveal>
      </div>
    ),
  },

  // 10 ─ The contract
  {
    id: 10, layout: 'code', title: 'The contract', steps: 2, speaker: 'A',
    speakerNotes: 'The whole contract. Three methods: Chat, HealthCheck, Name. Name is the health key and the default label. [next] The rest is optional and discovered by type assertion. Descriptor gives dashboards a real provider and model label instead of one generic name. StreamingModel adds Stream. And there is a third, Embedder, which did not exist when I started. I had to add it. Later.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="3 · The idea" title={<>The contract is <Cyan>three methods.</Cyan> The rest is optional.</>} />
        <div className="grid grid-cols-[1fr_360px] gap-12 items-start">
          <Terminal title="gofr.dev/pkg/gofr/ai · model.go · v1.58.0" hideOutput fontSize={21}>
            <Code focus={step === 0 ? range(1, 5) : range(7, 10)} code={`
type Model interface {
	Chat(ctx context.Context, messages []Message, opts ...Option) (*Response, error)
	HealthCheck(ctx context.Context) datasource.Health
	Name() string
}

// optional: clean provider / model labels
type Descriptor interface {
	ProviderName() string
	ModelName() string
}
`} />
          </Terminal>
          <div className="space-y-10 pt-4">
            <Stat value="3" label="required" dim={step >= 1} />
            <Reveal show={step >= 1}>
              <Label color={COLORS.sky300}>optional</Label>
              <div className="font-mono text-[1.35rem] leading-[2.1]">
                <div><W>Descriptor</W> <span style={{ color: COLORS.slate400 }}>· labels</span></div>
                <div><W>StreamingModel</W> <span style={{ color: COLORS.slate400 }}>· Stream</span></div>
                <div><W>Embedder</W> <span style={{ color: COLORS.slate400 }}>· v1.60, later</span></div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    ),
  },

  // 11 ─ Chat is translation
  {
    id: 11, layout: 'code', title: 'Chat()', steps: 3, speaker: 'A',
    speakerNotes: 'Chat is a translation layer. GoFr messages in, a Kronk document out. [next] One in-process call. No HTTP. The real code also applies options like temperature and adds a deadline, because Kronk refuses a context without one; I trimmed those. [next] Usage comes back and maps straight onto ai.Usage. That is what GoFr turns into token metrics. I wrote no metrics code.',
    content: (step) => {
      const focus = [range(2, 5), range(6, 9), range(10, 14)][step];
      return (
        <div className="h-full flex flex-col">
          <Header kicker="3 · The idea" title={<>Chat() is a translation layer. <Cyan>Nothing else.</Cyan></>} />
          <Terminal title="kronk.go · chatModel.Chat (options, deadline, nil checks trimmed)" hideOutput fontSize={22}>
            <Code focus={focus} code={`
func (m *chatModel) Chat(ctx context.Context, messages []ai.Message, opts ...ai.Option) (*ai.Response, error) {
	msgs := make([]model.D, 0, len(messages))
	for _, msg := range messages {
		msgs = append(msgs, model.D{"role": msg.Role, "content": msg.Content})
	}
	resp, err := m.krn.Chat(ctx, model.D{"messages": msgs, "max_tokens": m.maxTok})
	if err != nil {
		return nil, err
	}
	u := resp.Usage
	return &ai.Response{
		Content: resp.Choices[0].Message.Content,
		Usage:   ai.Usage{PromptTokens: u.PromptTokens, CompletionTokens: u.CompletionTokens},
	}, nil
}
`} />
          </Terminal>
        </div>
      );
    },
  },

  // 12 ─ Register and call
  {
    id: 12, layout: 'code', title: 'Register and call', steps: 2, speaker: 'A',
    speakerNotes: 'Register it once at start-up. [next] And in the handler it is just c.LLM().Chat. The handler has no idea the model is a file on my laptop. Register a hosted provider tomorrow and this code does not change.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="3 · The idea" title={<>Register once. <Cyan>The handler never knows it is local.</Cyan></>} />
        <Terminal title="main.go · start-up (trimmed)" hideOutput fontSize={24}>
          <Code code={`
app.AddLLM(&chatModel{krn: chatKrn, modelID: chatKrn.ModelInfo().ID, timeout: 120 * time.Second})
`} />
        </Terminal>
        <Reveal show={step >= 1} className="mt-8">
          <Terminal title="main.go · ask handler" hideOutput fontSize={24}>
            <Code focus={[1, 4]} code={`
resp, err := c.LLM().Chat(c, []ai.Message{
	{Role: ai.RoleSystem, Content: "You answer using ONLY the numbered context passages ..."},
	{Role: ai.RoleUser, Content: "Context:\\n" + ctxb.String() + "\\nQuestion: " + question},
}, ai.WithTemperature(0.2))
`} />
          </Terminal>
          <Caption>Register a hosted provider tomorrow: <W>this handler does not change.</W></Caption>
        </Reveal>
      </div>
    ),
  },

  // 13 ─ What you get
  {
    id: 13, layout: 'grid', title: 'What you get', steps: 3, speaker: 'A',
    speakerNotes: 'What came from the interface. A trace: POST /ask, the SurrealDB query, llm.chat. Solid bars are GoFr. The two dashed ones I added by hand, and each of them is a story in a minute. [next] Metrics: the local model shows up as provider kronk, next to every hosted model. [next] Health: the model is a key on the health endpoint. Tokens per second is an attribute on my own generate span, not a GoFr metric.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="3 · The idea" title={<>Tracing, metrics, health from the interface. <Cyan>Two spans I added by hand.</Cyan></>} />
        <div className="grid grid-cols-[1.3fr_1fr] gap-10 items-start">
          <Card>
            <Label>trace · POST /ask · not to scale</Label>
            <Waterfall rows={[
              { name: 'POST /ask', depth: 0, start: 0, width: 100, tone: 'root' },
              { name: 'kronk.embed', depth: 1, start: 1, width: 12, tone: 'own' },
              { name: 'SurrealDB.Query', depth: 1, start: 14, width: 6, tone: 'gofr' },
              { name: 'llm.chat', depth: 1, start: 21, width: 78, tone: 'gofr' },
              { name: 'kronk.generate', depth: 2, start: 22, width: 76, tone: 'own', note: 'gen.tokens_per_sec' },
            ]} />
            <Legend />
          </Card>
          <div className="flex flex-col space-y-8">
            <Reveal show={step >= 1}>
              <Card>
                <Label>metrics · :2132</Label>
                <div className="font-mono text-[1.3rem] leading-[1.9]">
                  <div>app_llm_request_count{'{'}<Cyan>provider="kronk"</Cyan>{'}'}</div>
                  <div>app_llm_tokens_per_request</div>
                </div>
              </Card>
            </Reveal>
            <Reveal show={step >= 2}>
              <Card>
                <Label>GET /.well-known/health</Label>
                <pre className="font-mono text-[1.25rem] leading-[1.6] m-0">{`"llm": {
  "status": "UP",
  "details": {
    "backend": "llama.cpp (kronk, in-process)"
  }
}`}</pre>
              </Card>
            </Reveal>
          </div>
        </div>
      </div>
    ),
  },

  // 14 ─ Live: show the trace
  {
    id: 14, layout: 'code', title: 'Live: the evidence', steps: 3, speaker: 'A',
    speakerNotes: 'LIVE DEMO, Wi-Fi still off. Pre-flight: the Jaeger all-in-one from the agents repo observability/ folder is running, and the /ask from a minute ago is already in it. Open Jaeger on 16686, pick local-rag-agent, open the /ask trace, expand llm.chat and point at kronk.generate and its tokens-per-second attribute. [next] Metrics: grep app_llm, point at provider kronk. [next] Health: the llm key is UP. Fallback if anything is down: go back one slide, it is the same picture.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <div className="flex items-start justify-between">
          <Header kicker="3 · The idea" title={<>Same request, <Cyan>Wi-Fi still off.</Cyan></>} />
          <LiveBadge text="Offline" />
        </div>
        <Terminal title="evidence · all on localhost" hideOutput fontSize={28}>
          <Note>trace: POST /ask → kronk.embed → SurrealDB.Query → llm.chat → kronk.generate</Note>
          <Prompt>open http://localhost:16686</Prompt>
          <Gap />
          <Show when={step >= 1}>
            <Note>metrics: the local model, labelled like any provider</Note>
            <Prompt>curl -s localhost:2132/metrics | grep app_llm</Prompt>
            <Gap />
          </Show>
          <Show when={step >= 2}>
            <Note>health: the model is a datasource</Note>
            <Prompt>curl -s localhost:8010/.well-known/health</Prompt>
          </Show>
        </Terminal>
      </div>
    ),
  },

  // 15 ─ Same move, twice more
  {
    id: 15, layout: 'split', title: 'Same move', steps: 3, speaker: 'A',
    speakerNotes: 'This is not really about models. Kronk has its own logger type: a function taking a context, a message and args. One adapter pointed at GoFr, and every llama.cpp load line comes out in GoFr format, at GoFr level. [next] The vector store is the same move. I wrote no vector-database integration. SurrealDB is an ordinary GoFr datasource, and the cosine search is just a query, traced as SurrealDB.Query. [next] And if you do not use GoFr: wrap your model client in a decorator that opens a span, records usage and reports health. That is all AddLLM does for you.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="3 · The idea" title={<>Same move, twice more. <Cyan>Any interface, same observability.</Cyan></>} />
        <div className="grid grid-cols-[1.2fr_1fr] gap-10 items-start">
          <div>
            <Label>a foreign logger, pointed at GoFr</Label>
            <Terminal title="kronk.go · kronkLogger (trimmed)" hideOutput fontSize={20}>
              <Code focus={step === 0 ? [5, 6, 9] : []} code={`
func kronkLogger(lg logging.Logger) applog.Logger {
	return func(_ context.Context, msg string, args ...any) {
		line := "kronk: " + msg + " " + kvPairs(args)
		if strings.Contains(msg, "Downloading") ||
			strings.Contains(msg, "MB of") {
			lg.Debug(line)
			return
		}
		lg.Info(line)
	}
}
`} />
            </Terminal>
          </div>
          <Reveal show={step >= 1}>
            <Label>a database, used as a vector store</Label>
            <Terminal title="main.go · vector.go" hideOutput fontSize={20}>
              <Code focus={[7]} code={`
app.AddSurrealDB(surrealdb.New(&surrealdb.Config{
	Host: host, Port: port,
	Namespace: "agents", Database: "rag",
}))

// cosine search is just a query: SurrealDB.Query
rows, err := c.SurrealDB.Query(c, query, nil)
`} />
            </Terminal>
          </Reveal>
        </div>
        <Reveal show={step >= 2}>
          <Caption><W>No GoFr?</W> Wrap your model client in a decorator that opens a span, records usage and reports health. <W>That is all AddLLM does.</W></Caption>
        </Reveal>
      </div>
    ),
  },

  // 16 ─ Section: what fought back
  {
    id: 16, layout: 'grid', title: 'What fought back', steps: 3, speaker: 'A',
    speakerNotes: 'That was the happy path. Three things fought back. One: the driver would not take my vector. [next] Two: search ranked everything correctly and scored all of it zero. [next] Three: the most expensive thing in the request had no span of its own.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="4 · What fought back" title={<>Three things <Cyan>fought back.</Cyan></>} />
        <div className="grid grid-cols-3 gap-10 mt-6">
          {[
            ['01', 'The driver would not take a bound vector.'],
            ['02', 'Every cosine score came back as 0.'],
            ['03', 'Generation had no span of its own.'],
          ].map(([n, t], i) => (
            <Reveal key={n} show={step >= i}>
              <Card className="h-[340px] flex flex-col justify-between">
                <div className="font-mono font-bold text-[3rem]" style={{ color: COLORS.sky400 }}>{n}</div>
                <div className="font-display font-semibold text-[2.3rem] leading-tight">{t}</div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    ),
  },

  // 17 ─ Fight 01
  {
    id: 17, layout: 'code', title: 'Fight 01: binding', steps: 2, speaker: 'A',
    speakerNotes: 'First. The obvious query binds the vector as a parameter. The same float32 slice stores fine as a field, but bound into the cosine function the driver serialises it into a value the function rejects. [next] So the 768 floats get formatted into the query text by hand. It is safe here only because every character comes out of strconv.FormatFloat, never from a user.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="4 · What fought back · 01" title={<>You can't bind the query vector.<br /><Cyan>So 768 floats get formatted in by hand.</Cyan></>} />
        <div className="grid grid-cols-[1fr_1.15fr] gap-12 items-start">
          <div>
            <Label color={COLORS.amber500}>✕ what you write first</Label>
            <Terminal title="bound parameter" hideOutput fontSize={22}>
              <Code code={`
q := "... cosine(embedding, $q) ..."
c.SurrealDB.Query(c, q,
	map[string]any{"q": qvec})
// rejected by the vector function
`} />
            </Terminal>
          </div>
          <Reveal show={step >= 1}>
            <Label color={COLORS.sky300}>✓ what ships</Label>
            <Terminal title="vector.go · floatLiteral" hideOutput fontSize={20}>
              <Code focus={[4]} code={`
func floatLiteral(v []float32) string {
	parts := make([]string, len(v))
	for i, f := range v {
		parts[i] = strconv.FormatFloat(float64(f), 'f', 6, 32)
	}
	return "[" + strings.Join(parts, ",") + "]"
}
`} />
            </Terminal>
          </Reveal>
        </div>
        <Reveal show={step >= 1}>
          <Caption><span style={{ color: COLORS.amber500 }}>⚠</span>&nbsp; Safe only because every character comes from <Mono className="text-white">strconv.FormatFloat</Mono>. <W>Never do this with user input.</W></Caption>
        </Reveal>
      </div>
    ),
  },

  // 18 ─ Fight 02
  {
    id: 18, layout: 'code', title: 'Fight 02: zero scores', steps: 3, speaker: 'A',
    speakerNotes: 'Second. Search worked, the ranking was right, and every score was zero. [next] The culprit is in my own framework. GoFr\'s SurrealDB datasource normalises numbers on the way out, and a float64 becomes an int. int of 0.792 is 0. It is still like that on development today, so that one is on me. [next] The workaround: ask SurrealDB for the score times ten thousand, rounded, so it survives as an integer, then divide in Go.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="4 · What fought back · 02" title={<>Every cosine score <Cyan>came back as 0.</Cyan></>} />
        <div className="grid grid-cols-[420px_1fr] gap-12 items-start">
          <Card className="text-center">
            <Label>handbook · cosine</Label>
            <div className="font-display font-bold text-[8rem] leading-none mt-6 transition-colors duration-500" style={{ color: step >= 2 ? COLORS.sky300 : COLORS.amber500 }}>
              {step >= 2 ? '0.792' : '0'}
            </div>
            <div className="font-mono text-[1.2rem] mt-6" style={{ color: COLORS.slate400 }}>{step >= 2 ? 'scaled, then divided back' : 'ranked right, scored 0'}</div>
          </Card>
          <div className="space-y-8">
            <Reveal show={step >= 1}>
              <Label color={COLORS.amber500}>the cause · GoFr's own datasource</Label>
              <Terminal title="datasource/surrealdb · convertValue · v0.3.4" hideOutput fontSize={26}>
                <Code code={`
case float64:
	return int(val)   // int(0.792) == 0
`} />
              </Terminal>
            </Reveal>
            <Reveal show={step >= 2}>
              <Label color={COLORS.sky300}>the workaround</Label>
              <Terminal title="vector.go" hideOutput fontSize={23}>
                <Code code={`
"math::round(vector::similarity::cosine(embedding, %s) * 10000) AS score"
out[i].Score /= 10000 // undo the integer scaling
`} />
              </Terminal>
            </Reveal>
          </div>
        </div>
      </div>
    ),
  },

  // 19 ─ Fight 03
  {
    id: 19, layout: 'code', title: 'Fight 03: no span', steps: 3, speaker: 'A',
    speakerNotes: 'Third, and the one I like most. Call a hosted model and your HTTP client gives you a span for the network call, for free. Go in-process and that span disappears. llm.chat was one fat bar with nothing inside it: the most expensive thing in the request had no name. [next] The fix is one span, opened around the call to Kronk, with the generation stats on it. [next] Now the bar has a child that explains it, and tokens per second sits on it.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="4 · What fought back · 03" title={<>In-process means no HTTP span.<br /><Cyan>Generation had no span of its own.</Cyan></>} />
        <Card className="!py-7">
          <div className="grid grid-cols-[160px_1fr] items-center">
            <Label color={step >= 2 ? COLORS.sky300 : COLORS.amber500}>{step >= 2 ? 'after' : 'before'}</Label>
            <Waterfall labelWidth={260} rows={step >= 2 ? [
              { name: 'llm.chat', depth: 0, start: 0, width: 100, tone: 'gofr' },
              { name: 'kronk.generate', depth: 1, start: 1, width: 98, tone: 'own', note: 'gen.tokens_per_sec' },
            ] : [
              { name: 'llm.chat', depth: 0, start: 0, width: 100, tone: 'gofr' },
              { name: '(nothing)', depth: 1, start: 1, width: 98, tone: 'gap', note: 'where did the time go?' },
            ]} />
          </div>
        </Card>
        <Reveal show={step >= 1} className="mt-8">
          <Terminal title="kronk.go · chatModel.Chat (trimmed)" hideOutput fontSize={23}>
            <Code code={`
genCtx, span := otel.Tracer("local-rag-agent").Start(ctx, "kronk.generate")
resp, err := m.krn.Chat(genCtx, d)
span.SetAttributes(attribute.Float64("gen.tokens_per_sec", resp.Usage.TokensPerSecond))
span.End()
`} />
          </Terminal>
        </Reveal>
      </div>
    ),
  },

  // 20 ─ The hole was upstream
  {
    id: 20, layout: 'comparison', title: 'Fixed upstream', steps: 2, speaker: 'A',
    speakerNotes: 'And one hole was not in my code, it was in GoFr. Chat went through the LLM interface; embeddings had no path through it. So on every request the embedding step was invisible unless I hand-rolled a span, which is the kronk.embed you saw. [next] So I fixed the framework. Embedder is an optional capability; c.LLM().Embed gets the same span and metrics as Chat. It shipped in GoFr v1.60.0. The agent still pins v1.58, which is why you saw the hand-rolled span; moving it over is a small change.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="4 · What fought back · upstream" title={<>Embeddings had no path through the interface.<br /><Cyan>So I fixed the framework.</Cyan></>} />
        <div className="grid grid-cols-2 gap-12 items-start">
          <div>
            <Label color={COLORS.amber500}>GoFr v1.58 · what the agent pins</Label>
            <Terminal title="kronk.go · embedText (trimmed)" hideOutput fontSize={20}>
              <Code code={`
// embeddings don't go through c.LLM(),
// so the span is hand-rolled
ctx, span := otel.Tracer("local-rag-agent").
	Start(ctx, "kronk.embed")
defer span.End()
resp, err := krn.Embeddings(ctx, model.D{"input": text})
`} />
            </Terminal>
          </div>
          <Reveal show={step >= 1}>
            <Label color={COLORS.sky300}>GoFr v1.60.0 · #3757, #4108</Label>
            <Terminal title="gofr.dev/pkg/gofr/ai · model.go" hideOutput fontSize={20}>
              <Code focus={[6, 7]} code={`
type Embedder interface {
	Embed(ctx context.Context, input []string,
		opts ...Option) (*EmbeddingResponse, error)
}

// span llm.embed, same metrics as Chat
resp, err := c.LLM().Embed(c, []string{question})
`} />
            </Terminal>
          </Reveal>
        </div>
        <Reveal show={step >= 1}>
          <Caption>Any provider that implements <Mono className="text-white">Embedder</Mono> now gets <Mono className="text-white">llm.embed</Mono> and the same <Mono className="text-white">app_llm_*</Mono> metrics.</Caption>
        </Reveal>
      </div>
    ),
  },

  // 21 ─ Grounding
  {
    id: 21, layout: 'code', title: 'Grounding', steps: 2, speaker: 'A',
    speakerNotes: 'Grounding is two things. A system prompt: only these passages, cite them, and say so if the answer is not there. [next] And a floor. Raise RECALL_FLOOR and weak matches are dropped; if nothing is left, the model is never called at all. In this demo the floor is zero, so retrieval always hands the model something. Watch what that does.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="5 · Grounding" title={<>Grounding is a prompt <Cyan>and a floor.</Cyan></>} />
        <Terminal title="main.go · system prompt" hideOutput fontSize={25}>
          <Code code={`
"You answer using ONLY the numbered context passages provided. " +
"Cite the passages you use inline as [n], matching their number. " +
"If the passages do not contain the answer, say so plainly instead of guessing."
`} />
        </Terminal>
        <Reveal show={step >= 1} className="mt-8">
          <Terminal title="main.go · a floor you can raise" hideOutput fontSize={25}>
            <Code focus={[1, 3]} code={`
hits := searchChunks(c, qvec, k, recallFloor())   // RECALL_FLOOR=0.35
if len(hits) == 0 {
	return map[string]any{"answer": "I have nothing ingested that's relevant ..."}, nil
}
`} />
          </Terminal>
        </Reveal>
      </div>
    ),
  },

  // 22 ─ Deliberate miss
  {
    id: 22, layout: 'code', title: 'A deliberate miss', steps: 2, speaker: 'A',
    speakerNotes: 'LIVE DEMO. Something the handbook cannot answer. With the floor at zero, retrieval still returns the top four, so the model is handed the handbook anyway. [next] And it refuses. That is the prompt doing its job. Before the talk, run this question a dozen times and quote the real refusal rate here instead of an adjective. Fallback: this slide is the recorded output.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <div className="flex items-start justify-between">
          <Header kicker="5 · Grounding" title={<>Now I ask something <Cyan>the corpus cannot answer.</Cyan></>} />
          <LiveBadge text="Offline" />
        </div>
        <Terminal title="local-rag-agent · :8010" hideOutput fontSize={29}>
          <Prompt>POST /ask  "what is the boiling point of mercury?"</Prompt>
          <Gap />
          <Show when={step >= 1}>
            <Out color={COLORS.sky300}>The passage provided does not contain information</Out>
            <Out color={COLORS.sky300}>about the boiling point of mercury. Therefore,</Out>
            <Out color={COLORS.sky300}>I cannot answer the question.</Out>
          </Show>
        </Terminal>
        <Reveal show={step >= 1} className="mt-12">
          <p className="font-display font-semibold text-[2.6rem]">Retrieval still handed it the handbook. <Cyan>The model said no anyway.</Cyan></p>
          <p className="font-mono text-[1.3rem] mt-4" style={{ color: COLORS.slate400 }}>k = 4 · RECALL_FLOOR = 0 → top-k always returns something</p>
        </Reveal>
      </div>
    ),
  },

  // 23 ─ When not to bother
  {
    id: 23, layout: 'comparison', title: 'When not to bother', steps: 2, speaker: 'A',
    speakerNotes: 'Honesty slide. A 0.6B model has a real ceiling. It is good at reading four passages and quoting them back with a citation, and at saying not in context. [next] It is not good at reasoning across many documents, long synthesis, or anything the corpus does not contain. When you hit that, change one env var for a bigger model, or register a hosted one. Same interface, same dashboards. Measure tokens per second and memory on your own hardware before you decide; I will not quote laptop numbers as if they were yours.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="6 · When not to bother" title={<>A 0.6B model <Cyan>has a real ceiling.</Cyan></>} />
        <div className="grid grid-cols-2 gap-12">
          <Card>
            <Label color={COLORS.sky300}>✓ good at</Label>
            <ul className="body-text space-y-5 mt-2">
              <li>Answering from a few retrieved passages</li>
              <li>Citing which passage it used</li>
              <li>Saying “not in context”</li>
              <li>Data that cannot leave the machine</li>
            </ul>
          </Card>
          <Reveal show={step >= 1}>
            <Card className="h-full">
              <Label color={COLORS.amber500}>✕ not for</Label>
              <ul className="body-text space-y-5 mt-2">
                <li>Reasoning across many documents</li>
                <li>Long, open-ended synthesis</li>
                <li>Knowledge outside your corpus</li>
              </ul>
            </Card>
          </Reveal>
        </div>
        <Reveal show={step >= 1} className="mt-10">
          <div className="rounded-2xl px-10 py-7 flex items-center justify-between" style={{ background: `${COLORS.slate800}99`, boxShadow: `0 0 0 2px ${COLORS.sky400}` }}>
            <span className="font-display font-semibold text-[2rem]">Outgrow it? <Cyan>Change one env var, or AddLLM a hosted model.</Cyan></span>
            <span className="font-mono text-[1.25rem]" style={{ color: COLORS.slate400 }}>same interface · same dashboards</span>
          </div>
        </Reveal>
      </div>
    ),
  },

  // 24 ─ Takeaways
  {
    id: 24, layout: 'checklist', title: 'Takeaways', steps: 3, speaker: 'A',
    speakerNotes: 'Three things to take home. One: you do not need to switch languages to ship LLM features. Everything tonight was Go. [next] Two: treat the model like any other dependency. Satisfy the interface and you inherit the observability you already trust. [next] Three: if a step is not in the trace, you cannot see it get slow. Twice today the most expensive step was invisible until I gave it a span.',
    content: (step) => (
      <div className="h-full flex flex-col justify-center">
        <Kicker>Takeaways</Kicker>
        <div className="space-y-14 mt-6">
          {[
            ['01', <>You do not need Python <Cyan>to ship LLM features in Go.</Cyan></>],
            ['02', <>Satisfy the interface, <Cyan>inherit the observability.</Cyan></>],
            ['03', <>Not in the trace? <Cyan>You cannot see it get slow.</Cyan></>],
          ].map(([n, t], i) => (
            <Reveal key={n as string} show={step >= i} className="flex items-baseline space-x-12">
              <span className="font-mono font-bold text-[2.6rem]" style={{ color: COLORS.sky400 }}>{n}</span>
              <span className="font-display font-bold text-[3.8rem] leading-tight tracking-tight">{t}</span>
            </Reveal>
          ))}
        </div>
      </div>
    ),
  },

  // 25 ─ Thanks
  {
    id: 25, layout: 'qr', title: 'Thank you', speaker: 'A',
    speakerNotes: 'One last thing: the network has been off since slide five. Everything you saw after that ran on this laptop. The code is open; scan for the agent. Thank you, happy to take questions.',
    content: () => (
      <div className="h-full grid grid-cols-[1fr_520px] gap-24 items-center">
        <div>
          <Kicker>{EVENT}</Kicker>
          <h2 className="h1-text font-display">Thank <Cyan>you.</Cyan></h2>
          <p className="body-text mt-8">Questions?</p>
          <div className="mt-16"><Socials /></div>
        </div>
        <div className="flex flex-col items-center">
          <div className="p-6 bg-white rounded-2xl" style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.10), 0 0 120px 40` }}>
            <img src="./gophercon_india_2026_qr.png" alt="QR code for the local-rag-agent source" className="w-[400px] h-[400px]" />
          </div>
          <div className="font-mono text-[1.2rem] mt-8 text-center" style={{ color: COLORS.slate400 }}>
            github.com/aryanmehrotra/agents<br /><W>agents/retrieval/local-rag-agent</W>
          </div>
          <img src="./brand/complete-gorg-logo.svg" alt="GoFr" className="mt-8 h-[110px] w-auto" />
        </div>
      </div>
    ),
  },
];

// ─── Deck chrome ──────────────────────────────────────────────────────────────────────────────────

const stepsOf = (i: number) => SLIDES[i].steps ?? 1;

const parseHash = (): [number, number] => {
  const m = window.location.hash.match(/^#\/(\d+)(?:\.(\d+))?$/);
  if (!m) return [0, 0];
  const i = Math.min(Math.max(parseInt(m[1], 10) - 1, 0), SLIDES.length - 1);
  const s = Math.min(Math.max(parseInt(m[2] ?? '0', 10), 0), stepsOf(i) - 1);
  return [i, s];
};

const SlideFrame = ({ slide, index, step }: { slide: SlideData, index: number, step: number }) => {
  const bare = slide.layout === 'qr' || index === 0;
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0 px-32 pt-24 pb-32">{slide.content(step)}</div>
      {!bare && (
        <div className="absolute bottom-0 left-0 right-0 h-24 px-32 flex items-center justify-between eyebrow text-[1rem]">
          <span className="flex items-center space-x-4"><img src="./brand/complete-gorg-logo.svg" alt="" className="h-9 w-auto" /><span>{TALK}</span></span>
          <div className="flex items-center space-x-6">
            <span>{EVENT}</span>
            <span className="text-white">{String(index + 1).padStart(2, '0')}<span className="opacity-40"> / {SLIDES.length}</span></span>
          </div>
        </div>
      )}
    </div>
  );
};

const PrintDeck = () => (
  <div>
    {SLIDES.map((s, i) => (
      <div key={s.id} className="print-page relative" style={{ width: STAGE_W, height: STAGE_H, background: COLORS.bg }}>
        <SlideFrame slide={s} index={i} step={stepsOf(i) - 1} />
      </div>
    ))}
  </div>
);

const App: React.FC = () => {
  const printMode = new URLSearchParams(window.location.search).has('print');
  const [[index, step], setPos] = useState<[number, number]>(parseHash);
  const [scale, setScale] = useState(1);
  const [notes, setNotes] = useState(false);

  useLayoutEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useEffect(() => {
    const h = `#/${index + 1}${step ? `.${step}` : ''}`;
    if (window.location.hash !== h) window.history.replaceState(null, '', h);
  }, [index, step]);

  const next = useCallback(() => setPos(([i, s]) => {
    if (s < stepsOf(i) - 1) return [i, s + 1];
    if (i < SLIDES.length - 1) return [i + 1, 0];
    return [i, s];
  }), []);

  const prev = useCallback(() => setPos(([i, s]) => {
    if (s > 0) return [i, s - 1];
    if (i > 0) return [i - 1, stepsOf(i - 1) - 1];
    return [i, s];
  }), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case 'ArrowRight': case ' ': case 'PageDown': case 'Enter': e.preventDefault(); next(); break;
        case 'ArrowLeft': case 'PageUp': case 'Backspace': e.preventDefault(); prev(); break;
        case 'Home': setPos([0, 0]); break;
        case 'End': setPos([SLIDES.length - 1, stepsOf(SLIDES.length - 1) - 1]); break;
        case 'f': case 'F':
          if (document.fullscreenElement) document.exitFullscreen();
          else document.documentElement.requestFullscreen();
          break;
        case 's': case 'S': setNotes(n => !n); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  if (printMode) return <PrintDeck />;

  const slide = SLIDES[index];
  const progress = ((index + (step + 1) / stepsOf(index)) / SLIDES.length) * 100;

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden cursor-none">
      <div style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, flexShrink: 0 }} className="relative">
        <SlideFrame key={slide.id} slide={slide} index={index} step={step} />
        <div className="absolute bottom-0 left-0 h-[3px] transition-all duration-500" style={{ width: `${progress}%`, background: COLORS.sky400 }}></div>
      </div>

      {notes && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0A101F]/95 border-t border-white/10 px-10 py-6 backdrop-blur">
          <div className="flex items-center justify-between eyebrow text-xs" style={{ color: COLORS.slate400 }}>
            <span>notes · {index + 1}. {slide.title} · step {step + 1}/{stepsOf(index)}</span>
            <span>next: {SLIDES[index + 1]?.title ?? 'end'}</span>
          </div>
          <p className="text-xl leading-relaxed text-white max-w-6xl mt-3">{slide.speakerNotes}</p>
        </div>
      )}
    </div>
  );
};

export default App;
