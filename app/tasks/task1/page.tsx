"use client";
import { useState, useEffect, useRef, CSSProperties, FC } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type LineType = "normal" | "accent" | "danger" | "dim";
type ChatStep = "idle" | "q1" | "q2" | "q3" | "done";
type EvidenceKey = "autopsy" | "neural" | "temperature" | "timeline";

interface EvidenceLine {
  t: LineType;
  s: string;
}

interface EvidenceFile {
  title: string;
  lines: EvidenceLine[];
}

interface Message {
  from: "ghost" | "user";
  text: string;
}

interface Scores {
  q1: number;
  q2: number;
  q3: number;
  bonus: number;
}

interface GhostIconProps {
  size?: number;
}

interface EvidenceModalProps {
  file: EvidenceKey | null;
  onClose: () => void;
}

interface ChatMsgProps {
  msg: Message;
}

// ── Ghost Icon ────────────────────────────────────────────────────────────────
const GhostIcon: FC<GhostIconProps> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 10 12" style={{ imageRendering: "pixelated" }}>
    <rect x="2" y="0" width="6" height="1" fill="#a0d8ef" />
    <rect x="1" y="1" width="8" height="1" fill="#a0d8ef" />
    <rect x="0" y="2" width="10" height="6" fill="#c8e6f5" />
    <rect x="0" y="8" width="10" height="2" fill="#c8e6f5" />
    <rect x="0" y="10" width="2" height="2" fill="#c8e6f5" />
    <rect x="4" y="10" width="2" height="2" fill="#c8e6f5" />
    <rect x="8" y="10" width="2" height="2" fill="#c8e6f5" />
    <rect x="2" y="4" width="2" height="2" fill="#1a2a4a" />
    <rect x="6" y="4" width="2" height="2" fill="#1a2a4a" />
    <rect x="3" y="5" width="1" height="1" fill="#00e5cc" />
    <rect x="7" y="5" width="1" height="1" fill="#00e5cc" />
  </svg>
);

