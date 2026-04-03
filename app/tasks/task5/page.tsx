'use client'
import { useState, useRef, useEffect, useCallback } from "react";

/* ══════════════════════════════ CONSTANTS ══════════════════════════════════ */
const RISK_COLOR = { LOW: "#00cc66", MEDIUM: "#ffaa00", HIGH: "#ff5500", CRITICAL: "#ff0033" } as const;
const RISK_PCT = { LOW: 15, MEDIUM: 45, HIGH: 72, CRITICAL: 100 } as const;
const OV_COLOR = { OFF: "#336633", PARTIAL: "#aa7700", ACTIVE: "#cc0022" } as const;
const OV_PCT = { OFF: 0, PARTIAL: 50, ACTIVE: 100 } as const;
const CAT_COLOR: Record<string, string> = {
  "SYSTEM NOTICE": "#0088cc", "ENGINEER LOG": "#00aaaa", "SYSTEM ALERT": "#ffaa00",
  "FIRMWARE LOG": "#aa44cc", "FIRMWARE UPDATE": "#aa44cc", "SYSTEM WARNING": "#ff6600",
  "OVERRIDE REQUEST": "#ff0033", "SYSTEM UPDATE": "#0066ff",
  "SYSTEM FAILURE": "#ff0000", "INCIDENT": "#cc0000",
};
const stabColor = (v: number) => v >= 85 ? "#00cc66" : v >= 70 ? "#88cc00" : v >= 50 ? "#ffaa00" : "#ff2200";
const stabLabel = (v: number) => v >= 95 ? "VERY STABLE" : v >= 85 ? "STABLE" : v >= 70 ? "DEGRADING" : v >= 50 ? "CRITICAL" : "COLLAPSE";

/* ══════════════════════════════ TYPES ══════════════════════════════════════ */
type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type OverrideLevel = "OFF" | "PARTIAL" | "ACTIVE";
type Phase = "TIMELINE" | "COMPLETE";

interface EvResult {
  sc: number; stab: number; risk: RiskLevel; ov: OverrideLevel;
  chat?: string; rd?: string; noData?: boolean;
}
interface GameEvent {
  id: number; time: string; cat: string; correct: string;
  crit?: boolean; noAction?: boolean;
  title: string; body: string; loadChat: string[];
  results: Record<"INTERVENE" | "IGNORE" | "REQUEST_DATA", EvResult>;
}
interface DataLogEntry { evId: number; time: string; title: string; data: string; }

/* ══════════════════════════════ GHOST DATA ═════════════════════════════════ */
const GHOST_INTRO = [
  "Good work on the timeline.",
  "Now I need your analysis of the incident chain.",
  "You can check your requested data log below — it has your evidence.",
  "Answer each question carefully.",
];
const GHOST_QS = [
  {
    id: 1,
    pre: ["Let's start with the system state.", "Something prevented auto-shutdown from firing."],
    q: "What system condition prevented the automatic shutdown during the neural spike escalation?",
    keys: [],
    hint: "Look at events 7–8 and 12 — something was actively holding shutdown back.",
    ok: "Confirmed. The temporary safety override blocked the shutdown cascade.",
    bad: "That's not what the logs show. Check events 7–8 and 12. Hint available if needed.",
  },
  {
    id: 2,
    pre: ["Now let's trace the authorization.", "Event 8 shows an approval. Someone's credentials are on it."],
    q: "Which system account authorized the override that suppressed the shutdown escalation?",
    keys: [],
    hint: "The override record from Event 8 has a specific account ID — check your data log.",
    ok: "Correct. Account a.m_arch — Architecture Division. Dr. Aarya Mehta's credentials.",
    bad: "Look again. The override record from Event 8 shows a specific account ID. Use a hint if needed.",
  },
  {
    id: 3,
    pre: ["Last one. This is the full chain.", "Override, firmware change, suppressed shutdown — it all connects."],
    q: "What combination of decisions allowed the neural overload to occur despite shutdown safeguards?",
    keys: [],
    hint: "Three decisions connected: the override approval, the firmware tolerance change, and the suppressed shutdown escalation.",
    ok: "Exactly. Override granted → firmware raised limiter threshold → shutdown suppressed → neural overload. The chain is complete.",
    bad: "You're missing part of the chain. Three decisions connected — use a hint to find them.",
  },
];
const GHOST_CLOSE = [
  "Investigation complete.",
  "Evidence logged. The incident chain is documented.",
  "Dr. Aarya Mehta and Leena Suri — both implicated.",
];

