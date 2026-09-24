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

// ─── Architecture diagrams (HLD / LLD slides) ─────────────────────────────────────────────────────
// Boxes on a fixed canvas plus SVG elbow arrows. Coordinates are canvas pixels; the canvas is the
// slide's content width (1664) by `h`. Only the deck's palette is used.
type DTone = 'gofr' | 'kronk' | 'hw' | 'ext' | 'warn' | 'plain';
type Side = 't' | 'r' | 'b' | 'l';
interface DNode { id: string; x: number; y: number; w: number; h: number; title: React.ReactNode; sub?: React.ReactNode[]; tone?: DTone; mono?: boolean; show?: boolean; }
interface DEdge { from: string; to: string; fs?: Side; ts?: Side; label?: string; dashed?: boolean; show?: boolean; }
interface DGroup { x: number; y: number; w: number; h: number; label: string; show?: boolean; }

const toneBox = (t: DTone = 'plain'): React.CSSProperties => {
  switch (t) {
    case 'gofr': return { background: `${COLORS.slate800}e6`, boxShadow: `0 0 0 2px ${COLORS.sky400}` };
    case 'kronk': return { background: `${COLORS.slate800}e6`, boxShadow: `0 0 0 2px ${COLORS.indigo400}` };
    case 'hw': return { background: `${COLORS.slate800}99`, boxShadow: `0 0 0 2px ${COLORS.slate500}` };
    case 'ext': return { background: 'transparent', border: `2px dashed ${COLORS.slate400}` };
    case 'warn': return { background: `${COLORS.slate800}e6`, boxShadow: `0 0 0 2px ${COLORS.amber500}` };
    default: return { background: `${COLORS.slate800}cc`, boxShadow: '0 0 0 1px rgba(203,213,225,0.18)' };
  }
};

const anchor = (n: DNode, s: Side): [number, number] =>
  s === 'r' ? [n.x + n.w, n.y + n.h / 2] : s === 'l' ? [n.x, n.y + n.h / 2] : s === 't' ? [n.x + n.w / 2, n.y] : [n.x + n.w / 2, n.y + n.h];

const edgePath = (a: [number, number], b: [number, number], s: Side) => {
  if (s === 'r' || s === 'l') {
    const mx = (a[0] + b[0]) / 2;
    return { d: `M ${a[0]} ${a[1]} H ${mx} V ${b[1]} H ${b[0]}`, mid: [mx, (a[1] + b[1]) / 2] as [number, number] };
  }
  const my = (a[1] + b[1]) / 2;
  return { d: `M ${a[0]} ${a[1]} V ${my} H ${b[0]} V ${b[1]}`, mid: [(a[0] + b[0]) / 2, my] as [number, number] };
};

const Diagram = ({ nodes, edges = [], groups = [], h = 620 }: { nodes: DNode[], edges?: DEdge[], groups?: DGroup[], h?: number }) => {
  const byId: Record<string, DNode> = Object.fromEntries(nodes.map(n => [n.id, n]));
  const vis = (v?: boolean): React.CSSProperties => ({ opacity: v === false ? 0 : 1, transition: 'opacity 450ms ease' });
  return (
    <div className="relative" style={{ width: 1664, height: h }}>
      {groups.map((g, i) => (
        <div key={i} className="absolute rounded-3xl" style={{ left: g.x, top: g.y, width: g.w, height: g.h, border: `2px solid ${COLORS.sky300}55`, background: `${COLORS.sky300}08`, ...vis(g.show) }}>
          <div className="absolute -top-4 left-8 px-3 eyebrow text-[1.05rem]" style={{ background: COLORS.bg, color: COLORS.sky300 }}>{g.label}</div>
        </div>
      ))}
      <svg className="absolute inset-0 pointer-events-none" width={1664} height={h} viewBox={`0 0 1664 ${h}`}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={COLORS.slate400} />
          </marker>
        </defs>
        {edges.map((e, i) => {
          const fs = e.fs ?? 'r';
          const { d } = edgePath(anchor(byId[e.from], fs), anchor(byId[e.to], e.ts ?? 'l'), fs);
          return <path key={i} d={d} fill="none" stroke={COLORS.slate400} strokeWidth={2.5} strokeDasharray={e.dashed ? '8 7' : undefined} markerEnd="url(#arrow)" style={vis(e.show)} />;
        })}
      </svg>
      {edges.map((e, i) => {
        if (!e.label) return null;
        const fs = e.fs ?? 'r';
        const { mid } = edgePath(anchor(byId[e.from], fs), anchor(byId[e.to], e.ts ?? 'l'), fs);
        return (
          <div key={`l${i}`} className="absolute -translate-x-1/2 -translate-y-1/2 px-2 rounded font-mono text-[1rem] whitespace-nowrap"
               style={{ left: mid[0], top: mid[1], background: COLORS.bg, color: COLORS.slate300, ...vis(e.show) }}>{e.label}</div>
        );
      })}
      {nodes.map(n => (
        <div key={n.id} className="absolute rounded-2xl px-6 flex flex-col justify-center" style={{ left: n.x, top: n.y, width: n.w, height: n.h, ...toneBox(n.tone), ...vis(n.show) }}>
          <div className={n.mono ? 'font-mono text-[1.3rem] text-white' : 'font-display font-semibold text-[1.45rem] text-white leading-tight'}>{n.title}</div>
          {n.sub?.map((s, i) => <div key={i} className="font-mono text-[1.02rem] mt-1 leading-snug" style={{ color: COLORS.slate300 }}>{s}</div>)}
        </div>
      ))}
    </div>
  );
};