// ── Evidence Data ─────────────────────────────────────────────────────────────
const EVIDENCE: Record<EvidenceKey, EvidenceFile> = {
  autopsy: {
    title: "[ AUTOPSY REPORT — CLASSIFIED ]",
    lines: [
      { t: "normal", s: "SUBJECT: Rishab Sen | EMP-034" },
      { t: "normal", s: "EXAMINER: Dr. K. Voss | Forensic Division" },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "normal", s: "FINDINGS:" },
      { t: "normal", s: "" },
      { t: "accent", s: "  › Neural overstimulation observed" },
      { t: "accent", s: "    across cortical regions." },
      { t: "normal", s: "" },
      { t: "accent", s: "  › Cardiac arrest SECONDARY to" },
      { t: "accent", s: "    neural overload — not primary." },
      { t: "normal", s: "" },
      { t: "accent", s: "  › No external trauma detected." },
      { t: "accent", s: "    No contusions. No lacerations." },
      { t: "normal", s: "" },
      { t: "accent", s: "  › Toxicology: NEGATIVE" },
      { t: "accent", s: "    No chemical agents present." },
      { t: "normal", s: "" },
      { t: "accent", s: "  › NeuroBand interface port:" },
      { t: "accent", s: "    Severe burn marks detected." },
      { t: "accent", s: "    Consistent with surge event." },
      { t: "normal", s: "" },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "danger", s: "CAUSE OF DEATH: Neural overload" },
      { t: "danger", s: "  via NeuroBand device failure." },
      { t: "dim",    s: "─────────────────────────────────────" },
    ],
  },
  neural: {
    title: "[ NEURAL ACTIVITY LOG — RAW DATA ]",
    lines: [
      { t: "normal", s: "SOURCE: NeuroBand v2.1 | DEVICE-RS09" },
      { t: "normal", s: "SESSION ID: NB-2024-0341" },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "normal", s: "TIMESTAMP     EVENT" },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "normal", s: "20:59:12  >>  Session initialized" },
      { t: "normal", s: "21:00:00  >>  Cognitive load: 12%" },
      { t: "normal", s: "21:01:33  >>  Neural sync: stable" },
      { t: "accent", s: "21:02:07  >>  SPIKE DETECTED" },
      { t: "accent", s: "              Amplitude: 847μV" },
      { t: "accent", s: "              [THRESHOLD: 200μV]" },
      { t: "accent", s: "21:02:44  >>  Secondary spike" },
      { t: "accent", s: "              Amplitude: 1203μV" },
      { t: "danger", s: "21:03:01  >>  !! SUSTAINED OVERLOAD !!" },
      { t: "danger", s: "              Duration: 00:00:58" },
      { t: "danger", s: "21:03:59  >>  SUBJECT UNRESPONSIVE" },
      { t: "normal", s: "21:04:02  >>  Device auto-shutoff" },
      { t: "normal", s: "21:04:02  >>  LOG TERMINATED" },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "accent", s: "WARNING: Anomalous spike at 21:02" },
      { t: "accent", s: "precedes official report by 2 min." },
      { t: "dim",    s: "─────────────────────────────────────" },
    ],
  },
  temperature: {
    title: "[ TEMPERATURE RECORD — FORENSICS ]",
    lines: [
      { t: "normal", s: "RECORDED BY: Auto-Sensor Unit 7B" },
      { t: "normal", s: "DISCOVERY TIME: 21:15" },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "normal", s: "BODY TEMP AT DISCOVERY:" },
      { t: "accent", s: "  32.4°C" },
      { t: "normal", s: "" },
      { t: "normal", s: "ROOM TEMPERATURE (Lab 7):" },
      { t: "accent", s: "  22.0°C" },
      { t: "normal", s: "" },
      { t: "normal", s: "STANDARD COOLING RATE:" },
      { t: "normal", s: "  ~1.0–1.5°C per hour" },
      { t: "normal", s: "  (ambient adjusted)" },
      { t: "normal", s: "" },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "normal", s: "NOTE: Use Forensic Estimation Module" },
      { t: "normal", s: "to calculate time of death." },
      { t: "normal", s: "" },
      { t: "accent", s: "HINT: Normal body temp = 37.0°C" },
      { t: "accent", s: "      Delta = 37.0 - 32.4 = 4.6°C" },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "normal", s: "Sensor calibrated: ✓ VERIFIED" },
      { t: "normal", s: "Chain of custody: ✓ INTACT" },
      { t: "dim",    s: "─────────────────────────────────────" },
    ],
  },
  timeline: {
    title: "[ INCIDENT TIMELINE — OFFICIAL ]",
    lines: [
      { t: "normal", s: "SOURCE: Security Division Report" },
      { t: "normal", s: "FILED BY: SEC-02 | 22:30 same day" },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "normal", s: "OFFICIAL SEQUENCE OF EVENTS:" },
      { t: "normal", s: "" },
      { t: "accent", s: "  21:00  Test protocol initiated." },
      { t: "accent", s: "         Authorized personnel present." },
      { t: "normal", s: "" },
      { t: "accent", s: "  21:03  Anomaly flagged by system." },
      { t: "accent", s: "         Engineer Sen alerted." },
      { t: "normal", s: "" },
      { t: "danger", s: "  21:04  Engineer collapse reported." },
      { t: "danger", s: "         Medical team dispatched." },
      { t: "normal", s: "" },
      { t: "normal", s: "  21:05  Security notified." },
      { t: "normal", s: "         Lab 7 sealed." },
      { t: "normal", s: "" },
      { t: "normal", s: "  21:12  Medical team on scene." },
      { t: "normal", s: "" },
      { t: "normal", s: "  21:15  Body temperature recorded." },
      { t: "normal", s: "" },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "normal", s: "REPORT STATUS: OFFICIAL / SEALED" },
      { t: "normal", s: "" },
      { t: "accent", s: "NOTE: Compare this timeline with" },
      { t: "accent", s: "forensic temperature estimate." },
      { t: "dim",    s: "─────────────────────────────────────" },
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function calculateTOD(bodyTemp: string, roomTemp: string, reportTimeStr: string): string | null {
  const tempDelta = 37.0 - parseFloat(bodyTemp);
  const ambientDiff = parseFloat(bodyTemp) - parseFloat(roomTemp);
  if (ambientDiff <= 0) return null;
  const minutesSinceDeath = Math.round((tempDelta / ambientDiff) * 55);
  const [h, m] = reportTimeStr.split(":").map(Number);
  const deathMinutes = h * 60 + m - minutesSinceDeath;
  const dh = Math.floor(deathMinutes / 60) % 24;
  const dm = Math.abs(deathMinutes % 60);
  return `${String(dh).padStart(2, "0")}:${String(dm).padStart(2, "0")}`;
}