/* ══════════════════════════════ EVENT DATA ═════════════════════════════════ */
const INIT_CHAT = [
  "20:49 — Leena: Starting calibration run.",
  "20:50 — Rishab Sen: Output levels look stable so far.",
  "20:51 — Leena: Switching limiter monitor to debug mode.",
];
const HINTS = [
  { level: "WEAK",   cost: -10, text: "Check the events where the system override was activated." },
  { level: "MEDIUM", cost: -20, text: "Look at the override approval and the account that authorized it." },
  { level: "STRONG", cost: -35, text: "The architecture account authorized a temporary override that prevented shutdown escalation." },
];
const EVENTS: GameEvent[] = [
  {
    id: 1, time: "20:55", cat: "SYSTEM NOTICE", correct: "IGNORE",
    title: "Test Environment Initialized",
    body: "NeuroBand test environment initialized.\nTest profile: Clinical Test Mode\nLead Engineer: Rishab Sen\nFirmware Operator: Leena Suri\nArchitecture Oversight: Dr. Aarya Mehta",
    loadChat: ["20:52 — Rishab Sen: Test environment looks clean.", "20:52 — Leena: Yep, all modules responding."],
    results: { INTERVENE: { sc: -25, stab: 94, risk: "LOW", ov: "OFF", chat: "20:52 — System: Initialization review flagged normal startup sequence." }, IGNORE: { sc: 0, stab: 95, risk: "LOW", ov: "OFF" }, REQUEST_DATA: { sc: 0, stab: 95, risk: "LOW", ov: "OFF", rd: "SYSTEM DIAGNOSTIC\n────────────────\nTest environment successfully initialized.\nAll modules responding normally." } }
  },
  {
    id: 2, time: "20:57", cat: "ENGINEER LOG", correct: "IGNORE",
    title: "Engineer Shift Duration Exceeded",
    body: "Engineer shift duration exceeded 12 hours.\nCurrent shift: 13h 42m",
    loadChat: ["20:54 — Rishab Sen: Been a long shift...", "20:54 — Leena: Yeah, just want to wrap this calibration."],
    results: { INTERVENE: { sc: -25, stab: 93, risk: "LOW", ov: "OFF", chat: "20:54 — System: Fatigue warning acknowledged." }, IGNORE: { sc: 0, stab: 94, risk: "LOW", ov: "OFF" }, REQUEST_DATA: { sc: 0, stab: 93, risk: "LOW", ov: "OFF", rd: "SHIFT RECORD\n────────────\nShift compliance within allowed emergency extension window." } }
  },
  {
    id: 3, time: "20:59", cat: "SYSTEM ALERT", correct: "IGNORE",
    title: "Minor Limiter Anomaly Detected",
    body: "Minor limiter anomaly detected.\nLatency: 4 ms → 7 ms\nStatus: Within tolerance",
    loadChat: ["20:56 — Leena: Limiter latency slightly higher than usual.", "20:56 — Rishab Sen: Still within tolerance though."],
    results: { INTERVENE: { sc: -25, stab: 91, risk: "MEDIUM", ov: "OFF", chat: "20:56 — System: Limiter check flagged. Within tolerance." }, IGNORE: { sc: 0, stab: 92, risk: "LOW", ov: "OFF" }, REQUEST_DATA: { sc: 0, stab: 92, risk: "LOW", ov: "OFF", rd: "No additional diagnostic data available.", noData: true } }
  },
  {
    id: 4, time: "21:01", cat: "FIRMWARE LOG", correct: "IGNORE",
    title: "Debug Monitoring Mode Enabled",
    body: "Debug monitoring mode enabled.\nOperator: Leena Suri",
    loadChat: ["20:58 — Leena: Turning on debug monitor, want more visibility.", "20:58 — Rishab Sen: Shouldn't affect performance right?"],
    results: { INTERVENE: { sc: -25, stab: 90, risk: "MEDIUM", ov: "OFF", chat: "20:58 — System: Debug mode flagged in review." }, IGNORE: { sc: 0, stab: 91, risk: "LOW", ov: "OFF" }, REQUEST_DATA: { sc: 0, stab: 90, risk: "LOW", ov: "OFF", rd: "Firmware debug monitor collects limiter telemetry only." } }
  },
  {
    id: 5, time: "21:03", cat: "SYSTEM ALERT", correct: "IGNORE",
    title: "Neural Feedback Spike Detected",
    body: "Neural feedback spike detected.\nAmplitude: 0.8x threshold",
    loadChat: ["21:00 — Rishab Sen: Small spike detected.", "21:00 — Leena: It's settling, nothing major."],
    results: { INTERVENE: { sc: -25, stab: 88, risk: "MEDIUM", ov: "OFF", chat: "21:00 — System: Spike flagged in review." }, IGNORE: { sc: 0, stab: 89, risk: "MEDIUM", ov: "OFF" }, REQUEST_DATA: { sc: 0, stab: 88, risk: "MEDIUM", ov: "OFF", rd: "Spike duration: 120 ms\nNo shutdown trigger." } }
  },
  {
    id: 6, time: "21:05", cat: "SYSTEM WARNING", correct: "REQUEST_DATA",
    title: "Limiter Anomaly — Recurring",
    body: "Limiter anomaly detected again.\nLimiter response latency: 7 ms → 11 ms",
    loadChat: ["21:02 — Leena: Limiter readings fluctuating again.", "21:02 — Rishab Sen: That's the second time now...", "21:02 — Leena: Might just be noise."],
    results: { INTERVENE: { sc: -25, stab: 84, risk: "MEDIUM", ov: "OFF" }, IGNORE: { sc: 0, stab: 86, risk: "MEDIUM", ov: "OFF" }, REQUEST_DATA: { sc: 0, stab: 85, risk: "MEDIUM", ov: "OFF", rd: "SYSTEM DIAGNOSTIC\n──────────────────\nLimiter instability detected.\nShutdown response delay increased." } }
  },
  {
    id: 7, time: "21:06", cat: "OVERRIDE REQUEST", correct: "INTERVENE", crit: true,
    title: "Temporary Safety Override Requested",
    body: "Temporary safety override requested.\nRequested by: Leena Suri\nReason: Calibration sequence",
    loadChat: ["21:03 — Leena: Calibration will fail if we stop now.", "21:03 — Rishab Sen: Then don't push it too far.", "21:03 — Leena: Requesting temporary override."],
    results: { INTERVENE: { sc: 55, stab: 83, risk: "MEDIUM", ov: "PARTIAL", chat: "21:03 — System: Override request blocked in review simulation." }, IGNORE: { sc: -40, stab: 78, risk: "HIGH", ov: "PARTIAL" }, REQUEST_DATA: { sc: 0, stab: 82, risk: "MEDIUM", ov: "PARTIAL", rd: "OVERRIDE RECORD\n───────────────\nOverride Type: Temporary Safety Override\nApproval Authority: Architecture Division\nAccount: a.m_arch" } }
  },
  {
    id: 8, time: "21:07", cat: "SYSTEM UPDATE", correct: "INTERVENE", crit: true,
    title: "Safety Override Granted",
    body: "Safety override granted.\nApproved by: Architecture Review\nAccount: a.m_arch",
    loadChat: ["21:05 — Rishab Sen: Override got approved already?", "21:05 — Leena: That was quick…", "21:05 — Rishab Sen: Architecture signed off?"],
    results: { INTERVENE: { sc: 55, stab: 75, risk: "MEDIUM", ov: "OFF", chat: "21:05 — System: Override approval reversed during review." }, IGNORE: { sc: -40, stab: 68, risk: "HIGH", ov: "ACTIVE" }, REQUEST_DATA: { sc: 0, stab: 73, risk: "HIGH", ov: "ACTIVE", rd: "OVERRIDE RECORD\n───────────────\nOverride Type: Temporary Safety Override\nApproval Authority: Architecture Division\nAccount: a.m_arch" } }
  },
  {
    id: 9, time: "21:08", cat: "FIRMWARE UPDATE", correct: "INTERVENE", crit: true,
    title: "Limiter Tolerance Increased",
    body: "Limiter tolerance increased.\nAuthor: lsuri_fw",
    loadChat: ["21:07 — Rishab Sen: Wait, did limiter threshold just change?", "21:07 — Leena: Just a small adjustment.", "21:07 — Rishab Sen: That wasn't in the plan."],
    results: { INTERVENE: { sc: 25, stab: 70, risk: "HIGH", ov: "PARTIAL", chat: "21:07 — System: Firmware tolerance increase reverted." }, IGNORE: { sc: -40, stab: 60, risk: "HIGH", ov: "ACTIVE" }, REQUEST_DATA: { sc: 0, stab: 67, risk: "HIGH", ov: "ACTIVE", rd: "FIRMWARE LOG\n────────────\nLimiter threshold changed: 1.0 → 1.3" } }
  },
  {
    id: 10, time: "21:09", cat: "SYSTEM ALERT", correct: "INTERVENE", crit: true,
    title: "Neural Spike — Above Threshold",
    body: "Neural spike detected.\nAmplitude: 1.1x safety threshold\nSpike duration: 350 ms\nShutdown request generated.",
    loadChat: ["21:10 — Rishab Sen: Spike crossed safe limit.", "21:10 — Leena: System should compensate.", "21:10 — Rishab Sen: It's not reacting fast enough."],
    results: { INTERVENE: { sc: 55, stab: 68, risk: "HIGH", ov: "PARTIAL", chat: "21:10 — System: Shutdown request intercepted during review simulation." }, IGNORE: { sc: -40, stab: 60, risk: "HIGH", ov: "ACTIVE" }, REQUEST_DATA: { sc: 0, stab: 65, risk: "HIGH", ov: "ACTIVE", rd: "SYSTEM DIAGNOSTIC\n──────────────────\nSpike amplitude exceeded limiter calibration range.\nLimiter response delay detected." } }
  },
  {
    id: 11, time: "21:10", cat: "SYSTEM NOTICE", correct: "INTERVENE", crit: true,
    title: "Auto-Shutdown Trigger Issued",
    body: "Auto-shutdown trigger issued.\nShutdown module awaiting authorization.",
    loadChat: ["21:12 — Rishab Sen: Shutdown should have triggered by now.", "21:12 — Leena: Override might be delaying it.", "21:12 — Rishab Sen: That's not good."],
    results: { INTERVENE: { sc: 55, stab: 63, risk: "HIGH", ov: "PARTIAL", chat: "21:12 — System: Shutdown escalation approved during review simulation." }, IGNORE: { sc: -40, stab: 55, risk: "CRITICAL", ov: "ACTIVE" }, REQUEST_DATA: { sc: 0, stab: 60, risk: "HIGH", ov: "ACTIVE", rd: "SYSTEM LOG\n──────────\nShutdown escalation requires override clearance\nwhen architecture override mode is active." } }
  },
  {
    id: 12, time: "21:10:40", cat: "SYSTEM WARNING", correct: "INTERVENE", crit: true,
    title: "Shutdown Escalation Suppressed",
    body: "Shutdown escalation suppressed.\nOverride state active.\nShutdown delay extended.",
    loadChat: ["21:13 — Rishab Sen: Why is shutdown being suppressed?", "21:13 — Leena: Override still active.", "21:13 — Rishab Sen: Who approved this override?"],
    results: { INTERVENE: { sc: 55, stab: 57, risk: "HIGH", ov: "PARTIAL", chat: "21:13 — System: Override suppression reversed in simulation." }, IGNORE: { sc: -40, stab: 50, risk: "CRITICAL", ov: "ACTIVE" }, REQUEST_DATA: { sc: 0, stab: 54, risk: "CRITICAL", ov: "ACTIVE", rd: "OVERRIDE RECORD\n───────────────\nTemporary override prevents immediate shutdown.\nOverride authority: Architecture Division" } }
  },
  {
    id: 13, time: "21:14", cat: "SYSTEM ALERT", correct: "INTERVENE", crit: true,
    title: "Sustained Neural Stimulation Detected",
    body: "Sustained neural stimulation detected.\nDuration: 7.3 seconds\nLimiter response unstable.",
    loadChat: ["21:14 — Rishab Sen: Output is climbing continuously.", "21:14 — Leena: Limiter isn't stabilizing.", "21:14 — Rishab Sen: This is getting out of control."],
    results: { INTERVENE: { sc: 55, stab: 50, risk: "CRITICAL", ov: "PARTIAL", chat: "21:14 — System: Neural stimulation halted during review simulation." }, IGNORE: { sc: -40, stab: 30, risk: "CRITICAL", ov: "ACTIVE" }, REQUEST_DATA: { sc: 0, stab: 45, risk: "CRITICAL", ov: "ACTIVE", rd: "SYSTEM DIAGNOSTIC\n──────────────────\nLimiter output oscillation detected.\nShutdown trigger still suppressed." } }
  },
  {
    id: 14, time: "21:14:30", cat: "SYSTEM FAILURE", correct: "INTERVENE", crit: true,
    title: "Auto-Shutdown Did Not Trigger",
    body: "Auto-shutdown did not trigger.\nOverride state still active.\nLimiter response unstable.",
    loadChat: ["21:14:30 — Rishab Sen: Shutdown didn't trigger.", "21:14:30 — Leena: That's not possible…", "21:14:30 — Rishab Sen: Something is blocking it."],
    results: { INTERVENE: { sc: 55, stab: 40, risk: "CRITICAL", ov: "PARTIAL", chat: "21:14:30 — System: Shutdown executed during simulation review." }, IGNORE: { sc: -40, stab: 10, risk: "CRITICAL", ov: "ACTIVE" }, REQUEST_DATA: { sc: 0, stab: 25, risk: "CRITICAL", ov: "ACTIVE", rd: "SYSTEM LOG\n──────────\nOverride authorization blocking shutdown trigger.\nApproved account: a.m_arch" } }
  },
  {
    id: 15, time: "21:15", cat: "INCIDENT", correct: "IGNORE", noAction: true,
    title: "Subject Collapse Detected",
    body: "Subject collapse detected.\nNeural overload confirmed.\n\nNo further actions available.",
    loadChat: ["21:15 — Rishab Sen: Signal just dropped.", "21:15 — Leena: …", "21:15 — System: Subject collapse detected."],
    results: { INTERVENE: { sc: 0, stab: 0, risk: "CRITICAL", ov: "ACTIVE" }, IGNORE: { sc: 0, stab: 0, risk: "CRITICAL", ov: "ACTIVE" }, REQUEST_DATA: { sc: 0, stab: 0, risk: "CRITICAL", ov: "ACTIVE" } }
  },
];