const DLegend = ({ items }: { items: [DTone, string][] }) => (
  <div className="flex space-x-8 mt-5 text-[1.1rem]" style={{ color: COLORS.slate400 }}>
    {items.map(([t, l]) => (
      <span key={l} className="flex items-center"><span className="inline-block w-7 h-4 mr-3 rounded" style={toneBox(t)}></span>{l}</span>
    ))}
  </div>
);

// Where a slide's facts come from.
const Src = ({ children }: { children: React.ReactNode }) => (
  <div className="font-mono text-[1.05rem] mt-6" style={{ color: COLORS.slate500 }}>{children}</div>
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
    speakerNotes: 'Quick intro. I maintain GoFr, an open-source Go framework. It matters here for one reason: the model you are about to see plugs into GoFr exactly the way a database does.',
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
    speakerNotes: 'Raise your hand if you have been told this. You want to do anything with LLMs, go learn Python. [next] I do not think that is true. [next] And I would rather show it than argue about it. So first, sixty seconds of it working.',
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

  // 3b ─ Teaser: one question, 60 seconds
  {
    id: 40, layout: 'code', title: 'Teaser: one question', steps: 2, speaker: 'A',
    speakerNotes: 'LIVE, sixty seconds, no explanation yet. The handbook is already ingested. Switch to the terminal and ask one question. [next] An answer, with a citation, from a model running inside this Go process. Now: hold on to that. For the next fifteen minutes I will show you how it works, and at the end we do the whole thing again, properly, with the network off. Fallback if the terminal is not ready: this slide is the recorded output.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <div className="flex items-start justify-between">
          <Header kicker="Sixty seconds" title={<>One question. <Cyan>Answered inside this Go process.</Cyan></>} />
          <LiveBadge />
        </div>
        <Terminal title="local-rag-agent · :8010" hideOutput fontSize={29}>
          <Prompt>POST /ask  "how many days can I work from home?"</Prompt>
          <Gap />
          <Show when={step >= 1}>
            <Out>Employees may work up to 3 days per week remotely <Cyan>[1]</Cyan>.</Out>
            <Out color={COLORS.slate400}>└ source=handbook  cosine=0.79</Out>
          </Show>
        </Terminal>
        <Reveal show={step >= 1} className="mt-14">
          <p className="font-display font-semibold text-[2.6rem]">Hold on to that. <Cyan>Here is how it works.</Cyan></p>
          <p className="body-text mt-4">At the end we do it again, properly, with the network off.</p>
        </Reveal>
      </div>
    ),
  },

  // 6 ─ How it runs
  {
    id: 6, layout: 'diagram', title: 'How it runs', steps: 3, speaker: 'A',
    speakerNotes: 'Here is the whole thing. One Go binary. Both models are GGUF files loaded into this process on llama.cpp, through Kronk from Ardan Labs. [next] The chat model is Qwen3 0.6B at Q8, 639 MB on disk. The embedder is EmbeddingGemma 300M, 329 MB. [next] No model server, no model sidecar, no key. The vectors live in SurrealDB, which is just a database on localhost, the same as any service already has.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="1 · How it runs" title={<>Two GGUF models. <Cyan>Inside the process.</Cyan></>} />
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

  // 6a ─ Kronk HLD
  {
    id: 28, layout: 'diagram', title: 'Kronk: architecture', steps: 2, speaker: 'A',
    speakerNotes: 'The architecture, top to bottom. The handler calls the model. The model is two Kronk instances, one for chat and one for embeddings. Kronk reaches llama.cpp through yzma, which opens the llama.cpp libraries while the program is running, so there is no cgo and a plain go build. llama.cpp runs every layer on the GPU, Metal on this Mac. [next] And on the right, why the demo survives the network being pulled. At start-up Kronk sends a HEAD to huggingface.co with a five-second timeout. The first run downloads llama.cpp, pinned by Kronk to b10107, and both model files, each with a sha256 next to it. Every run after that finds everything on disk and never needs the network. One trap: KRONK_SKIP_NETWORK_CHECK means assume online. Leave it unset.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="1 · How it runs · Kronk" title={<>Kronk, top to bottom. <Cyan>No cgo, no server, one disk cache.</Cyan></>} />
        <Diagram h={600}
          groups={[{ x: 0, y: 14, w: 1000, h: 586, label: 'one Go process' }]}
          nodes={[
            { id: 'h', x: 40, y: 50, w: 920, h: 84, title: 'GoFr handler', sub: ['c.LLM().Chat(…)  ·  embedText(…)'], tone: 'gofr' },
            { id: 'k', x: 40, y: 178, w: 920, h: 96, title: 'Kronk SDK · two instances', sub: ['chat: Qwen3-0.6B  ·  embed: EmbeddingGemma-300M'], tone: 'kronk' },
            { id: 'y', x: 40, y: 318, w: 920, h: 84, title: 'yzma · loads llama.cpp while the program runs', sub: ['no cgo  ·  plain go build  ·  swap builds without recompiling'], tone: 'kronk' },
            { id: 'l', x: 40, y: 446, w: 920, h: 110, title: 'llama.cpp b10107', sub: ['libllama + ggml .dylib files  ·  pinned by Kronk'], tone: 'hw' },
            { id: 'g', x: 1110, y: 460, w: 554, h: 84, title: 'Metal GPU', sub: ['all layers offloaded by default'], tone: 'hw' },
            { id: 'n', x: 1110, y: 14, w: 554, h: 84, title: 'huggingface.co', sub: ['HEAD probe, 5 s timeout  ·  first run only'], tone: 'ext', show: step >= 1 },
            { id: 'd', x: 1110, y: 140, w: 554, h: 190, title: '~/.kronk  (disk)', sub: ['libraries/darwin/arm64/metal/', 'models/<owner>/<repo>/*.gguf', 'models/…/sha/*   sha256 + size', 'on disk → no download'], tone: 'plain', show: step >= 1 },
          ]}
          edges={[
            { from: 'h', to: 'k', fs: 'b', ts: 't' },
            { from: 'k', to: 'y', fs: 'b', ts: 't' },
            { from: 'y', to: 'l', fs: 'b', ts: 't' },
            { from: 'l', to: 'g', label: 'offload' },
            { from: 'n', to: 'd', fs: 'b', ts: 't', dashed: true, label: 'download once', show: step >= 1 },
            { from: 'k', to: 'd', label: 'reads', show: step >= 1 },
          ]}
        />
        <DLegend items={[['gofr', 'GoFr'], ['kronk', 'Kronk'], ['hw', 'llama.cpp / hardware'], ['ext', 'network']]} />
      </div>
    ),
  },

  // 6b ─ Kronk LLD
  {
    id: 29, layout: 'diagram', title: 'Kronk: one request', steps: 2, speaker: 'A',
    speakerNotes: 'One request, in detail. A chat call without a deadline on its context is refused. With one, it goes through a gate: a buffered channel of size NSeqMax times two, so two places by default, and one sequence decodes at a time. Request C waits in a select until a place frees or its context expires, 120 seconds in this agent. Inside, the batch engine renders the Jinja chat template from the GGUF, decodes tokens onto a channel, and Chat ranges over that channel until it closes. So the answer is complete when Chat returns; nothing is lazy. Tokens per second is output minus one over decode time, and the clock starts at the first output token, so it is decode speed only. [next] Embeddings are the same shape with a gate of one, a pool of llama contexts, and 768 floats that are L2-normalised to length one. That is why the cosine search in SurrealDB is really a dot product.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="1 · How it runs · Kronk" title={<>One request, in detail. <Cyan>A gate, then a pipeline.</Cyan></>} />
        <Diagram h={600}
          nodes={[
            { id: 'a', x: 0, y: 20, w: 200, h: 56, title: 'request A', mono: true },
            { id: 'b', x: 0, y: 92, w: 200, h: 56, title: 'request B', mono: true },
            { id: 'c', x: 0, y: 164, w: 200, h: 56, title: 'request C', mono: true },
            { id: 'gate', x: 270, y: 40, w: 300, h: 150, title: 'gate · 2 places', sub: ['chan struct{}', 'cap = NSeqMax × 2', 'no deadline → refused'], tone: 'kronk' },
            { id: 'wait', x: 270, y: 232, w: 300, h: 124, title: 'C waits', sub: ['select: slot, or ctx.Done()', 'here: 120 s deadline'], tone: 'warn' },
            { id: 'be', x: 640, y: 60, w: 230, h: 110, title: 'batch engine', sub: ['1 decode slot'], tone: 'kronk' },
            { id: 'tp', x: 900, y: 60, w: 230, h: 110, title: 'chat template', sub: ['Jinja · from GGUF'], tone: 'kronk' },
            { id: 'dc', x: 1160, y: 60, w: 230, h: 110, title: 'decode', sub: ['tokens → channel'], tone: 'hw' },
            { id: 'dr', x: 1420, y: 60, w: 244, h: 110, title: 'drain → reply', sub: ['for msg := range ch', 'complete on return'], tone: 'kronk' },
            { id: 'u', x: 1160, y: 238, w: 504, h: 96, title: 'tokens/sec = (out − 1) / decode time', sub: ['clock starts at the first output token'], tone: 'plain' },
            { id: 'e0', x: 0, y: 460, w: 200, h: 110, title: 'embedText', mono: true, show: step >= 1 },
            { id: 'eg', x: 270, y: 460, w: 300, h: 110, title: 'gate · 1 place', sub: ['cap = NSeqMax'], tone: 'kronk', show: step >= 1 },
            { id: 'ep', x: 640, y: 460, w: 230, h: 110, title: 'context pool', sub: ['one llama context'], tone: 'kronk', show: step >= 1 },
            { id: 'ed', x: 900, y: 460, w: 230, h: 110, title: 'tokenize → decode', tone: 'hw', show: step >= 1 },
            { id: 'ef', x: 1160, y: 460, w: 230, h: 110, title: '768 floats', sub: ['model width'], tone: 'hw', show: step >= 1 },
            { id: 'en', x: 1420, y: 460, w: 244, h: 110, title: 'L2 normalise', sub: ['‖v‖ = 1', 'cosine = dot'], tone: 'kronk', show: step >= 1 },
          ]}
          edges={[
            { from: 'a', to: 'gate' }, { from: 'b', to: 'gate' },
            { from: 'c', to: 'wait', dashed: true },
            { from: 'gate', to: 'be' }, { from: 'be', to: 'tp' }, { from: 'tp', to: 'dc' }, { from: 'dc', to: 'dr' },
            { from: 'dr', to: 'u', fs: 'b', ts: 't', dashed: true, label: 'Usage' },
            { from: 'e0', to: 'eg', show: step >= 1 }, { from: 'eg', to: 'ep', show: step >= 1 }, { from: 'ep', to: 'ed', show: step >= 1 },
            { from: 'ed', to: 'ef', show: step >= 1 }, { from: 'ef', to: 'en', show: step >= 1 },
          ]}
        />
        <Src>kronk@v1.29.3 · sdk/kronk/kronk.go · acquire.go · model/chat.go · model/batch_finish.go · model/embed.go</Src>
      </div>
    ),
  },

  // 8 ─ GoFr, minimal
  {
    id: 8, layout: 'grid', title: 'GoFr', steps: 2, speaker: 'A',
    speakerNotes: 'One slide on GoFr, because the rest of the talk leans on one idea from it. You register a datasource once. [next] From then on every call through it gets a span, metrics, a debug log line, and a place on the health endpoint. You do not write that code. Hold on to that, because an LLM is about to become one of these.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="2 · The idea" title={<>Register a datasource once.<br /><Cyan>Every call through it is observed.</Cyan></>} />
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
        <Header kicker="2 · The idea" title={<>A model call has the same shape<br /><Cyan>as a database call.</Cyan></>} />
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
    speakerNotes: 'The whole contract. Three methods: Chat, HealthCheck, Name. Name is the health key and the default label. [next] The rest is optional and discovered by type assertion. Descriptor gives dashboards a real provider and model label instead of one generic name. StreamingModel adds Stream. And Embedder, added in GoFr v1.60, puts embeddings through the same path, with an llm.embed span.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="2 · The idea" title={<>The contract is <Cyan>three methods.</Cyan> The rest is optional.</>} />
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
          <Header kicker="2 · The idea" title={<>Chat() is a translation layer. <Cyan>Nothing else.</Cyan></>} />
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
        <Header kicker="2 · The idea" title={<>Register once. <Cyan>The handler never knows it is local.</Cyan></>} />
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

  // 12a ─ GoFr LLD: AddLLM and the decorator
  {
    id: 26, layout: 'diagram', title: 'GoFr: inside c.LLM()', steps: 2, speaker: 'A',
    speakerNotes: 'What GoFr does with your model, in two moments. At start-up, AddLLM ignores a nil model, even a typed-nil pointer, and the first model registers the two LLM metrics, once. Then the container stores it twice. A wrapped copy, built once with metrics, a tracer and the logger: that is what c.LLM() returns. And the raw model, which only the health endpoint calls, so a health probe never creates an llm span or bumps the request counter. Ask for a name that does not exist and you get ErrLLMNotConfigured, not a nil-pointer panic. [next] On every request, the handler calls c.LLM().Chat. That goes into the decorator: it starts the llm.chat span, calls your model inside it, which calls Kronk, then records a span with provider, model and token counts, a request counter, a token histogram, and one log line with the trace id. Debug on success, error on failure. And it never records the prompt or the answer. Counts and labels only.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="2 · The idea · GoFr" title={<>Registered once, wrapped once. <Cyan>Every call goes through the decorator.</Cyan></>} />
        <Diagram h={610}
          groups={[{ x: 390, y: 14, w: 530, h: 596, label: 'container' }]}
          nodes={[
            { id: 'add', x: 0, y: 40, w: 330, h: 96, title: 'app.AddLLM(model)', sub: ['once, at start-up'], mono: true, tone: 'gofr' },
            { id: 'chk', x: 0, y: 186, w: 330, h: 120, title: 'guards', sub: ['nil / typed-nil → ignore', 'first model → register', 'the LLM metrics, once'], tone: 'plain' },
            { id: 'hl', x: 0, y: 467, w: 330, h: 96, title: '/.well-known/health', mono: true, sub: ['asks the raw model'], tone: 'plain' },
            { id: 'wr', x: 430, y: 50, w: 450, h: 110, title: 'llms[name]  · wrapped', sub: ['ai.NewLLM(model, deps)', 'what c.LLM() returns'], tone: 'gofr' },
            { id: 'dp', x: 430, y: 214, w: 450, h: 120, title: 'deps', sub: ['metrics manager', 'tracer "gofr-llm"', 'logger'], tone: 'plain' },
            { id: 'raw', x: 430, y: 460, w: 450, h: 110, title: 'llmModels[name]  · raw', sub: ['the same model, unwrapped', 'for health checks only'], tone: 'plain' },
            { id: 'hd', x: 1000, y: 30, w: 664, h: 80, title: 'handler: c.LLM().Chat(c, msgs)', mono: true, tone: 'gofr', show: step >= 1 },
            { id: 'dec', x: 1000, y: 160, w: 664, h: 120, title: 'decorator · Instrument', sub: ['start span "llm." + op', 'call your model inside it', 'record  →  end span'], tone: 'gofr', show: step >= 1 },
            { id: 'md', x: 1000, y: 330, w: 664, h: 80, title: 'chatModel.Chat → Kronk → llama.cpp', mono: true, tone: 'kronk', show: step >= 1 },
            { id: 'rec', x: 1000, y: 460, w: 664, h: 140, title: 'recorded: counts and labels, never the prompt', sub: ['span llm.chat · provider · model · tokens', 'app_llm_request_count · app_llm_tokens_per_request', 'log: debug ok, error fail, with trace_id'], tone: 'plain', show: step >= 1 },
          ]}
          edges={[
            { from: 'add', to: 'chk', fs: 'b', ts: 't' },
            { from: 'add', to: 'wr' },
            { from: 'wr', to: 'dp', fs: 'b', ts: 't', label: 'built with' },
            { from: 'hl', to: 'raw' },
            { from: 'hd', to: 'dec', fs: 'b', ts: 't', show: step >= 1 },
            { from: 'wr', to: 'dec', dashed: true, show: step >= 1 },
            { from: 'dec', to: 'md', fs: 'b', ts: 't', show: step >= 1 },
            { from: 'md', to: 'rec', fs: 'b', ts: 't', show: step >= 1 },
          ]}
        />
        <Src>gofr@v1.58.0 · external_db.go (AddLLM) · container/container.go (SetLLM) · ai/llm.go · ai/instrument.go</Src>
      </div>
    ),
  },

  // 12c ─ GoFr: c is the context
  {
    id: 34, layout: 'code', title: 'GoFr: c is the context', steps: 2, speaker: 'A',
    speakerNotes: 'Why does every span land under the request without anyone threading a context? Because gofr.Context embeds three things: a context.Context, the request, and the container. c.LLM and c.SurrealDB are promoted from the container. And c itself is a context.Context, the one GoFr\'s tracing middleware made when it extracted any incoming traceparent and started the POST /ask span. [next] So passing c as the ctx argument is the whole trick. The SurrealDB span, llm.chat, and the spans inside our model all nest under the request, and a traceparent from the caller carries straight through.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="2 · The idea · GoFr" title={<>Every span nests under the request <Cyan>because c is the context.</Cyan></>} />
        <div className="grid grid-cols-[1.25fr_1fr] gap-12 items-start">
          <div>
            <Terminal title="gofr · context.go (trimmed)" hideOutput fontSize={21}>
              <Code focus={step === 0 ? [] : [2]} code={`
type Context struct {
	context.Context      // span-scoped: children nest under the request
	Request              // c.Bind, c.Param, …
	*container.Container // c.LLM(), c.SurrealDB, c.Logger
	responder Responder
}
`} />
            </Terminal>
            <Reveal show={step >= 1}>
              <Caption><Mono className="text-white">c.LLM().Chat(c, …)</Mono>: passing <Mono className="text-white">c</Mono> as the ctx <W>is the whole trick.</W></Caption>
            </Reveal>
          </div>
          <Reveal show={step >= 1}>
            <Card className="!p-8">
              <Label>span tree · one /ask</Label>
              <pre className="font-mono text-[1.3rem] leading-[1.9] m-0">
                <span className="text-white">POST /ask</span>{'\n'}
                <span style={{ color: COLORS.slate500 }}>├─ </span><span style={{ color: COLORS.sky400 }}>kronk.embed</span>{'\n'}
                <span style={{ color: COLORS.slate500 }}>├─ </span><span style={{ color: COLORS.sky300 }}>SurrealDB.Query</span>{'\n'}
                <span style={{ color: COLORS.slate500 }}>└─ </span><span style={{ color: COLORS.sky300 }}>llm.chat</span>{'\n'}
                <span style={{ color: COLORS.slate500 }}>   └─ </span><span style={{ color: COLORS.sky400 }}>kronk.generate</span>
              </pre>
              <div className="text-[1.15rem] mt-5" style={{ color: COLORS.slate400 }}>root span started by GoFr's tracing middleware, continuing any incoming <Mono>traceparent</Mono></div>
            </Card>
          </Reveal>
        </div>
        <Src>gofr@v1.58.0 · pkg/gofr/context.go · pkg/gofr/http/middleware/tracer.go</Src>
      </div>
    ),
  },

  // 12d ─ GoFr: duck typing and health
  {
    id: 35, layout: 'code', title: 'GoFr: datasources and health', steps: 2, speaker: 'A',
    speakerNotes: 'How does any datasource get a logger, metrics and a tracer? Duck typing. instrumentDatasource checks for UseLogger, UseMetrics, UseTracer, UseConfig and Connect, and calls each one only if the datasource has it. The datasource never has to import GoFr. That is how SurrealDB gets its SurrealDB.Query span. [next] Health works the same way. The endpoint asks every datasource, and for the model it asks the raw model, not the wrapper, so a health probe never creates an llm span or bumps the request counter. Everything UP means UP; anything DOWN means DEGRADED. One honest gap: at this version the health map has no SurrealDB entry, so the vector store is not on it.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="2 · The idea · GoFr" title={<>Datasources plug in by duck typing. <Cyan>Health asks the raw model.</Cyan></>} />
        <div className="grid grid-cols-[1.25fr_1fr] gap-12 items-start">
          <Terminal title="gofr · external_db.go · instrumentDatasource (trimmed)" hideOutput fontSize={19}>
            <Code code={`
func (a *App) instrumentDatasource(ds any) {
	if l, ok := ds.(interface{ UseLogger(any) }); ok {
		l.UseLogger(a.Logger())
	}
	if m, ok := ds.(interface{ UseMetrics(any) }); ok {
		m.UseMetrics(a.Metrics())
	}
	if t, ok := ds.(interface{ UseTracer(any) }); ok {
		t.UseTracer(tracer) // "gofr-surrealdb", …
	}
	if c, ok := ds.(interface{ Connect() }); ok {
		c.Connect()
	}
}
`} />
          </Terminal>
          <Reveal show={step >= 1}>
            <Card className="!p-8">
              <Label>GET /.well-known/health</Label>
              <pre className="font-mono text-[1.2rem] leading-[1.7] m-0" style={{ color: COLORS.slate50 }}>{`{"data": {
  "llm": {"status": "UP", …},
  "name": "local-rag-agent",
  "status": "UP"
}}`}</pre>
              <div className="text-[1.2rem] mt-5 space-y-2" style={{ color: COLORS.slate300 }}>
                <div><Mono className="text-white">llm</Mono> is the raw model: no span, no metrics.</div>
                <div>Any dependency DOWN → <W>DEGRADED</W>.</div>
              </div>
            </Card>
          </Reveal>
        </div>
        <Src>gofr@v1.58.0 · pkg/gofr/external_db.go:51 · pkg/gofr/container/health.go</Src>
      </div>
    ),
  },

  // 13 ─ What you get
  {
    id: 13, layout: 'grid', title: 'What you get', steps: 3, speaker: 'A',
    speakerNotes: 'What came from the interface. A trace: POST /ask, the SurrealDB query, llm.chat. Solid bars are GoFr. The two dashed ones the agent adds itself: in-process there is no network call to trace, so the embedding and the generation step get named by hand. [next] Metrics: the local model shows up as provider kronk, next to every hosted model. [next] Health: the model is a key on the health endpoint. Tokens per second is an attribute on my own generate span, not a GoFr metric.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="2 · The idea" title={<>Tracing, metrics, health from the interface. <Cyan>Two spans I added by hand.</Cyan></>} />
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

  // 15 ─ Same move, twice more
  {
    id: 15, layout: 'split', title: 'Same move', steps: 3, speaker: 'A',
    speakerNotes: 'This is not really about models. Kronk has its own logger type: a function taking a context, a message and args. One adapter pointed at GoFr, and every llama.cpp load line comes out in GoFr format, at GoFr level. [next] The vector store is the same move. I wrote no vector-database integration. SurrealDB is an ordinary GoFr datasource, and the cosine search is just a query, traced as SurrealDB.Query. [next] And if you do not use GoFr: wrap your model client in a decorator that opens a span, records usage and reports health. That is all AddLLM does for you.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="2 · The idea" title={<>Same move, twice more. <Cyan>Any interface, same observability.</Cyan></>} />
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

  // 21 ─ Grounding
  {
    id: 21, layout: 'code', title: 'Grounding', steps: 2, speaker: 'A',
    speakerNotes: 'Grounding is two things. A system prompt: only these passages, cite them, and say so if the answer is not there. [next] And a floor. Raise RECALL_FLOOR and weak matches are dropped; if nothing is left, the model is never called at all. In this demo the floor is zero, so retrieval always hands the model something. You will see what that does in the demo.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <Header kicker="3 · Grounding" title={<>Grounding is a prompt <Cyan>and a floor.</Cyan></>} />
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

  // 4 ─ Demo: ingest + ask
  {
    id: 4, layout: 'code', title: 'Demo: ingest and ask', steps: 3, speaker: 'A',
    speakerNotes: 'LIVE DEMO. Switch to the terminal. POST /ingest with the handbook text. It is chunked, embedded by a model inside the process, and stored in SurrealDB. [next] Ask a question that needs two facts. [next] Two facts, both cited [1], plus the cosine score of the passage that grounded them. The live API prints JSON; this slide is the same session, formatted. If the demo breaks, stay on this slide and narrate it.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <div className="flex items-start justify-between">
          <Header kicker="4 · Live, offline" title={<>Ingest a doc. Ask a question.<br /><Cyan>Get an answer with citations.</Cyan></>} />
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
    speakerNotes: 'Now I turn Wi-Fi off. Actually do it and show the menu bar. Check at the venue that the clicker and the projector do not ride on Wi-Fi. [next] Ask again. Same answer, same citation. [next] No API key exists to set, and no prompt leaves this laptop. What is left on the network is loopback: SurrealDB and the trace collector, both on localhost. One honest footnote: GoFr sends an anonymous start-up ping by default; GOFR_TELEMETRY=false turns it off, and it is off here. Wi-Fi stays off for the rest of the demo.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <div className="flex items-start justify-between">
          <Header kicker="4 · Live, offline" title={<>Now I pull the network.</>} />
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

  // 14 ─ Live: show the trace
  {
    id: 14, layout: 'code', title: 'Live: the evidence', steps: 3, speaker: 'A',
    speakerNotes: 'LIVE DEMO, Wi-Fi still off. Pre-flight: the Jaeger all-in-one from the agents repo observability/ folder is running, and the /ask from a minute ago is already in it. Open Jaeger on 16686, pick local-rag-agent, open the /ask trace, expand llm.chat and point at kronk.generate and its tokens-per-second attribute. [next] Metrics: grep app_llm, point at provider kronk. [next] Health: the llm key is UP. Fallback if anything is down: describe the "what you get" slide, it is the same picture.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <div className="flex items-start justify-between">
          <Header kicker="4 · Live, offline" title={<>Same request, <Cyan>Wi-Fi still off.</Cyan></>} />
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

  // 22 ─ Deliberate miss
  {
    id: 22, layout: 'code', title: 'A deliberate miss', steps: 2, speaker: 'A',
    speakerNotes: 'LIVE DEMO. Something the handbook cannot answer. With the floor at zero, retrieval still returns the top four, so the model is handed the handbook anyway. [next] And it refuses. That is the prompt doing its job. Before the talk, run this question a dozen times and quote the real refusal rate here instead of an adjective. Fallback: this slide is the recorded output.',
    content: (step) => (
      <div className="h-full flex flex-col">
        <div className="flex items-start justify-between">
          <Header kicker="4 · Live, offline" title={<>Now I ask something <Cyan>the corpus cannot answer.</Cyan></>} />
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
        <Header kicker="5 · When not to bother" title={<>A 0.6B model <Cyan>has a real ceiling.</Cyan></>} />
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
    speakerNotes: 'Three things to take home. One: you do not need to switch languages to ship LLM features. Everything tonight was Go. [next] Two: treat the model like any other dependency. Satisfy the interface and you inherit the observability you already trust. [next] Three: if a step is not in the trace, you cannot see it get slow. The embedding and the generation step were invisible until they got a span of their own.',
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
    speakerNotes: 'One last thing: the network has been off since the demo started. Everything you saw in it ran on this laptop. The code is open; scan for the agent. Thank you, happy to take questions.',
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