function scoreQ3(text: string): { score: number; bonus: number } {
  const lower = text.toLowerCase();
  const keywords = ["neural", "overload", "earlier", "temperature", "cooling", "contradict", "report"];
  const hits = keywords.filter((k) => lower.includes(k)).length;
  const score = hits >= 4 ? 60 : hits >= 2 ? 40 : hits >= 1 ? 20 : 0;
  const bonus = text.length <= 160 && hits >= 3 ? 20 : 0;
  return { score, bonus };
}

function matchQ1(text: string): string | null {
  const t = text.toLowerCase();
  if (t.includes("neural") || t.includes("overload")) return "Neural overload";
  if (t.includes("cardiac") || t.includes("heart")) return "Cardiac arrest";
  if (t.includes("poison") || t.includes("chemical") || t.includes("toxic")) return "Chemical poisoning";
  if (t.includes("trauma") || t.includes("external") || t.includes("physical")) return "External trauma";
  return null;
}

function matchQ2(text: string): "Yes" | "No" | null {
  const t = text.toLowerCase();
  if (t.includes("yes") || t.includes("correct") || t.includes("contradict") || t === "y") return "Yes";
  if (t.includes("no") || t.includes("doesn") || t.includes("not") || t === "n") return "No";
  return null;
}

const lineColor = (t: LineType): string => {
  if (t === "accent") return "#ffaa44";
  if (t === "danger") return "#ff3333";
  if (t === "dim")    return "#551111";
  return "#cc9999";
};

// ── Shared styles ─────────────────────────────────────────────────────────────
const scanStyle: CSSProperties = {
  position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10,
  background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
};

// ── Sub-components ────────────────────────────────────────────────────────────
const GlitchTitle: FC = () => {
  const [g, setG] = useState(false);
  useEffect(() => {
    const iv = setInterval(() => { setG(true); setTimeout(() => setG(false), 120); }, 4000);
    return () => clearInterval(iv);
  }, []);
  return (
    <span style={{
      fontFamily: "'Courier New', monospace", fontSize: 13, fontWeight: 700,
      letterSpacing: 4, color: "#ff3333",
      textShadow: g ? "3px 0 #00ffff, -3px 0 #ff00ff" : "0 0 12px #ff333388",
    }}>
      HYBRID AUTOPSY TERMINAL
    </span>
  );
};

const Cursor: FC = () => {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const iv = setInterval(() => setOn((p) => !p), 530);
    return () => clearInterval(iv);
  }, []);
  return <span style={{ color: "#551111", opacity: on ? 1 : 0 }}>█</span>;
};

const EvidenceModal: FC<EvidenceModalProps> = ({ file, onClose }) => {
  if (!file) return null;
  const data = EVIDENCE[file];
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0c0000", border: "1px solid #ff3333",
          boxShadow: "0 0 30px #ff000044, inset 0 0 30px #0a000088",
          maxWidth: 520, width: "90%", maxHeight: "80vh", overflowY: "auto",
          padding: "20px 24px", position: "relative",
          fontFamily: "'Courier New', monospace", fontSize: 11,
        }}
      >
        <div style={scanStyle} />
        <div style={{ color: "#ff5555", fontWeight: 700, fontSize: 11, letterSpacing: 2, marginBottom: 14 }}>
          {data.title}
        </div>
        {data.lines.map((line, i) => (
          <div key={i} style={{ color: lineColor(line.t), lineHeight: "1.7", whiteSpace: "pre" }}>
            {line.s || "\u00A0"}
          </div>
        ))}
        <button
          onClick={onClose}
          style={{
            marginTop: 18, background: "transparent", border: "1px solid #ff3333",
            color: "#ff3333", fontFamily: "'Courier New', monospace", fontSize: 11,
            padding: "6px 16px", cursor: "pointer", letterSpacing: 2,
          }}
        >
          [ CLOSE FILE ]
        </button>
      </div>
    </div>
  );
};

