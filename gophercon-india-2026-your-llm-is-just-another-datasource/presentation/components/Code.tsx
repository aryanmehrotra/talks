import React from 'react';
import { COLORS } from '../constants';

// A small Go highlighter using gofr.dev's own code theme (gofr-dev/website src/styles/prism.css):
// text slate-50, keywords slate-300, functions pink-400, strings sky-300, punctuation slate-500,
// comments and operators slate-400. Line numbers are slate-600 behind a slate-300/5 rule, as in the
// site's hero editor. It only has to be right for the snippets on these slides.
const KEYWORDS = new Set([
  'func', 'return', 'if', 'else', 'for', 'range', 'var', 'const', 'type', 'struct', 'interface',
  'package', 'import', 'defer', 'go', 'map', 'switch', 'case', 'default', 'break', 'continue', 'chan',
]);

const TOKEN = /(\/\/.*$)|("(?:[^"\\]|\\.)*"|`[^`]*`|'[^']*')|([A-Za-z_][A-Za-z0-9_]*)(?=\s*\()|([A-Za-z_][A-Za-z0-9_]*)|(:=|==|!=|\/=|\*=|\+=|&&|\|\||[=+\-*/<>!&|])|([{}()[\],.;:])/g;

const renderLine = (line: string) => {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;

  while ((m = TOKEN.exec(line)) !== null) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const [tok, comment, str, call, ident, op, punct] = m;
    const k = m.index;

    if (comment) out.push(<span key={k} style={{ color: COLORS.slate400 }}>{tok}</span>);
    else if (str) out.push(<span key={k} style={{ color: COLORS.sky300 }}>{tok}</span>);
    else if (call && KEYWORDS.has(call)) out.push(<span key={k} style={{ color: COLORS.slate300 }}>{tok}</span>);
    else if (call) out.push(<span key={k} style={{ color: COLORS.pink400 }}>{tok}</span>);
    else if (ident && KEYWORDS.has(ident)) out.push(<span key={k} style={{ color: COLORS.slate300 }}>{tok}</span>);
    else if (op) out.push(<span key={k} style={{ color: COLORS.slate400 }}>{tok}</span>);
    else if (punct) out.push(<span key={k} style={{ color: COLORS.slate500 }}>{tok}</span>);
    else out.push(tok);

    last = k + tok.length;
  }

  if (last < line.length) out.push(line.slice(last));
  return out;
};

interface CodeProps {
  code: string;
  // 1-based line numbers to keep bright; every other line dims. Empty means all lines are bright.
  focus?: number[];
  // Line numbers, as in the gofr.dev hero editor. Off by default for one- or two-line snippets.
  numbers?: boolean;
}

export const Code: React.FC<CodeProps> = ({ code, focus = [], numbers }) => {
  const lines = code.replace(/^\n/, '').replace(/\n\s*$/, '').split('\n');
  const showNumbers = numbers ?? lines.length > 2;

  return (
    <div className="flex">
      {showNumbers && (
        <div className="select-none pr-5 mr-5 text-right" style={{ color: COLORS.slate600, borderRight: '1px solid rgba(203,213,225,0.05)' }}>
          {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
        </div>
      )}
      <div>
        {lines.map((line, i) => {
          const dim = focus.length > 0 && !focus.includes(i + 1);
          return (
            <div key={i} className="transition-opacity duration-500" style={{ opacity: dim ? 0.35 : 1 }}>
              {line === '' ? ' ' : renderLine(line)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// range(3, 6) -> [3, 4, 5, 6]; keeps the focus lists on each slide readable.
export const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
