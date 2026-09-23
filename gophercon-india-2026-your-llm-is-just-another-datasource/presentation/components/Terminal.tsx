import React from 'react';
import { COLORS } from '../constants';

// The code window from gofr.dev's hero (gofr-dev/website src/components/Hero.jsx): a translucent
// #0A101F panel with a white/10 ring, a sky-300 light along the top edge and a blue-400 one along the
// bottom, a faint sky→blue glow behind it, outline traffic lights, and the file name in the site's
// active-tab pill (sky gradient border, text-sky-300).
interface TerminalProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  fontSize?: number;
  // kept for call-site compatibility; the output pane of the old terminal no longer exists
  hideOutput?: boolean;
}

const TrafficLights = () => (
  <svg aria-hidden="true" viewBox="0 0 42 10" fill="none" className="h-[14px] w-auto">
    <circle cx="5" cy="5" r="4.5" stroke={COLORS.slate500} strokeOpacity="0.5" />
    <circle cx="21" cy="5" r="4.5" stroke={COLORS.slate500} strokeOpacity="0.5" />
    <circle cx="37" cy="5" r="4.5" stroke={COLORS.slate500} strokeOpacity="0.5" />
  </svg>
);

export const Terminal: React.FC<TerminalProps> = ({ children, title = "main.go", className = "", fontSize = 24 }) => (
  <div className={`relative w-full ${className}`}>
    <div className="absolute inset-0 rounded-2xl opacity-10 blur-lg"
         style={{ background: `linear-gradient(to top right, ${COLORS.sky300}, ${COLORS.sky300}b3, ${COLORS.blue300})` }}></div>
    <div className="absolute inset-0 rounded-2xl opacity-10"
         style={{ background: `linear-gradient(to top right, ${COLORS.sky300}, ${COLORS.sky300}b3, ${COLORS.blue300})` }}></div>
    <div className="relative h-full rounded-2xl backdrop-blur flex flex-col"
         style={{ background: `${COLORS.codeBg}cc`, boxShadow: '0 0 0 1px rgba(255,255,255,0.10)' }}>
      <div className="absolute -top-px left-20 right-11 h-px" style={{ background: `linear-gradient(to right, ${COLORS.sky300}00, ${COLORS.sky300}b3, ${COLORS.sky300}00)` }}></div>
      <div className="absolute -bottom-px left-11 right-20 h-px" style={{ background: `linear-gradient(to right, ${COLORS.blue400}00, ${COLORS.blue400}, ${COLORS.blue400}00)` }}></div>

      <div className="flex items-center space-x-6 px-7 pt-6">
        <TrafficLights />
        <div className="rounded-full p-px" style={{ background: `linear-gradient(to right, ${COLORS.sky400}4d, ${COLORS.sky400}, ${COLORS.sky400}4d)` }}>
          <div className="rounded-full px-4 py-1 font-mono text-[16px] font-medium" style={{ background: COLORS.slate800, color: COLORS.sky300 }}>
            {title}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-hide px-7 pt-6 pb-7 font-mono leading-[1.6]"
           style={{ fontSize, color: COLORS.slate50 }}>
        <div className="whitespace-pre min-w-max">{children}</div>
      </div>
    </div>
  </div>
);