const ChatMsg: FC<ChatMsgProps> = ({ msg }) => {
  const isBot = msg.from === "ghost";
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 12, flexDirection: isBot ? "row" : "row-reverse", alignItems: "flex-start" }}>
      {isBot && (
        <div style={{ width: 30, height: 30, flexShrink: 0, background: "#0d1f35", border: "1px solid #00e5cc44", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <GhostIcon size={22} />
        </div>
      )}
      <div style={{
        maxWidth: "82%", padding: "8px 12px",
        background: isBot ? "#0d1f3588" : "#1a0a0088",
        border: isBot ? "1px solid #00e5cc33" : "1px solid #ff333333",
        borderRadius: isBot ? "2px 8px 8px 8px" : "8px 2px 8px 8px",
        fontFamily: "'Courier New', monospace", fontSize: 11, lineHeight: 1.6,
        color: isBot ? "#a0e8d8" : "#ffaaaa",
        whiteSpace: "pre-wrap",
      }}>
        {msg.text}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function AutopsyTerminal() {
  const mono  = "'Courier New', monospace";
  const red   = "#ff3333";
  const dimRed = "#551111";
  const teal  = "#00e5cc";

  const [openFile,     setOpenFile]     = useState<EvidenceKey | null>(null);
  const [openedFiles,  setOpenedFiles]  = useState<EvidenceKey[]>([]);

  const [bodyTemp,    setBodyTemp]    = useState<string>("");
  const [roomTemp,    setRoomTemp]    = useState<string>("");
  const [reportTime,  setReportTime]  = useState<string>("");
  const [todResult,   setTodResult]   = useState<string | null>(null);
  const [todError,    setTodError]    = useState<string>("");

  const [messages,  setMessages]  = useState<Message[]>([]);
  const [inputVal,  setInputVal]  = useState<string>("");
  const [chatStep,  setChatStep]  = useState<ChatStep>("idle");
  const [typing,    setTyping]    = useState<boolean>(false);
  const [scores,    setScores]    = useState<Scores>({ q1: 0, q2: 0, q3: 0, bonus: 0 });
  const [submitted, setSubmitted] = useState<boolean>(false);

  const chatRef = useRef<HTMLDivElement>(null);

  const scroll = () =>
    setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, 60);

  const addBot = (text: string, delay = 0) => {
    setTyping(true);
    setTimeout(() => {
      setMessages((p) => [...p, { from: "ghost", text }]);
      setTyping(false);
      scroll();
    }, delay);
  };

  const addUser = (text: string) => {
    setMessages((p) => [...p, { from: "user", text }]);
    scroll();
  };

  useEffect(() => {
    setTimeout(() => addBot("GHOST41_ID online. Case file loaded: NeuroBand Incident. Subject: Rishab Sen."), 600);
    setTimeout(() => addBot("I'm your forensic analysis assistant. Inspect the evidence files and run the temperature module."), 1500);
    setTimeout(() => addBot("When you're ready, type 'ready' or click [ BEGIN ANALYSIS ]."), 2500);
  }, []);

  const startQ1 = () => {
    setChatStep("q1");
    addBot("Initiating forensic analysis sequence.", 200);
    addBot("Q1 — PRIMARY FAILURE IDENTIFICATION\nWhat was the primary cause of death?", 900);
  };

  const handleSend = () => {
    const text = inputVal.trim();
    if (!text) return;
    setInputVal("");
    addUser(text);

    if (chatStep === "idle") {
      if (/ready|begin|start/i.test(text)) {
        setTimeout(() => startQ1(), 400);
      } else {
        addBot("Type 'ready' to begin the analysis, or continue reviewing the evidence files.", 500);
      }
      return;
    }

    if (chatStep === "q1") {
      const match = matchQ1(text);
      if (!match) {
        addBot("I didn't recognise that. Try: Cardiac arrest, Chemical poisoning, Neural overload, or External trauma.", 500);
        return;
      }
      const q1Score = match === "Neural overload" ? 120 : 0;
      setScores((p) => ({ ...p, q1: q1Score }));
      addBot(
        match === "Neural overload"
          ? `Confirmed: ${match}. Consistent with NeuroBand device failure and autopsy findings. [+120 pts]`
          : `Logged: ${match}. Cross-reference with the autopsy report before finalising your deduction.`,
        600,
      );
      setTimeout(() => {
        setChatStep("q2");
        addBot("Q2 — TIMELINE CONTRADICTION\nDoes the body temperature evidence contradict the official incident timeline?", 1200);
      }, 1800);
      return;
    }

    if (chatStep === "q2") {
      const match = matchQ2(text);
      if (!match) {
        addBot("Please answer Yes or No.", 500);
        return;
      }
      const q2Score = match === "Yes" ? 100 : 0;
      setScores((p) => ({ ...p, q2: q2Score }));
      addBot(
        match === "Yes"
          ? "Correct. The forensic estimate places death earlier than the officially reported collapse time. [+100 pts]"
          : "Re-examine the temperature module output versus the official 21:04 timestamp.",
        600,
      );
      setTimeout(() => {
        setChatStep("q3");
        addBot("Q3 — ONE-LINE INFERENCE\nIn max 200 characters, summarise what the evidence reveals. Type your inference below.", 1200);
      }, 1800);
      return;
    }

    if (chatStep === "q3") {
      if (text.length > 200) {
        addBot(`Your inference is ${text.length} characters. Please keep it under 200.`, 400);
        return;
      }
      const { score, bonus } = scoreQ3(text);
      const newScores: Scores = { ...scores, q3: score, bonus };
      const total = newScores.q1 + newScores.q2 + score + bonus;
      setScores(newScores);
      setChatStep("done");
      setSubmitted(true);

      addBot("Inference logged. Running final analysis...", 500);
      setTimeout(() => {
        addBot(
          `ANALYSIS COMPLETE.\n\nQ1: ${newScores.q1}/120 pts\nQ2: ${newScores.q2}/100 pts\nQ3: ${score}/60 pts\nBonus: +${bonus} pts\n──────────────────\nTOTAL: ${total}/300 pts`,
          1600,
        );
      }, 2200);
      setTimeout(() => {
        addBot(
          total >= 250
            ? "Exceptional deduction. The physical evidence exposes a critical gap in the official narrative. This investigation is not over."
            : total >= 150
              ? "Solid analysis. Some connections missed — revisit the temperature data and cross-reference with the neural log."
              : "Analysis weak. The evidence files contain the answers. Review and re-examine.",
          3200,
        );
      }, 3800);
      return;
    }

    if (chatStep === "done") {
      addBot("Analysis complete. All responses have been logged.", 400);
    }
  };

  const handleCalc = () => {
    setTodError("");
    const bt = parseFloat(bodyTemp);
    const rt = parseFloat(roomTemp);
    if (!bodyTemp || !roomTemp || !reportTime) { setTodError("ALL FIELDS REQUIRED"); return; }
    if (isNaN(bt) || isNaN(rt))               { setTodError("INVALID TEMPERATURE VALUES"); return; }
    if (bt >= 37 || bt <= rt)                 { setTodError("IMPLAUSIBLE TEMPERATURE VALUES"); return; }
    if (!/^\d{2}:\d{2}$/.test(reportTime))   { setTodError("TIME FORMAT: HH:MM"); return; }
    const result = calculateTOD(bodyTemp, roomTemp, reportTime);
    setTodResult(result);
  };

  const handleFileOpen = (key: EvidenceKey) => {
    setOpenFile(key);
    if (!openedFiles.includes(key)) setOpenedFiles((p) => [...p, key]);
  };

  const totalScore = scores.q1 + scores.q2 + scores.q3 + scores.bonus;

  const evidenceButtons: [EvidenceKey, string][] = [
    ["autopsy",     "Autopsy Report"],
    ["neural",      "Neural Activity Log"],
    ["temperature", "Temperature Record"],
    ["timeline",    "Incident Timeline"],
  ];

  const scoreRows: [string, number, number][] = [
    ["Q1", scores.q1, 120],
    ["Q2", scores.q2, 100],
    ["Q3", scores.q3, 60],
    ["BONUS", scores.bonus, 20],
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#050000", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 12px 40px", fontFamily: mono, position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse at 50% 0%, #1a000022 0%, transparent 70%)" }} />
      <div style={scanStyle} />

      <EvidenceModal file={openFile} onClose={() => setOpenFile(null)} />

      {/* ── Header ── */}
      <div style={{ width: "100%", maxWidth: 960, border: `1px solid ${dimRed}`, background: "#0a0000", boxShadow: "0 0 40px #ff000022", marginBottom: 16, padding: "14px 20px", position: "relative", overflow: "hidden" }}>
        <div style={scanStyle} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ color: dimRed, fontSize: 9, letterSpacing: 4 }}>══════════════════════════════════════</div>
            <GlitchTitle />
            <div style={{ color: dimRed, fontSize: 9, letterSpacing: 4 }}>══════════════════════════════════════</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: red, boxShadow: `0 0 8px ${red}`, animation: "pulse 2s infinite" }} />
            <span style={{ color: red, fontSize: 9, letterSpacing: 2 }}>SYSTEM ONLINE</span>
          </div>
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 20, flexWrap: "wrap" }}>
          {(["CASE", "NeuroBand Incident"], [["CASE", "NeuroBand Incident"], ["SUBJECT", "Rishab Sen"], ["STATUS", "Post-Incident Analysis"]] as [string, string][]).map(([k, v]) => (
            <div key={k}>
              <span style={{ color: dimRed, fontSize: 10 }}>{k}: </span>
              <span style={{ color: "#cc6666", fontSize: 10 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      <div style={{ width: "100%", maxWidth: 960, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Evidence files */}
          <div style={{ border: `1px solid ${dimRed}`, background: "#0a0000", padding: "14px 16px", position: "relative", overflow: "hidden" }}>
            <div style={scanStyle} />
            <div style={{ color: red, fontSize: 10, letterSpacing: 3, marginBottom: 10, borderBottom: `1px solid ${dimRed}`, paddingBottom: 8 }}>
              ── EVIDENCE FILES ──────────────────────
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {evidenceButtons.map(([key, label]) => {
                const opened = openedFiles.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => handleFileOpen(key)}
                    style={{
                      background: opened ? "#1a0808" : "transparent",
                      border: `1px solid ${opened ? red : dimRed}`,
                      color: opened ? "#ff9999" : "#884444",
                      fontFamily: mono, fontSize: 10, padding: "10px 8px",
                      cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                      boxShadow: opened ? "0 0 10px #ff000033" : "none",
                    }}
                  >
                    <div style={{ fontSize: 8, marginBottom: 2, color: opened ? "#ff5555" : "#442222" }}>
                      {opened ? "▣ ACCESSED" : "▢ CLASSIFIED"}
                    </div>
                    [ {label} ]
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 10, color: "#442222", fontSize: 9 }}>{openedFiles.length}/4 files accessed</div>
          </div>

          {/* Forensic module */}
          <div style={{ border: `1px solid ${dimRed}`, background: "#0a0000", padding: "14px 16px", position: "relative", overflow: "hidden", flexGrow: 1 }}>
            <div style={scanStyle} />
            <div style={{ color: red, fontSize: 10, letterSpacing: 3, marginBottom: 4, borderBottom: `1px solid ${dimRed}`, paddingBottom: 8 }}>
              ── FORENSIC ESTIMATION MODULE ──────────
            </div>
            <div style={{ color: "#552222", fontSize: 9, marginBottom: 12 }}>Newton's Law of Cooling · Simplified Estimation</div>

            {(
              [
                { label: "Body Temperature (°C):", val: bodyTemp, set: setBodyTemp, ph: "°C" },
                { label: "Room Temperature (°C):", val: roomTemp, set: setRoomTemp, ph: "°C" },
                { label: "Official Report Time:",  val: reportTime, set: setReportTime, ph: "HH:MM" },
              ] as { label: string; val: string; set: (v: string) => void; ph: string }[]
            ).map(({ label, val, set, ph }) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ color: "#aa5555", fontSize: 10, marginBottom: 4 }}>{label}</div>
                <input
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  placeholder={ph}
                  style={{ background: "#0c0000", border: `1px solid ${dimRed}`, color: "#ff9999", fontFamily: mono, fontSize: 11, padding: "6px 10px", width: "100%", outline: "none" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = red)}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = dimRed)}
                />
              </div>
            ))}

            {todError && <div style={{ color: red, fontSize: 9, marginBottom: 8 }}>⚠ {todError}</div>}

            <button
              onClick={handleCalc}
              style={{ background: "#1a0000", border: `1px solid ${red}`, color: red, fontFamily: mono, fontSize: 10, letterSpacing: 2, padding: "8px 14px", cursor: "pointer", width: "100%", boxShadow: "0 0 10px #ff000033" }}
            >
              [ CALCULATE ESTIMATED TIME OF DEATH ]
            </button>

            <div style={{ marginTop: 14, borderTop: `1px solid ${dimRed}`, paddingTop: 10 }}>
              <div style={{ color: "#aa5555", fontSize: 10, marginBottom: 6 }}>Estimated Time of Death:</div>
              <div style={{
                background: "#0c0000",
                border: `1px solid ${todResult ? red : dimRed}`,
                padding: "10px 14px", fontSize: 18, letterSpacing: 4,
                color: todResult ? red : "#331111",
                boxShadow: todResult ? "0 0 20px #ff000044" : "none",
                textAlign: "center", fontWeight: 700,
              }}>
                {todResult ? `~${todResult}` : "--:--"}
              </div>
              {todResult && (
                <div style={{ marginTop: 8, color: "#886644", fontSize: 9, lineHeight: 1.6 }}>
                  ⚠ Official Report: 21:04<br />
                  ⚠ Est. Time of Death: {todResult}<br />
                  ⚠ DISCREPANCY DETECTED
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column — Ghost chat */}
        <div style={{ border: "1px solid #00e5cc33", background: "#060d18", display: "flex", flexDirection: "column", minHeight: 600, boxShadow: "0 0 30px #00e5cc11" }}>

          {/* Ghost header */}
          <div style={{ borderBottom: "1px solid #00e5cc22", padding: "12px 14px", background: "#080f1e", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, background: "#0d1f35", border: "1px solid #00e5cc44", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <GhostIcon size={28} />
            </div>
            <div>
              <div style={{ color: teal, fontSize: 12, letterSpacing: 4, fontWeight: 700 }}>GHOST41_ID</div>
              <div style={{ color: "#336677", fontSize: 9, letterSpacing: 2 }}>
                INVESTIGATION ASSISTANT · <span style={{ color: "#00cc88" }}>ONLINE</span>
              </div>
            </div>
            {submitted && (
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ color: teal, fontSize: 11, letterSpacing: 2 }}>{totalScore}/300</div>
                <div style={{ color: "#336677", fontSize: 9 }}>FINAL SCORE</div>
              </div>
            )}
          </div>

          {/* Chat messages */}
          <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column" }}>
            {messages.map((m, i) => <ChatMsg key={i} msg={m} />)}
            {typing && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <div style={{ width: 30, height: 30, background: "#0d1f35", border: "1px solid #00e5cc44", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <GhostIcon size={22} />
                </div>
                <span style={{ color: teal, fontSize: 18, letterSpacing: 2 }}>···</span>
              </div>
            )}
          </div>

          {/* Input row */}
          <div style={{ borderTop: "1px solid #00e5cc22", padding: "10px 12px", background: "#060d18", display: "flex", gap: 8, alignItems: "center" }}>
            {chatStep === "idle" && (
              <button
                onClick={() => { addUser("Begin analysis"); setTimeout(() => startQ1(), 400); }}
                style={{ background: "#0a2235", border: `1px solid ${teal}`, color: teal, fontFamily: mono, fontSize: 9, letterSpacing: 2, padding: "7px 14px", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 0 10px #00e5cc22", flexShrink: 0 }}
              >
                [ BEGIN ANALYSIS ]
              </button>
            )}
            <input
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                chatStep === "q3"   ? "Type your inference (max 200 chars)..."
                : chatStep === "done" ? "Analysis complete"
                : "Type a message..."
              }
              disabled={chatStep === "done"}
              style={{ flex: 1, background: "#080f1e", border: "1px solid #00e5cc22", color: "#a0e8d8", fontFamily: mono, fontSize: 10, padding: "7px 10px", outline: "none", opacity: chatStep === "done" ? 0.4 : 1 }}
            />
            <button
              onClick={handleSend}
              disabled={chatStep === "done"}
              style={{ background: "transparent", border: `1px solid ${teal}`, color: teal, fontFamily: mono, fontSize: 9, padding: "7px 12px", cursor: "pointer", opacity: chatStep === "done" ? 0.4 : 1 }}
            >
              ▶
            </button>
          </div>

          {/* Score strip */}
          {submitted && (
            <div style={{ borderTop: "1px solid #00e5cc22", padding: "10px 14px", background: "#04080f", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4 }}>
              {scoreRows.map(([label, val, max]) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ color: "#336677", fontSize: 8 }}>{label}</div>
                  <div style={{ color: val > 0 ? teal : "#331111", fontSize: 11, fontWeight: 700 }}>{val}</div>
                  <div style={{ color: "#224433", fontSize: 7 }}>/{max}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ width: "100%", maxWidth: 960, marginTop: 12, borderTop: `1px solid ${dimRed}`, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: dimRed, fontSize: 8, letterSpacing: 2 }}>INTERNAL OPERATIONS CONSOLE · ROUND 2 · TASK 1</span>
        <Cursor />
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #050000; }
        ::-webkit-scrollbar-thumb { background: #331111; }
        * { box-sizing: border-box; }
        button:active { transform: scale(0.98); }
      `}</style>
    </div>
  );
}