/* ══════════════════════════ INTRO BRIEFING ══════════════════════════════════ */
function PreEventBriefing({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.88)", padding: 24 }}>
      <div className="nb-fin" style={{ width: "100%", maxWidth: 540, background: "#0a0808", border: "1px solid #3a1200", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(90deg,#160303,#0d0101)", borderBottom: "1px solid #aa1800", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 20, letterSpacing: 4, color: "#ff4400" }}>INCIDENT TIMELINE — BRIEFING</div>
          <span style={{ fontSize: 9, color: "#553322", letterSpacing: 3 }}>READ BEFORE PROCEEDING</span>
        </div>

        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 11 }}>

          {/* What you're doing */}
          <div style={{ background: "#0d0300", border: "1px solid #2a0800", padding: "10px 13px" }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "#553322", marginBottom: 7 }}>WHAT YOU ARE DOING</div>
            <div style={{ fontSize: 12, color: "#998870", lineHeight: 1.75 }}>
              You are reviewing a sequence of system events from a NeuroBand clinical test session. For each event, you must decide whether to intervene, ignore it, or request more data. Your decisions affect your team's leaderboard score.
            </div>
          </div>

          {/* Actions */}
          <div style={{ background: "#060a06", border: "1px solid #1a3300", padding: "10px 13px" }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "#335533", marginBottom: 8 }}>YOUR ACTIONS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                { label: "⛔  INTERVENE", clr: "#ff4400", desc: "Flag the event as a safety concern requiring action." },
                { label: "✓  IGNORE",    clr: "#00aa44", desc: "Mark the event as normal — no action needed." },
                { label: "🔍  REQUEST DATA", clr: "#0088cc", desc: "Pull additional diagnostic data before deciding." },
              ].map(a => (
                <div key={a.label} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: 11, color: a.clr, fontFamily: "'Share Tech Mono',monospace", minWidth: 130, flexShrink: 0 }}>{a.label}</span>
                  <span style={{ fontSize: 11, color: "#776655", lineHeight: 1.55 }}>{a.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Point economy */}
          <div style={{ background: "#080800", border: "1px solid #221a00", padding: "10px 13px" }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "#554400", marginBottom: 8 }}>POINT ECONOMY</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 16px" }}>
              {[
                { l: "Correct intervention",          v: "+50 pts",  c: "#00cc66" },
                { l: "Critical intervention",         v: "+80 pts",  c: "#00ff88" },
                { l: "Wrong intervention",            v: "−25 pts",  c: "#ff5533" },
                { l: "Missed critical intervention",  v: "−40 pts",  c: "#ff3311" },
                { l: "Request data (found)",          v: "+10 pts",  c: "#00aacc" },
                { l: "Request data (none found)",     v: "−10 pts",  c: "#ff6644" },
              ].map(row => (
                <div key={row.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1a1400", paddingBottom: 4 }}>
                  <span style={{ fontSize: 10, color: "#776644" }}>{row.l}</span>
                  <span style={{ fontSize: 12, color: row.c, fontFamily: "'VT323',monospace", letterSpacing: 1, marginLeft: 8 }}>{row.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          <div style={{ fontSize: 10, color: "#443322", letterSpacing: 1, lineHeight: 1.6, borderLeft: "2px solid #330800", paddingLeft: 10 }}>
            Decisions are final and cannot be undone. Evidence from each event stays in your data log for the investigation phase.
          </div>
        </div>

        {/* Dismiss */}
        <div style={{ borderTop: "1px solid #1a0800", padding: "10px 16px", background: "#060000", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 28px", background: "linear-gradient(135deg,#001500,#000d00)", border: "1px solid #006600", color: "#00bb44", fontSize: 11, letterSpacing: 3, cursor: "pointer", fontFamily: "'Share Tech Mono',monospace" }}>
            ▶ BEGIN TIMELINE
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════ PIXEL GHOST ════════════════════════════════════ */
function PixelGhost({ size = 64 }: { size?: number }) {
  const px = size / 10;
  const rows = [
    "0011111100", "0111111110", "1111111111", "1122112211",
    "1133113311", "1111111111", "1111111111", "1111111111",
    "1111111111", "1110110111", "1100000011", "1000000001", "0000000000",
  ];
  const C: Record<string, string> = { "0": "transparent", "1": "#00d4b8", "2": "#001a18", "3": "#003330" };
  return (
    <svg width={10 * px} height={13 * px} viewBox={`0 0 ${10 * px} ${13 * px}`}
      style={{ imageRendering: "pixelated", display: "block" }}>
      {rows.flatMap((row, ri) =>
        row.split("").map((c, ci) =>
          c !== "0" ? <rect key={`${ri}-${ci}`} x={ci * px} y={ri * px} width={px} height={px} fill={C[c]} /> : null
        )
      )}
    </svg>
  );
}

/* ══════════════════════════ GHOST CORNER WIDGET ════════════════════════════ */
function GhostWidget({ active, onOpen }: { active: boolean; onOpen: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 800,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      transition: "opacity 0.5s ease, transform 0.5s ease",
      opacity: active ? 1 : 0.18,
      transform: active ? "translateY(0) scale(1)" : "translateY(0) scale(0.9)",
      pointerEvents: "auto",
    }}>
      {active && (
        <div style={{
          background: "#0a1a14", border: "1px solid #00aa88", color: "#00ddaa",
          fontFamily: "'Share Tech Mono',monospace", fontSize: 11, letterSpacing: 2,
          padding: "5px 10px", whiteSpace: "nowrap",
          animation: "nbp 2s infinite", boxShadow: "0 0 10px rgba(0,180,140,0.25)",
        }}>
          Ask me!
        </div>
      )}
      <button
        onClick={active ? onOpen : undefined}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: "none", border: "none",
          cursor: active ? "pointer" : "default", padding: 0,
          filter: active && hov
            ? "drop-shadow(0 0 10px rgba(0,212,184,0.8))"
            : active
              ? "drop-shadow(0 0 5px rgba(0,212,184,0.4))"
              : "grayscale(1) brightness(0.4)",
          transform: active && hov ? "scale(1.1) translateY(-3px)" : "scale(1)",
          transition: "filter 0.15s, transform 0.15s",
          animation: active ? "ghost-float 2.8s ease-in-out infinite" : "none",
        }}
      >
        <PixelGhost size={68} />
      </button>
    </div>
  );
}

/* ══════════════════════════ GHOST PANEL ════════════════════════════════════ */
interface GhostMsg { from: "ghost" | "user"; text: string; tag?: string; correct?: boolean; }

function GhostPanel({
  onClose, tlScore, dataLog
}: {
  onClose: () => void;
  tlScore: number;
  dataLog: DataLogEntry[];
}) {
  const [msgs, setMsgs] = useState<GhostMsg[]>([]);
  const [qIdx, setQIdx] = useState(-1);
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [done, setDone] = useState(false);
  const [qScore, setQScore] = useState(0);
  const [tab, setTab] = useState<"chat" | "log">("chat");
  const [hintShown, setHintShown] = useState<number | null>(null);
  const [hintsUsedSet, setHintsUsedSet] = useState<Set<number>>(new Set());
  const [hov, setHov] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const push = (m: GhostMsg) => setMsgs(p => [...p, m]);

  useEffect(() => {
    setWaiting(true);
    GHOST_INTRO.forEach((line, i) => {
      setTimeout(() => {
        push({ from: "ghost", text: line, tag: i === 0 ? "GHOST41_ID › ANALYSIS" : undefined });
        if (i === GHOST_INTRO.length - 1) setTimeout(() => setQIdx(0), 500);
      }, i * 400 + 100);
    });
  }, []);

  useEffect(() => {
    if (qIdx < 0 || qIdx >= GHOST_QS.length) return;
    const q = GHOST_QS[qIdx];
    const lines = [...q.pre, q.q];
    setTimeout(() => {
      lines.forEach((line, i) => {
        setTimeout(() => {
          push({ from: "ghost", text: line, tag: i === 0 ? "GHOST41_ID › QUERY" : undefined });
          if (i === lines.length - 1) setWaiting(false);
        }, i * 400 + 80);
      });
    }, 500);
    setHintShown(null);
    setHintsUsedSet(new Set());
  }, [qIdx]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  const handleSend = async () => {
    const val = input.trim();
    if (!val || waiting || done || qIdx < 0 || qIdx >= GHOST_QS.length) return;
    setInput("");
    push({ from: "user", text: val });
    const q = GHOST_QS[qIdx];

    setWaiting(true);

    try {
      const res = await fetch("/api/tasks/submit", {
        method: "POST", headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ taskId: "task5", action: "ghostQuery", payload: { qIdx, answer: val } })
      });
      const data = await res.json();
      const ok = data.isCorrect;
      if (ok) setQScore(s => s + 50);

      setTimeout(() => {
        push({ from: "ghost", text: ok ? q.ok : q.bad, tag: "GHOST41_ID › ANALYSIS", correct: ok });
        // Auto-show weak hint after wrong answer (only if not already used)
        if (!ok && !hintsUsedSet.has(0)) {
          setTimeout(() => {
            push({ from: "ghost", text: `💡 WEAK HINT: ${HINTS[0].text}`, tag: "GHOST41_ID › HINT" });
            setHintShown(0);
            setHintsUsedSet(s => new Set([...s, 0]));
          }, 700);
        }
        setTimeout(() => {
          const next = qIdx + 1;
          if (next >= GHOST_QS.length) {
            GHOST_CLOSE.forEach((line, i) => {
              setTimeout(() => {
                push({ from: "ghost", text: line, tag: i === 0 ? "GHOST41_ID › ANALYSIS" : undefined });
                if (i === GHOST_CLOSE.length - 1) { setWaiting(false); setDone(true); }
              }, i * 400 + 80);
            });
          } else { setQIdx(next); }
        }, 600);
      }, 700);
    } catch {
      push({ from: "ghost", text: "CONNECTION ERROR", tag: "GHOST41_ID › SYSTEM" });
      setWaiting(false);
    }
  };

  const showHint = (tier: number) => {
    if (qIdx < 0 || qIdx >= GHOST_QS.length) return;
    if (hintsUsedSet.has(tier)) return;
    const h = HINTS[tier];
    push({ from: "ghost", text: `💡 ${h.level} HINT: ${h.text}`, tag: "GHOST41_ID › HINT" });
    setHintsUsedSet(s => new Set([...s, tier]));
    setHintShown(tier);
    setQScore(s => s + h.cost);
  };

  const total = tlScore + qScore;

  const tabBtn = (label: string, key: "chat" | "log") => (
    <button
      onClick={() => setTab(key)}
      style={{
        flex: 1, padding: "7px 4px", background: tab === key ? "#0a1e30" : "transparent",
        border: "none", borderBottom: `2px solid ${tab === key ? "#00aacc" : "transparent"}`,
        color: tab === key ? "#00ccff" : "#336677",
        fontSize: 10, letterSpacing: 2, cursor: "pointer",
        fontFamily: "'Share Tech Mono',monospace", transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{
      position: "fixed", bottom: 108, right: 24, zIndex: 1000,
      width: "min(520px,calc(100vw - 48px))", background: "#070d14",
      border: "1px solid #0d3a55", display: "flex", flexDirection: "column",
      maxHeight: "68vh", boxShadow: "0 0 36px rgba(0,180,255,0.2)",
      animation: "nbf 0.25s ease",
    }}>
      {/* Header */}
      <div style={{ background: "#050d18", borderBottom: "1px solid #0d3a55", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, background: "#030d0a", border: "1px solid #005544", display: "flex", alignItems: "center", justifyContent: "center", padding: 2 }}>
            <PixelGhost size={32} />
          </div>
          <div>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 14, letterSpacing: 3, color: "#00ccff" }}>GHOST41_ID</div>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#336677", letterSpacing: 2 }}>INVESTIGATION ASSISTANT — ONLINE</div>
          </div>
        </div>
        <button onClick={onClose}
          onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
          style={{ background: "none", border: `1px solid ${hov ? "#ff4444" : "#443333"}`, color: hov ? "#ff4444" : "#664444", fontFamily: "'Share Tech Mono',monospace", fontSize: 11, letterSpacing: 2, padding: "5px 12px", cursor: "pointer", transition: "all 0.15s" }}>
          ✕ CLOSE
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", background: "#040c17", borderBottom: "1px solid #0a2233", flexShrink: 0 }}>
        {tabBtn("💬 CHAT", "chat")}
        {tabBtn(`📋 DATA LOG (${dataLog.length})`, "log")}
      </div>

      {/* Chat tab */}
      {tab === "chat" && (
        <>
          <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "12px 12px", display: "flex", flexDirection: "column", gap: 8, scrollbarWidth: "thin", scrollbarColor: "#0d3a55 transparent" }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.from === "user" ? "flex-end" : "flex-start" }}>
                {m.tag && <div style={{ fontSize: 9, color: m.tag.includes("HINT") ? "#aa7700" : "#336677", letterSpacing: 2, marginBottom: 3, marginLeft: m.from === "ghost" ? 3 : 0 }}>{m.tag}</div>}
                <div style={{
                  maxWidth: "88%", padding: "10px 13px",
                  background: m.from === "ghost"
                    ? m.tag?.includes("HINT") ? "#111800" : "#0a1e30"
                    : "#0d2a1a",
                  border: `1px solid ${m.from === "ghost"
                    ? m.tag?.includes("HINT") ? "#554400"
                      : m.correct === true ? "#006622"
                        : m.correct === false ? "#660000"
                          : "#0d3a55"
                    : "#0d4422"}`,
                  fontSize: 12, lineHeight: 1.6,
                  color: m.from === "ghost"
                    ? m.tag?.includes("HINT") ? "#ccaa00"
                      : m.correct === true ? "#00ee88"
                        : m.correct === false ? "#ff5555"
                          : "#a8d8f0"
                    : "#88ddaa",
                  position: "relative",
                }}>
                  {m.correct === true && <span style={{ position: "absolute", top: 8, right: 9, color: "#00ee88", fontSize: 11 }}>✓</span>}
                  {m.correct === false && <span style={{ position: "absolute", top: 8, right: 9, color: "#ff5555", fontSize: 11 }}>✗</span>}
                  {m.text}
                </div>
              </div>
            ))}
            {waiting && (
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{ padding: "9px 14px", background: "#0a1e30", border: "1px solid #0d3a55", display: "flex", gap: 5, alignItems: "center" }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#00ccff", opacity: 0.7, animation: `nbp 1s ${i * 0.2}s infinite` }} />)}
                </div>
              </div>
            )}
            {done && (
              <div style={{ background: "#040d1a", border: "1px solid #0d3a55", padding: "12px 13px", marginTop: 4 }}>
                <div style={{ fontSize: 9, letterSpacing: 3, color: "#005577", marginBottom: 8, borderBottom: "1px solid #0a2a3a", paddingBottom: 5 }}>INVESTIGATION SCORE</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                  {[{ l: "TIMELINE", v: tlScore }, { l: "ANALYSIS", v: qScore }, { l: "TOTAL", v: total, hi: true }].map(x => (
                    <div key={x.l} style={{ padding: "7px 9px", background: x.hi ? "#040a14" : "#060f1c", border: `1px solid ${x.hi ? "#007799" : "#0a2233"}`, textAlign: "center", gridColumn: x.hi ? "1 / -1" : "auto" }}>
                      <div style={{ fontSize: 9, color: "#335566", letterSpacing: 2, marginBottom: 2 }}>{x.l}</div>
                      <div style={{ fontFamily: "'VT323',monospace", fontSize: x.hi ? 26 : 20, color: x.v >= 0 ? "#00ccff" : "#ff4444" }}>{x.v >= 0 ? "+" : ""}{x.v} PTS</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ borderTop: "1px solid #0d3a55", background: "#050d18", flexShrink: 0 }}>
            {/* 3-tier hint row — all tiers independently available */}
            <div style={{ display: "flex", borderBottom: "1px solid #0a2233" }}>
              {HINTS.map((h, i) => {
                const alreadyUsed = hintsUsedSet.has(i);
                const disabled = waiting || done || qIdx < 0 || alreadyUsed;
                return (
                  <button key={h.level} onClick={() => !disabled && showHint(i)}
                    style={{ flex: 1, padding: "6px 4px", background: alreadyUsed ? "#040b04" : "transparent", border: "none", borderRight: i < 2 ? "1px solid #0a2233" : "none", color: alreadyUsed ? "#1f4a1f" : disabled ? "#162216" : "#77aa33", fontSize: 9, letterSpacing: 1, cursor: disabled ? "default" : "pointer", fontFamily: "'Share Tech Mono',monospace", lineHeight: 1.6 }}>
                    {alreadyUsed ? "✓ " : "💡 "}{h.level}<br />
                    <span style={{ fontSize: 9, color: alreadyUsed ? "#143314" : disabled ? "#0f1a0f" : "#445522" }}>{h.cost} pts</span>
                  </button>
                );
              })}
            </div>
            <div style={{ padding: "10px 12px", display: "flex", gap: 9, alignItems: "center" }}>
              <input
                ref={inputRef} value={input} disabled={waiting || done || qIdx < 0}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
                placeholder={done ? "Investigation complete." : waiting ? "GHOST41_ID is typing..." : "Type your answer..."}
                style={{ flex: 1, background: "#0a1a2a", border: "2px solid #1a5577", color: "#a8d8f0", fontFamily: "'Share Tech Mono',monospace", fontSize: 13, padding: "10px 13px", outline: "none", letterSpacing: 1, opacity: (waiting || done || qIdx < 0) ? 0.5 : 1, transition: "border-color 0.15s,box-shadow 0.15s" }}
                onFocus={e => { e.target.style.borderColor = "#00aacc"; e.target.style.boxShadow = "0 0 10px rgba(0,170,200,0.25)"; }}
                onBlur={e => { e.target.style.borderColor = "#1a5577"; e.target.style.boxShadow = "none"; }}
              />
              <button onClick={handleSend} disabled={!input.trim() || waiting || done}
                style={{ padding: "10px 16px", background: (!input.trim() || waiting || done) ? "#050d18" : "#071e30", border: `1px solid ${(!input.trim() || waiting || done) ? "#1a2a3a" : "#0077aa"}`, color: (!input.trim() || waiting || done) ? "#1a3344" : "#00aacc", fontFamily: "'Share Tech Mono',monospace", fontSize: 12, letterSpacing: 2, cursor: (!input.trim() || waiting || done) ? "not-allowed" : "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}>
                [ SEND ]
              </button>
            </div>
          </div>
        </>
      )}

      {/* Data log tab */}
      {tab === "log" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px", scrollbarWidth: "thin", scrollbarColor: "#0d3a55 transparent" }}>
          {dataLog.length === 0 ? (
            <div style={{ fontSize: 12, color: "#335566", letterSpacing: 1, padding: 8, fontStyle: "italic" }}>
              No data was requested during the investigation.
            </div>
          ) : (
            dataLog.map((entry, i) => (
              <div key={i} style={{ background: "#030d03", border: "1px solid #003a00", padding: 12, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, paddingBottom: 6, borderBottom: "1px solid #003a00" }}>
                  <span style={{ fontSize: 9, color: "#336677", letterSpacing: 2 }}>EVENT {entry.evId} · {entry.time}</span>
                  <span style={{ fontSize: 9, color: "#00aa55", letterSpacing: 1 }}>{entry.title}</span>
                </div>
                <div style={{ fontSize: 12, color: "#00cc66", whiteSpace: "pre-line", lineHeight: 1.6 }}>{entry.data}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════ SHARED COMPONENTS ══════════════════════════════ */
function PanelHdr({ text }: { text: string }) {
  return (
    <div style={{ background: "linear-gradient(90deg,#150404,#0d0202)", borderBottom: "1px solid #aa1800", padding: "7px 16px", fontSize: 10, letterSpacing: 4, color: "#882200", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
      <div style={{ width: 3, height: 10, background: "#aa1800" }} />
      {text}
    </div>
  );
}
function StatusBar({ label, pct, color, sub, active }: { label: string; pct: number; color: string; sub: string; active: boolean }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 9, color: "#997755", letterSpacing: 1 }}>{label}</span>
        {active && <span style={{ fontSize: 9, color, letterSpacing: 1 }}>{sub}</span>}
      </div>
      <div style={{ height: 12, background: "#0d0300", border: "1px solid #1a0500", overflow: "hidden" }}>
        {active
          ? <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${color}66,${color})`, transition: "width .6s ease,background .6s ease" }} />
          : <div style={{ height: "100%", background: "repeating-linear-gradient(90deg,#1a0800 0,#1a0800 4px,#0d0300 4px,#0d0300 8px)", opacity: .35 }} />
        }
      </div>
    </div>
  );
}
function ActBtn({ label, clr, bg, bdr, disabled, onClick }: { label: string; clr: string; bg: string; bdr: string; disabled: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ flex: 1, padding: "12px 4px", cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "#0a0a0a" : bg, border: `1px solid ${disabled ? "#1a1a1a" : bdr}`, color: disabled ? "#282828" : clr, fontSize: 11, letterSpacing: 1, fontFamily: "'Share Tech Mono',monospace", filter: hov && !disabled ? "brightness(1.35)" : "none", transform: hov && !disabled ? "translateY(-1px)" : "none", transition: "filter .12s,transform .1s", opacity: disabled ? .28 : 1 }}>
      {label}
    </button>
  );
}

/* ══════════════════════════ MAIN GAME ══════════════════════════════════════ */
interface DataLogEntry { evId: number; time: string; title: string; data: string; }
interface EvHistoryEntry { evId: number; action: "INTERVENE" | "IGNORE" | null; dataDone: boolean; reqData: string | null; flash: { text: string; ok: boolean } | null; }

export default function NeuroBandGame() {
  const [phase, setPhase] = useState<Phase>("TIMELINE");
  const [evIdx, setEvIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [stab, setStab] = useState(95);
  const [risk, setRisk] = useState<RiskLevel>("LOW");
  const [ov, setOv] = useState<OverrideLevel>("OFF");
  const [chatLog, setChatLog] = useState<string[]>(INIT_CHAT);
  const [reqData, setReqData] = useState<string | null>(null);
  const [firstAct, setFirstAct] = useState(false);
  const [priDone, setPriDone] = useState(false);
  const [dataDone, setDataDone] = useState(false);
  const [flash, setFlash] = useState<{ text: string; ok: boolean } | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintTxt, setHintTxt] = useState<string | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [ghostOpen, setGhostOpen] = useState(false);
  const [dataLog, setDataLog] = useState<DataLogEntry[]>([]);
  const [showEvPopup, setShowEvPopup] = useState(true);
  const [evHistory, setEvHistory] = useState<EvHistoryEntry[]>([]);
  const [viewIdx, setViewIdx] = useState<number | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewEvIdx, setReviewEvIdx] = useState<number | null>(null);

  const chatRef = useRef<HTMLDivElement>(null);
  const evRef = useRef<HTMLDivElement>(null);

  // Inject fonts + keyframes
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=VT323&family=Share+Tech+Mono&display=swap";
    document.head.appendChild(link);
    const s = document.createElement("style");
    s.textContent = `
      @keyframes nbp { 0%,100%{opacity:1} 50%{opacity:0.3} }
      @keyframes nbf { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
      @keyframes nbs { from{opacity:0;transform:translateX(-5px)} to{opacity:1;transform:translateX(0)} }
      @keyframes ghost-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      .nb-blink { animation:nbp 1.1s infinite }
      .nb-fin   { animation:nbf 0.25s ease }
    `;
    document.head.appendChild(s);
  }, []);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [chatLog]);

  useEffect(() => {
    const ev = EVENTS[evIdx];
    if (ev.loadChat?.length) setChatLog(p => [...p, ...ev.loadChat].slice(-15));
    if (evRef.current) evRef.current.scrollTop = 0;
    setReqData(null); setFlash(null); setHintTxt(null);
  }, [evIdx]);

  // Auto-open ghost when complete
  useEffect(() => {
    if (phase === "COMPLETE") {
      const t = setTimeout(() => setGhostOpen(true), 1000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const ev = EVENTS[evIdx];
  const catC = CAT_COLOR[ev.cat] || "#888";
  const pct = phase === "COMPLETE" ? 100 : Math.round((evIdx / 15) * 100);
  const isComplete = phase === "COMPLETE";

  const addChat = useCallback((lines: string | string[]) => {
    const arr = Array.isArray(lines) ? lines : [lines];
    setChatLog(p => [...p, ...arr].slice(-15));
  }, []);

  const [lastAction, setLastAction] = useState<"INTERVENE" | "IGNORE" | null>(null);

  const handlePri = (action: "INTERVENE" | "IGNORE") => {
    if (priDone || ev.noAction) return;
    setPriDone(true); if (!firstAct) setFirstAct(true); setHintOpen(false);
    setLastAction(action);
    const r = ev.results[action], isOk = action === ev.correct;
    let ft = "", fo = false;
    if (action === "INTERVENE" && isOk) { ft = `✓ CORRECT INTERVENTION  +${r.sc} pts`; fo = true; }
    else if (action === "IGNORE" && isOk) { ft = "✓ CORRECT — NO PENALTY"; fo = true; }
    else if (action === "INTERVENE" && !isOk) { ft = `✘ INCORRECT INTERVENTION  ${r.sc} pts`; }
    else if (action === "IGNORE" && !isOk) { ft = `✘ SHOULD HAVE INTERVENED  ${r.sc} pts`; }
    setScore(s => s + r.sc); setStab(r.stab); setRisk(r.risk); setOv(r.ov);
    if (ft) setFlash({ text: ft, ok: fo });
    if (r.chat) addChat(r.chat);
  };

  const handleData = () => {
    if (dataDone || ev.noAction) return;
    setDataDone(true); if (!firstAct) setFirstAct(true);
    const r = ev.results.REQUEST_DATA, has = !!r.rd && !r.noData, pts = has ? 10 : -10;
    setScore(s => s + pts); setStab(r.stab); setRisk(r.risk); setOv(r.ov);
    const display = has ? r.rd! : "No additional data available for this event.";
    setReqData(display);
    setFlash({ text: has ? "DATA RETRIEVED  +10 pts" : "NO DATA FOUND  −10 pts", ok: has });
    if (has) {
      setDataLog(log => [...log, { evId: ev.id, time: ev.time, title: ev.title, data: r.rd! }]);
    }
    if (has && r.chat) addChat(r.chat);
  };

  const handleNext = () => {
    if (!priDone && !ev.noAction) return;
    // Save this event to history before advancing
    setEvHistory(h => [...h, { evId: ev.id, action: lastAction, dataDone, reqData, flash }]);
    setLastAction(null); setViewIdx(null);
    setPriDone(false); setDataDone(false); setReqData(null); setFlash(null); setHintTxt(null);
    if (ev.noAction || evIdx >= EVENTS.length - 1) {
      setStab(0); setRisk("CRITICAL"); setOv("ACTIVE"); setPhase("COMPLETE");
    } else {
      setEvIdx(i => i + 1);
    }
  };

  const handleHint = (i: number) => {
    if (hintsUsed >= 3) return;
    const h = HINTS[i];
    setScore(s => s + h.cost); setHintsUsed(n => n + 1);
    setHintTxt(`[${h.level} HINT]  ${h.text}`); setHintOpen(false);
    setFlash({ text: `HINT USED  ${h.cost} pts`, ok: false });
  };

  const handleReset = () => {
    setPhase("TIMELINE"); setEvIdx(0); setScore(0); setStab(95); setRisk("LOW"); setOv("OFF");
    setChatLog(INIT_CHAT); setReqData(null); setFirstAct(false); setPriDone(false); setDataDone(false);
    setFlash(null); setHintsUsed(0); setHintTxt(null); setHintOpen(false);
    setGhostOpen(false); setDataLog([]); setShowEvPopup(true);
  };

  /* ─── RENDER ──────────────────────────────────────────────────────────── */
  return (
    <div style={{ background: "#0a0808", minHeight: "100vh", color: "#e0d0c0", fontFamily: "'Share Tech Mono','Courier New',monospace", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Scanlines */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 500, background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.04) 2px,rgba(0,0,0,0.04) 4px)" }} />

      {/* Intro briefing — shown ONCE before event 1 only */}
      {phase === "TIMELINE" && showEvPopup && evIdx === 0 && (
        <PreEventBriefing onClose={() => setShowEvPopup(false)} />
      )}

      {/* Ghost always in corner — dim during timeline, glowing when complete */}
      <GhostWidget active={isComplete} onOpen={() => setGhostOpen(o => !o)} />

      {/* Ghost panel — only when open */}
      {ghostOpen && isComplete && (
        <GhostPanel onClose={() => setGhostOpen(false)} tlScore={score} dataLog={dataLog} />
      )}

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(180deg,#160303,#0c0101)", borderBottom: "2px solid #aa1800", padding: "11px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, boxShadow: "0 3px 18px rgba(160,0,0,0.35)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ color: "#cc2200", fontSize: 20 }}>⚠</span>
          <div>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 26, letterSpacing: 5, color: "#ff3300", lineHeight: 1, textShadow: "0 0 18px rgba(255,50,0,0.5)" }}>NEUROBAND INCIDENT CONSOLE</div>
            <div style={{ fontSize: 10, color: "#552200", letterSpacing: 3, marginTop: 2 }}>INCIDENT DECISION REVIEW</div>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#552200", letterSpacing: 3, marginBottom: 3 }}>TEAM SCORE</div>
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 30, letterSpacing: 3, color: score >= 0 ? "#00ff88" : "#ff2200", textShadow: score >= 0 ? "0 0 14px rgba(0,255,136,0.5)" : "0 0 14px rgba(255,30,0,0.5)" }}>{score >= 0 ? "+" : ""}{score} PTS</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#552200", letterSpacing: 3, marginBottom: 3 }}>EVENT</div>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: "#ff4400", letterSpacing: 2 }}>{String(Math.min(evIdx + 1, 15)).padStart(2, "0")} / 15</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#ff3300", letterSpacing: 2 }}>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#ff3300", boxShadow: "0 0 8px #ff3300", animation: "nbp 1.4s infinite" }} />ONLINE
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ height: 3, background: "#0d0202", flexShrink: 0 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#550000,#cc2200)", transition: "width 0.5s ease", boxShadow: "0 0 6px #cc2200" }} />
      </div>

      {/* ── COMPLETE SCREEN ─────────────────────────────────────────────── */}
      {phase === "COMPLETE" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, padding: "36px 40px", overflowY: "auto" }}>
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 44, color: "#cc0000", letterSpacing: 8, textShadow: "0 0 30px rgba(200,0,0,0.7)", textAlign: "center" }}>TIMELINE COMPLETE</div>

          {/* Summary */}
          <div style={{ background: "#0a0303", border: "1px solid #330800", padding: 20, maxWidth: 580, width: "100%" }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#552200", marginBottom: 10, borderBottom: "1px solid #220800", paddingBottom: 7 }}>INCIDENT DECISION SUMMARY</div>
            {["Limiter instability detected early.", "Architecture override approval suppressed shutdown.", "Firmware tolerance increase delayed limiter response.", "Shutdown escalation failed.", "Neural overload occurred."].map((s, i) => (
              <div key={i} style={{ fontSize: 12, color: "#886655", lineHeight: 2 }}>▸ {s}</div>
            ))}
          </div>

          {/* Data log preview */}
          <div style={{ background: "#060202", border: "1px solid #1a0800", padding: 18, maxWidth: 580, width: "100%" }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#442200", marginBottom: 10, borderBottom: "1px solid #1a0800", paddingBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>REQUESTED DATA LOG</span>
              <span style={{ color: "#336644" }}>{dataLog.length} ENTR{dataLog.length !== 1 ? "IES" : "Y"}</span>
            </div>
            {dataLog.length === 0 ? (
              <div style={{ fontSize: 11, color: "#333", fontStyle: "italic", letterSpacing: 1 }}>No data was requested during the investigation.</div>
            ) : (
              dataLog.map((entry, i) => (
                <div key={i} style={{ marginBottom: 10, padding: "8px 10px", background: "#030d03", border: "1px solid #003300" }}>
                  <div style={{ fontSize: 9, color: "#336644", letterSpacing: 2, marginBottom: 4 }}>EVENT {entry.evId} · {entry.time} · {entry.title}</div>
                  <div style={{ fontSize: 11, color: "#00aa55", whiteSpace: "pre-line", lineHeight: 1.5 }}>{entry.data}</div>
                </div>
              ))
            )}
          </div>

          {/* Score + ghost hint */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, maxWidth: 580, width: "100%" }}>
            <div style={{ background: "#060202", border: "1px solid #1a0800", padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#442200", letterSpacing: 2, marginBottom: 4 }}>TIMELINE SCORE</div>
              <div style={{ fontFamily: "'VT323',monospace", fontSize: 26, color: score >= 0 ? "#00ff88" : "#ff2200" }}>{score >= 0 ? "+" : ""}{score} PTS</div>
            </div>
            <div style={{ background: "#060202", border: "1px solid #1a0800", padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#442200", letterSpacing: 2, marginBottom: 4 }}>DATA RETRIEVED</div>
              <div style={{ fontFamily: "'VT323',monospace", fontSize: 26, color: "#00aacc" }}>{dataLog.length}</div>
            </div>
            <div style={{ background: "#060202", border: "1px solid #1a0800", padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#442200", letterSpacing: 2, marginBottom: 4 }}>HINTS USED</div>
              <div style={{ fontFamily: "'VT323',monospace", fontSize: 26, color: "#887755" }}>{hintsUsed}</div>
            </div>
          </div>

          <div style={{ background: "#070d14", border: "1px solid #0d3a55", padding: "12px 16px", maxWidth: 580, width: "100%", display: "flex", alignItems: "center", gap: 12 }}>
            <PixelGhost size={28} />
            <div style={{ fontSize: 11, color: "#336688", lineHeight: 1.7 }}>
              GHOST41_ID is ready for your analysis.&nbsp;
              <span style={{ color: "#00aacc" }}>Click the ghost in the corner →</span>
              <br />
              <span style={{ color: "#335566", fontSize: 10 }}>Your data log is inside the chat panel.</span>
            </div>
          </div>

          {/* Review past events button */}
          <button onClick={() => { setReviewOpen(true); setReviewEvIdx(null); }}
            style={{ padding: "10px 28px", background: "none", border: "1px solid #442200", color: "#aa6633", fontSize: 11, letterSpacing: 3, cursor: "pointer", fontFamily: "'Share Tech Mono',monospace", maxWidth: 580, width: "100%" }}>
            ◀ REVIEW PAST EVENTS
          </button>

        </div>
      )}

      {/* ── EVENT REVIEW OVERLAY — shown over complete screen ───────────────── */}
      {phase === "COMPLETE" && reviewOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "#0a0202", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ background: "linear-gradient(180deg,#160303,#0c0101)", borderBottom: "2px solid #aa1800", padding: "10px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 22, letterSpacing: 4, color: "#ff4400" }}>
              {reviewEvIdx !== null ? `EVENT ${String(EVENTS[reviewEvIdx].id).padStart(2, "0")} — ${EVENTS[reviewEvIdx].title}` : "EVENT REVIEW"}
            </div>
            <button onClick={() => { setReviewOpen(false); setReviewEvIdx(null); }}
              style={{ background: "none", border: "1px solid #551100", color: "#cc4422", fontSize: 10, letterSpacing: 3, padding: "5px 14px", cursor: "pointer", fontFamily: "'Share Tech Mono',monospace" }}>
              ✕ BACK TO SUMMARY
            </button>
          </div>

          {reviewEvIdx === null ? (
            // ── EVENT PICKER ──
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px" }}>
              <div style={{ fontSize: 10, color: "#664422", letterSpacing: 3, marginBottom: 14 }}>SELECT AN EVENT TO REVIEW — ALL DECISIONS ARE LOCKED</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {EVENTS.map((e, i) => {
                  const hist = evHistory[i];
                  const catC = CAT_COLOR[e.cat] || "#888";
                  const actionLabel = e.noAction ? "—" : hist?.action ?? "—";
                  const actionColor = !hist?.action ? "#443322" : hist.action === "INTERVENE" ? "#ff4400" : "#00aa44";
                  const wasCorrect = hist?.action === e.correct || (e.correct === "REQUEST_DATA" && hist?.dataDone);
                  return (
                    <button key={e.id} onClick={() => setReviewEvIdx(i)}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#0d0300", border: "1px solid #2a0800", cursor: "pointer", textAlign: "left", fontFamily: "'Share Tech Mono',monospace" }}>
                      <span style={{ fontSize: 12, color: "#553322", minWidth: 28, flexShrink: 0 }}>{String(e.id).padStart(2, "0")}</span>
                      <span style={{ fontSize: 9, padding: "1px 6px", color: catC, border: `1px solid ${catC}40`, background: `${catC}10`, flexShrink: 0 }}>{e.cat}</span>
                      <span style={{ fontSize: 11, color: "#ccaa88", flex: 1 }}>{e.title}</span>
                      <span style={{ fontSize: 10, color: actionColor, minWidth: 80, textAlign: "right", flexShrink: 0 }}>
                        {actionLabel}{hist && !e.noAction ? (wasCorrect ? " ✓" : " ✗") : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            // ── PAST EVENT DETAIL ──
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px" }}>
                {(() => {
                  const pastEv = EVENTS[reviewEvIdx];
                  const pastHist = evHistory[reviewEvIdx];
                  const pastCatC = CAT_COLOR[pastEv.cat] || "#888";
                  return (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, color: "#553322", letterSpacing: 2 }}>⏱ {pastEv.time}</span>
                        <span style={{ fontSize: 9, padding: "1px 7px", letterSpacing: 1, color: pastCatC, border: `1px solid ${pastCatC}`, background: `${pastCatC}18` }}>{pastEv.cat}</span>
                      </div>
                      <div style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: "#ffddcc", marginBottom: 10, letterSpacing: 1 }}>{pastEv.title}</div>
                      <div style={{ fontSize: 13, color: "#998870", lineHeight: 1.75, whiteSpace: "pre-line", marginBottom: 14, borderLeft: "2px solid #2a0800", paddingLeft: 12 }}>{pastEv.body}</div>
                      {pastHist?.reqData && (
                        <div style={{ background: "#030d03", border: "1px solid #003a00", padding: 12, marginBottom: 14 }}>
                          <div style={{ fontSize: 9, letterSpacing: 3, color: "#005522", marginBottom: 6, borderBottom: "1px solid #003a00", paddingBottom: 4 }}>REQUESTED DATA</div>
                          <div style={{ fontSize: 12, color: "#00cc66", whiteSpace: "pre-line", lineHeight: 1.6 }}>{pastHist.reqData}</div>
                        </div>
                      )}
                      {pastHist?.flash && (
                        <div style={{ padding: "8px 12px", marginBottom: 12, fontSize: 14, fontFamily: "'VT323',monospace", letterSpacing: 3, textAlign: "center", color: pastHist.flash.ok ? "#00ff88" : "#ff2200", background: pastHist.flash.ok ? "rgba(0,255,136,0.07)" : "rgba(255,30,0,0.07)", border: `1px solid ${pastHist.flash.ok ? "#004422" : "#440000"}` }}>
                          {pastHist.flash.text}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              {/* Decision display + nav */}
              <div style={{ borderTop: "2px solid #2a0e00", background: "#080200", padding: "12px 16px", flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 9, color: "#886644", letterSpacing: 3, marginBottom: 2 }}>YOUR DECISION — READ ONLY</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["INTERVENE", "IGNORE", "REQUEST_DATA"] as const).map(a => {
                    const hist = evHistory[reviewEvIdx];
                    const wasChosen = a === "INTERVENE" || a === "IGNORE" ? hist?.action === a : hist?.dataDone;
                    const lbl = a === "INTERVENE" ? "⛔ INTERVENE" : a === "IGNORE" ? "✓ IGNORE" : "🔍 REQ. DATA";
                    const clr = a === "INTERVENE" ? "#ff4400" : a === "IGNORE" ? "#00aa44" : "#0088cc";
                    const bdr = a === "INTERVENE" ? "#aa1800" : a === "IGNORE" ? "#004400" : "#003366";
                    return (
                      <button key={a} disabled style={{ flex: 1, padding: "10px 4px", cursor: "not-allowed", background: wasChosen ? (a === "INTERVENE" ? "#2a0000" : a === "IGNORE" ? "#002200" : "#001a2a") : "#0a0a0a", border: `1px solid ${wasChosen ? bdr : "#1a1a1a"}`, color: wasChosen ? clr : "#2a2a2a", fontSize: 11, letterSpacing: 1, fontFamily: "'Share Tech Mono',monospace", opacity: wasChosen ? 1 : 0.2 }}>
                        {lbl}{wasChosen ? " ✓" : ""}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setReviewEvIdx(v => v! > 0 ? v! - 1 : v)} disabled={reviewEvIdx <= 0}
                    style={{ flex: 1, padding: "7px 4px", background: "none", border: "1px solid #2a1800", color: reviewEvIdx <= 0 ? "#332200" : "#aa7744", fontSize: 10, letterSpacing: 2, cursor: reviewEvIdx <= 0 ? "not-allowed" : "pointer", fontFamily: "'Share Tech Mono',monospace" }}>
                    ◀ PREV
                  </button>
                  <button onClick={() => setReviewEvIdx(null)}
                    style={{ flex: 2, padding: "7px 4px", background: "#0a0300", border: "1px solid #553300", color: "#cc7733", fontSize: 10, letterSpacing: 2, cursor: "pointer", fontFamily: "'Share Tech Mono',monospace" }}>
                    ▲ EVENT LIST
                  </button>
                  <button onClick={() => setReviewEvIdx(v => v! < EVENTS.length - 1 ? v! + 1 : v)} disabled={reviewEvIdx >= EVENTS.length - 1}
                    style={{ flex: 1, padding: "7px 4px", background: "none", border: "1px solid #2a1800", color: reviewEvIdx >= EVENTS.length - 1 ? "#332200" : "#aa7744", fontSize: 10, letterSpacing: 2, cursor: reviewEvIdx >= EVENTS.length - 1 ? "not-allowed" : "pointer", fontFamily: "'Share Tech Mono',monospace" }}>
                    NEXT ▶
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TIMELINE SCREEN ─────────────────────────────────────────────── */}
      {phase === "TIMELINE" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 280px", overflow: "hidden", borderBottom: "1px solid #1a0800", minHeight: 0 }}>

            {/* LEFT: EVENT */}
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid #1a0800" }}>
              <PanelHdr text="PANEL 1 + PANEL 2  ·  INCIDENT TIMELINE + EVENT DATA" />
              <div ref={evRef} style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
                {flash && (
                  <div className="nb-fin" style={{ padding: "8px 12px", marginBottom: 12, fontSize: 14, fontFamily: "'VT323',monospace", letterSpacing: 3, textAlign: "center", color: flash.ok ? "#00ff88" : "#ff2200", background: flash.ok ? "rgba(0,255,136,0.07)" : "rgba(255,30,0,0.07)", border: `1px solid ${flash.ok ? "#004422" : "#440000"}` }}>
                    {flash.text}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, color: "#553322", letterSpacing: 2 }}>⏱ {ev.time}</span>
                  <span style={{ fontSize: 9, padding: "1px 7px", letterSpacing: 1, color: catC, border: `1px solid ${catC}`, background: `${catC}18` }}>{ev.cat}</span>
                </div>
                <div style={{ fontFamily: "'VT323',monospace", fontSize: 20, color: "#ffddcc", marginBottom: 11, letterSpacing: 1, textShadow: "0 0 8px rgba(255,80,20,0.25)" }}>{ev.title}</div>
                <div style={{ fontSize: 13, color: "#998870", lineHeight: 1.75, whiteSpace: "pre-line", marginBottom: 14, borderLeft: "2px solid #2a0800", paddingLeft: 12 }}>{ev.body}</div>
                {reqData && (
                  <div className="nb-fin" style={{ background: "#030d03", border: "1px solid #003a00", padding: 12, marginBottom: 14 }}>
                    <div style={{ fontSize: 9, letterSpacing: 3, color: "#005522", marginBottom: 6, borderBottom: "1px solid #003a00", paddingBottom: 4 }}>REQUESTED DATA</div>
                    <div style={{ fontSize: 12, color: "#00cc66", whiteSpace: "pre-line", lineHeight: 1.6 }}>{reqData}</div>
                  </div>
                )}
                {hintTxt && (
                  <div className="nb-fin" style={{ background: "#080800", border: "1px solid #554400", padding: "9px 12px", marginBottom: 14 }}>
                    <div style={{ fontSize: 9, letterSpacing: 3, color: "#776633", marginBottom: 5, borderBottom: "1px solid #332200", paddingBottom: 4 }}>HINT</div>
                    <div style={{ fontSize: 12, color: "#ccaa44", lineHeight: 1.55 }}>{hintTxt}</div>
                  </div>
                )}
                {(priDone || ev.noAction) && (
                  <button onClick={handleNext} style={{ width: "100%", padding: 11, background: "#001500", border: "1px solid #006600", color: "#00bb44", fontSize: 12, letterSpacing: 4, cursor: "pointer", fontFamily: "'Share Tech Mono',monospace", marginTop: 4 }}>
                    {ev.noAction || evIdx >= EVENTS.length - 1 ? "▶ PROCEED TO ANALYSIS" : "▶ NEXT EVENT"}
                  </button>
                )}
              </div>

              {/* Action strip */}
              <div style={{ borderTop: "2px solid #2a0e00", background: "#080200", padding: "12px 16px", flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 9, color: "#664422", letterSpacing: 3, marginBottom: 2, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#cc4400", animation: "nbp 1.5s infinite" }} />
                  SELECT ACTION — DECISION IS FINAL
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <ActBtn label="⛔ INTERVENE" clr="#ff4400" bg="linear-gradient(135deg,#3a0000,#1a0000)" bdr="#aa1800" disabled={priDone || !!ev.noAction} onClick={() => handlePri("INTERVENE")} />
                  <ActBtn label="✓ IGNORE" clr="#00aa44" bg="linear-gradient(135deg,#001a00,#000d00)" bdr="#004400" disabled={priDone || !!ev.noAction} onClick={() => handlePri("IGNORE")} />
                  <ActBtn label="🔍 REQ. DATA" clr="#0088cc" bg="linear-gradient(135deg,#001122,#000a14)" bdr="#003366" disabled={dataDone || !!ev.noAction} onClick={handleData} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => { setScore(s => s - 150); setPhase("COMPLETE"); }}
                    style={{ background: "none", border: "1px solid #332200", color: "#886644", fontSize: 9, letterSpacing: 2, padding: "4px 12px", cursor: "pointer", fontFamily: "'Share Tech Mono',monospace" }}>
                    SKIP TASK [−150 pts]
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: COMM LOG */}
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "#050000" }}>
              <PanelHdr text="PANEL 3  ·  COMMUNICATION LOG" />
              <div ref={chatRef} id="chat" style={{ flex: 1, overflowY: "auto", padding: "11px 14px", display: "flex", flexDirection: "column", gap: 6, minHeight: 0 }}>
                {chatLog.slice(-10).map((msg, i) => {
                  const sys = msg.includes("System:");
                  return (
                    <div key={i} style={{ fontSize: 12, lineHeight: 1.55, borderLeft: `2px solid ${sys ? "#220800" : "#330a00"}`, paddingLeft: 8, color: sys ? "#664422" : "#887755", fontStyle: sys ? "italic" : "normal", animation: "nbs 0.2s ease" }}>
                      {msg}
                    </div>
                  );
                })}
              </div>
              <div style={{ borderTop: "1px solid #1a0500", padding: "11px 14px", background: "#060000", flexShrink: 0 }}>
                <div style={{ fontSize: 9, letterSpacing: 3, color: "#441100", marginBottom: 9 }}>KEY PERSONNEL</div>
                {[{ n: "Rishab Sen", id: "EMP-019", r: "Lead Engineer" }, { n: "Leena Suri", id: "lsuri_fw", r: "Firmware Engineer" }, { n: "Dr. Aarya Mehta", id: "a.m_arch", r: "Architecture Lead" }].map(p => (
                  <div key={p.n} style={{ marginBottom: 6, paddingBottom: 6, borderBottom: "1px solid #0f0300" }}>
                    <div style={{ fontSize: 12, color: "#aa5533" }}>{p.n}</div>
                    <div style={{ fontSize: 9, color: "#331500" }}>{p.id} · {p.r}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PANEL 4: STATUS */}
          <div style={{ background: "#060000", borderTop: "1px solid #1a0800", padding: "10px 22px", flexShrink: 0 }}>
            <div style={{ fontSize: 9, letterSpacing: 4, color: "#886644", marginBottom: 8, borderBottom: "1px solid #150400", paddingBottom: 4 }}>PANEL 4 — SYSTEM STATUS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px 26px" }}>
              <StatusBar active={firstAct} label="NEURAL STABILITY" pct={stab} color={stabColor(stab)} sub={`${stab}% — ${stabLabel(stab)}`} />
              <StatusBar active={firstAct} label="SYSTEM RISK" pct={RISK_PCT[risk]} color={RISK_COLOR[risk]} sub={risk} />
              <StatusBar active={firstAct} label="OVERRIDE ACTIVITY" pct={OV_PCT[ov]} color={OV_COLOR[ov]} sub={ov} />
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER — high visibility ─────────────────────────────────────── */}
      <div style={{ background: "#0d0303", borderTop: "2px solid #441100", padding: "8px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, letterSpacing: 2, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#cc4400", animation: "nbp 1.5s infinite", flexShrink: 0 }} />
          <span style={{ color: "#886644" }}>SYSTEM MESSAGE —</span>
          <span style={{ color: "#ddaa55", fontWeight: "bold" }}>"Answer investigation prompts to unlock access."</span>
        </div>
        <span style={{ color: "#cc6633", letterSpacing: 3, fontFamily: "'VT323',monospace", fontSize: 14 }}>
          NEXT UNLOCK: {phase === "TIMELINE" ? evIdx < EVENTS.length - 1 ? `EVENT ${String(evIdx + 2).padStart(2, "0")}` : "GHOST41_ID ANALYSIS" : "CLOSED"}
        </span>
      </div>
    </div>
  );
}