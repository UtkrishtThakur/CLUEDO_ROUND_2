import { useState, useEffect, useRef, CSSProperties, FC } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type LineType    = "normal" | "accent" | "danger" | "dim";
type ChatStep    = "idle" | "q1" | "q2" | "q3" | "done";
type EvidenceKey = "autopsy" | "neural" | "temperature" | "timeline";

interface EvidenceLine   { t: LineType; s: string; }
interface EvidenceFile   { title: string; lines: EvidenceLine[]; }
interface Message        { from: "ghost" | "user"; text: string; }
interface Scores         { q1: number; q2: number; q3: number; }
interface GhostIconProps { size?: number; }
interface ModalProps     { file: EvidenceKey | null; onClose: () => void; }
interface MsgProps       { msg: Message; }

// ── Constants ─────────────────────────────────────────────────────────────────
const Q1_CORRECT = "Neural overload";
const Q2_CORRECT = "Safety dampening / shutdown system";

const Q1_OPTIONS = [
  "Brain hemorrhage",
  "Chemical poisoning",
  "Neural overload",
  "External trauma",
];

const Q2_OPTIONS = [
  "Feedback regulation system",
  "Signal amplification module",
  "Safety dampening / shutdown system",
  "Data integrity system",
  "Thermal control system",
];

const HINTS: Record<"weak" | "medium" | "direct", { cost: number; label: string; text: string }> = {
  weak: {
    cost: 10,
    label: "Weak hint",
    text: "WEAK HINT (-10 pts):\nLook at what caused the failure, how the system reacted to it, and whether the timeline matches the physical evidence.",
  },
  medium: {
    cost: 15,
    label: "Medium hint",
    text: "MEDIUM HINT (-15 pts):\nThe logs show abnormal neural activity, the system attempts to control it, and the temperature data may not align with the official report.",
  },
  direct: {
    cost: 20,
    label: "Direct hint",
    text: "DIRECT HINT (-20 pts):\nThe subject experienced extreme neural activity, the system failed to stop it due to a safety/dampening failure, and the estimated time of death does not match the official timeline. If you're unsure about the medical terminology in the autopsy, try looking it up.",
  },
};

// ── Evidence Data ─────────────────────────────────────────────────────────────
const EVIDENCE: Record<EvidenceKey, EvidenceFile> = {
  autopsy: {
    title: "[ FORENSIC POSTMORTEM REPORT — NB-IR-2147 ]",
    lines: [
      { t: "normal", s: "CASE ID: NB-IR-2147 | STATUS: FINALIZED" },
      { t: "normal", s: "SUBJECT: Rishab Sen | AGE: 31 | SEX: Male" },
      { t: "normal", s: "DATE: 12 Oct 20XX | LOCATION: Sector 4" },
      { t: "normal", s: "LEAD EXAMINER: Dr. A. Rao" },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "normal", s: "EXTERNAL EXAMINATION:" },
      { t: "normal", s: "" },
      { t: "accent", s: "  › No blunt force trauma, lacerations" },
      { t: "accent", s: "    or abrasions detected." },
      { t: "accent", s: "  › No signs of struggle." },
      { t: "accent", s: "  › No thermal or electrical burns" },
      { t: "accent", s: "    on torso or extremities." },
      { t: "accent", s: "  › No puncture marks detected." },
      { t: "normal", s: "" },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "normal", s: "INTERNAL EXAMINATION:" },
      { t: "normal", s: "" },
      { t: "danger", s: "  › DIFFUSE CEREBRAL EDEMA detected." },
      { t: "danger", s: "  › Petechial hemorrhaging in deep" },
      { t: "danger", s: "    cortical layers." },
      { t: "danger", s: "  › Catastrophic depolarization event" },
      { t: "danger", s: "    across neural pathways." },
      { t: "accent", s: "  › Contraction band necrosis in heart" },
      { t: "accent", s: "    tissue — catecholamine surge." },
      { t: "normal", s: "  › Systemic shutdown: extreme velocity." },
      { t: "normal", s: "" },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "normal", s: "TOXICOLOGY:" },
      { t: "normal", s: "" },
      { t: "accent", s: "  › Narcotics/Stimulants/Toxins: NEGATIVE" },
      { t: "accent", s: "  › Poisoning: STRICTLY RULED OUT" },
      { t: "normal", s: "" },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "danger", s: "CAUSE OF DEATH:" },
      { t: "danger", s: "  Acute Myocardial Asystole secondary" },
      { t: "danger", s: "  to Idiopathic Cortical Overload." },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "normal", s: "Signed: Dr. A. Rao, Chief Medical Examiner" },
    ],
  },
  neural: {
    title: "[ NEURAL SYSTEM ACTIVITY LOG — SESSION 8842-X ]",
    lines: [
      { t: "normal", s: "SYSTEM: NEURAL_INTERFACE_B3" },
      { t: "normal", s: "SESSION ID: 8842-X | USER: SEN_R_931" },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "normal", s: "TIMESTAMP     EVENT" },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "normal", s: "21:00:11  [SYS]  Handshake 100% stable. AES-256." },
      { t: "normal", s: "21:00:25  [LINK] Neural monitoring active. Lock: SEN_R." },
      { t: "normal", s: "21:00:40  [SENS] Ocular tracking: OK. Vestibular: OK." },
      { t: "normal", s: "21:00:58  [CALB] Impedance: 0.48k Ohm. SNR: 94dB." },
      { t: "normal", s: "21:01:20  [DATA] Buffer stream initialized. 1024kb." },
      { t: "normal", s: "21:01:42  [PHYS] Baseline 12Hz. Heart rate: 72bpm." },
      { t: "accent", s: "21:02:05  [WARN] Oscillation in Node 7-Theta." },
      { t: "accent", s: "21:02:17  [ERR]  Feedback fluctuation pre-frontal." },
      { t: "accent", s: "21:02:30  [SYNC] Phase-lock drifting; auto-comp active." },
      { t: "danger", s: "21:14:44  [CRIT] NEURAL SPIKE. Motor cortex +440%." },
      { t: "danger", s: "21:14:50  [SENS] Pupillary dilation: MAX. Galvanic: PEAK." },
      { t: "danger", s: "21:14:55  [VOLT] Synaptic voltage >110mV. ERR_V_THR." },
      { t: "danger", s: "21:15:02  [LOG]  Sustained excitation; bypass in safety shunt." },
      { t: "danger", s: "21:15:05  [CRIT] Neurotransmitter saturation. Dopamine flood." },
      { t: "danger", s: "21:15:08  [SYS]  Manual dampeners FAILED. Override FAILED." },
      { t: "danger", s: "21:15:10  [HALT] !! TOTAL NEURAL OVERLOAD !! Dump initiated." },
      { t: "danger", s: "21:15:12  [TLM]  Signal degradation detected." },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "normal", s: "21:15:15  [EOF]  Monitoring terminated. → SECURE_ROOT." },
      { t: "dim",    s: "─────────────────────────────────────" },
    ],
  },
  temperature: {
    title: "[ FORENSIC DATA SHEET: THERMAL ANALYSIS ]",
    lines: [
      { t: "normal", s: "CASE REFERENCE: NB-IR-2147" },
      { t: "normal", s: "SUBJECT: Rishab Sen" },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "normal", s: "PARAMETER            READING" },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "accent", s: "Body Temperature:    32.4°C" },
      { t: "accent", s: "Room Temperature:    22°C" },
      { t: "accent", s: "Measurement Time:    21:25" },
      { t: "normal", s: "Method: Deep tissue digital probe" },
      { t: "normal", s: "" },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "normal", s: "NOTE: Estimated time of death may be" },
      { t: "normal", s: "inferred using thermal decay analysis." },
      { t: "normal", s: "" },
      { t: "accent", s: "HINT: Normal body temp = 37.0°C" },
      { t: "accent", s: "      Delta = 37.0 - 32.4 = 4.6°C" },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "normal", s: "Sensor calibrated: ✓ VERIFIED" },
      { t: "normal", s: "Chain of custody:  ✓ INTACT" },
      { t: "dim",    s: "─────────────────────────────────────" },
    ],
  },
  timeline: {
    title: "[ OFFICIAL INCIDENT TIMELINE — #992-ALPHA ]",
    lines: [
      { t: "normal", s: "INCIDENT REF: #992-ALPHA | SITE 4" },
      { t: "normal", s: "DATE: 12 Oct 20XX" },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "normal", s: "TIME    EVENT" },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "normal", s: "21:00   Session Start: User SEN_R_931" },
      { t: "normal", s: "" },
      { t: "normal", s: "21:01   Interface Sync: 100% Signal Quality" },
      { t: "normal", s: "" },
      { t: "accent", s: "21:03   Network Latency Warning: Node 4-B" },
      { t: "normal", s: "" },
      { t: "danger", s: "21:04   Visual Confirmation: Subject unresponsive" },
      { t: "normal", s: "" },
      { t: "danger", s: "21:05   Facility Alert: Medical Emergency Level 2" },
      { t: "normal", s: "" },
      { t: "accent", s: "21:06   System Shutdown: Automated Safety Protocol" },
      { t: "normal", s: "" },
      { t: "normal", s: "21:08   Site Arrival: First Response Team" },
      { t: "dim",    s: "─────────────────────────────────────" },
      { t: "normal", s: "REPORT STATUS: OFFICIAL / SEALED" },
      { t: "normal", s: "" },
      { t: "danger", s: "NOTE: Neural log shows overload at 21:15:10" },
      { t: "danger", s: "vs official collapse report at 21:04." },
      { t: "danger", s: "Cross-reference with thermal data." },
      { t: "dim",    s: "─────────────────────────────────────" },
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function scoreQ3(text: string): number {
  const lower = text.toLowerCase();
  const kw = ["neural","overload","earlier","temperature","cooling","contradict","report","cortical","dampening","safety"];
  const hits = kw.filter((k) => lower.includes(k)).length;
  return hits >= 4 ? 40 : hits >= 2 ? 25 : hits >= 1 ? 10 : 0;
}

const lineColor = (t: LineType): string => {
  if (t === "accent") return "#ffaa44";
  if (t === "danger") return "#ff3333";
  if (t === "dim")    return "#551111";
  return "#cc9999";
};

const scanStyle: CSSProperties = {
  position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10,
  background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.08) 2px,rgba(0,0,0,0.08) 4px)",
};

// ── Sub-components ────────────────────────────────────────────────────────────
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
    }}>HYBRID AUTOPSY TERMINAL</span>
  );
};

const Cursor: FC = () => {
  const [on, setOn] = useState(true);
  useEffect(() => { const iv = setInterval(() => setOn((p) => !p), 530); return () => clearInterval(iv); }, []);
  return <span style={{ color: "#551111", opacity: on ? 1 : 0 }}>█</span>;
};

const EvidenceModal: FC<ModalProps> = ({ file, onClose }) => {
  if (!file) return null;
  const data = EVIDENCE[file];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#0c0000", border: "1px solid #ff3333",
        boxShadow: "0 0 30px #ff000044, inset 0 0 30px #0a000088",
        maxWidth: 520, width: "90%", maxHeight: "80vh", overflowY: "auto",
        padding: "20px 24px", position: "relative", fontFamily: "'Courier New', monospace", fontSize: 11,
      }}>
        <div style={scanStyle} />
        <div style={{ color: "#ff5555", fontWeight: 700, fontSize: 11, letterSpacing: 2, marginBottom: 14 }}>{data.title}</div>
        {data.lines.map((line, i) => (
          <div key={i} style={{ color: lineColor(line.t), lineHeight: "1.7", whiteSpace: "pre" }}>{line.s || "\u00A0"}</div>
        ))}
        <button onClick={onClose} style={{
          marginTop: 18, background: "transparent", border: "1px solid #ff3333",
          color: "#ff3333", fontFamily: "'Courier New', monospace", fontSize: 11,
          padding: "6px 16px", cursor: "pointer", letterSpacing: 2,
        }}>[ CLOSE FILE ]</button>
      </div>
    </div>
  );
};

const ChatMsg: FC<MsgProps> = ({ msg }) => {
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
        color: isBot ? "#a0e8d8" : "#ffaaaa", whiteSpace: "pre-wrap",
      }}>{msg.text}</div>
    </div>
  );
};

// ── Option Button ─────────────────────────────────────────────────────────────
const OptBtn: FC<{ label: string; onClick: () => void; disabled?: boolean }> = ({ label, onClick, disabled }) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "block", width: "100%", background: hover && !disabled ? "#0d2a3a" : "transparent",
        border: `1px solid ${hover && !disabled ? "#00e5cc66" : "#00e5cc22"}`,
        color: hover && !disabled ? "#00e5cc" : "#5599aa",
        fontFamily: "'Courier New', monospace", fontSize: 10, letterSpacing: 1,
        padding: "8px 12px", marginBottom: 6, cursor: disabled ? "default" : "pointer",
        textAlign: "left", opacity: disabled ? 0.35 : 1,
        boxShadow: hover && !disabled ? "0 0 8px #00e5cc22" : "none",
        transition: "all 0.15s",
      }}
    >{label}</button>
  );
};

// ── Hint Button ───────────────────────────────────────────────────────────────
const HintBtn: FC<{ level: "weak" | "medium" | "direct"; used: boolean; onClick: () => void }> = ({ level, used, onClick }) => {
  const [hover, setHover] = useState(false);
  const h = HINTS[level];
  return (
    <button
      onClick={used ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        width: "100%", marginBottom: 6,
        background: used ? "#0d0800" : hover ? "#2a1400" : "#1a0c00",
        border: `1px solid ${used ? "#553300" : hover ? "#ffaa44aa" : "#ffaa4455"}`,
        color: used ? "#553300" : hover ? "#ffcc66" : "#cc8833",
        fontFamily: "'Courier New', monospace", fontSize: 10, letterSpacing: 1,
        padding: "8px 12px", cursor: used ? "default" : "pointer",
        textDecoration: used ? "line-through" : "none",
        boxShadow: !used && hover ? "0 0 10px #ffaa4422" : "none",
        transition: "all 0.15s",
      }}
    >
      <span>{h.label}</span>
      <span style={{ fontSize: 9, color: used ? "#442200" : hover ? "#ffaa44" : "#884400" }}>
        {used ? "USED" : `-${h.cost} pts`}
      </span>
    </button>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function AutopsyTerminal() {
  const mono   = "'Courier New', monospace";
  const red    = "#ff3333";
  const dimRed = "#551111";
  const teal   = "#00e5cc";

  // Evidence
  const [openFile,    setOpenFile]    = useState<EvidenceKey | null>(null);
  const [openedFiles, setOpenedFiles] = useState<EvidenceKey[]>([]);

  // Forensic module
  const [bodyTemp,  setBodyTemp]  = useState<string>("");
  const [roomTemp,  setRoomTemp]  = useState<string>("");
  const [todShown,  setTodShown]  = useState<boolean>(false);
  const [todError,  setTodError]  = useState<string>("");

  // Chat
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [inputVal,   setInputVal]   = useState<string>("");
  const [chatStep,   setChatStep]   = useState<ChatStep>("idle");
  const [typing,     setTyping]     = useState<boolean>(false);
  const [scores,     setScores]     = useState<Scores>({ q1: 0, q2: 0, q3: 0 });
  const [submitted,  setSubmitted]  = useState<boolean>(false);

  // Q answers
  const [pendingQ1, setPendingQ1] = useState<string>("");

  // Hints — all usable, cumulative penalty
  const [hintsUsed,    setHintsUsed]   = useState<Set<"weak" | "medium" | "direct">>(new Set());
  const [hintPenalty,  setHintPenalty] = useState<number>(0);

  // Q1/Q2 locked after selection
  const [q1Locked, setQ1Locked] = useState<boolean>(false);
  const [q2Locked, setQ2Locked] = useState<boolean>(false);

  const chatRef = useRef<HTMLDivElement>(null);
  const scroll  = () => setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, 60);

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

  // ── Q1 click ─────────────────────────────────────────────────────────────
  const handleQ1Click = (val: string) => {
    if (q1Locked) return;
    setQ1Locked(true);
    setPendingQ1(val);
    addUser(val);
    setTimeout(() => {
      setChatStep("q2");
      addBot("Q2 — CRITICAL SYSTEM FAILURE\nWhich system function failed to stop the abnormal neural activity?\n\nClick your answer below. Use hints if needed.");
    }, 600);
  };

  // ── Q2 click ─────────────────────────────────────────────────────────────
  const handleQ2Click = (val: string) => {
    if (q2Locked) return;
    setQ2Locked(true);
    addUser(val);
    addBot("Answers logged. Evaluating both responses...", 500);
    setTimeout(() => validateBoth(pendingQ1, val), 1200);
  };

  // ── Hint click ────────────────────────────────────────────────────────────
  const handleHintClick = (level: "weak" | "medium" | "direct") => {
    if (hintsUsed.has(level)) return;
    setHintsUsed((prev) => new Set([...prev, level]));
    setHintPenalty((p) => p + HINTS[level].cost);
    addBot(HINTS[level].text, 300);
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validateBoth = (q1: string, q2: string) => {
    const q1ok = q1 === Q1_CORRECT;
    const q2ok = q2 === Q2_CORRECT;
    if (q1ok && q2ok) {
      const q2score = Math.max(0, 30 - hintPenalty);
      setScores((p) => ({ ...p, q1: 30, q2: q2score }));
      addBot("Both answers confirmed. Consistent with the neural activity log. Well deduced.", 600);
      setTimeout(() => {
        setChatStep("q3");
        addBot("Q3 — ONE-LINE INFERENCE\nIn max 200 characters, summarise what the evidence reveals. Type your inference below.", 1200);
      }, 1800);
    } else {
      addBot("One or more answers is incorrect. Review the evidence and try again.", 700);
      setTimeout(() => {
        setPendingQ1("");
        setQ1Locked(false);
        setQ2Locked(false);
        setHintsUsed(new Set());
        setHintPenalty(0);
        setChatStep("q1");
        addBot("Q1 — PRIMARY FAILURE IDENTIFICATION\nWhat was the primary cause of death?\n\nClick your answer below.", 1200);
      }, 2000);
    }
  };

  // ── Forensic calc ─────────────────────────────────────────────────────────
  const handleCalc = () => {
    setTodError("");
    const bt = parseFloat(bodyTemp), rt = parseFloat(roomTemp);
    if (!bodyTemp || !roomTemp)   { setTodError("BOTH TEMPERATURE FIELDS REQUIRED"); return; }
    if (isNaN(bt) || isNaN(rt))   { setTodError("INVALID TEMPERATURE VALUES"); return; }
    if (bt >= 37 || bt <= rt)     { setTodError("IMPLAUSIBLE TEMPERATURE VALUES"); return; }
    setTodShown(true);
  };

  const handleFileOpen = (key: EvidenceKey) => {
    setOpenFile(key);
    if (!openedFiles.includes(key)) setOpenedFiles((p) => [...p, key]);
  };

  // ── Chat input (only for idle + q3) ──────────────────────────────────────
  const handleSend = () => {
    const text = inputVal.trim();
    if (!text) return;
    setInputVal("");

    if (chatStep === "idle") {
      addUser(text);
      if (/ready|begin|start/i.test(text)) {
        setTimeout(() => startQ1(), 400);
      } else {
        addBot("Type 'ready' to begin the analysis, or review the evidence files.", 500);
      }
      return;
    }

    if (chatStep === "q3") {
      addUser(text);
      if (text.length > 200) {
        addBot(`Your inference is ${text.length} characters. Please keep it under 200.`, 400);
        return;
      }
      const q3score  = scoreQ3(text);
      const newQ2    = Math.max(0, 30 - hintPenalty);
      const newScores: Scores = { q1: scores.q1, q2: newQ2, q3: q3score };
      const total    = newScores.q1 + newScores.q2 + q3score;
      setScores(newScores);
      setChatStep("done");
      setSubmitted(true);
      const penNote  = hintPenalty > 0 ? ` (hint penalty: -${hintPenalty})` : "";
      addBot("Inference logged. Running final analysis...", 500);
      setTimeout(() => {
        addBot(
          `ANALYSIS COMPLETE.\n\nQ1: ${newScores.q1}/30 pts\nQ2: ${newScores.q2}/30 pts${penNote}\n──────────────────\nTOTAL: ${newScores.q1 + newScores.q2}/60 pts`,
          1600,
        );
      }, 2200);
      setTimeout(() => {
        addBot(
          total >= 85
            ? "Exceptional deduction. The physical evidence exposes a critical gap in the official narrative. This investigation is not over."
            : "",
          3200,
        );
      }, 3800);
      return;
    }

    if (chatStep === "done") {
      addUser(text);
      addBot("Analysis complete. All responses have been logged.", 400);
    }
  };

  const startQ1 = () => {
    setQ1Locked(false);
    setQ2Locked(false);
    setChatStep("q1");
    addBot("Initiating forensic analysis sequence.", 200);
    addBot("Q1 — PRIMARY FAILURE IDENTIFICATION\nWhat was the primary cause of death?\n\nClick your answer below.", 900);
  };

  const totalScore = scores.q1 + scores.q2 + scores.q3;

  const evidenceBtns: [EvidenceKey, string][] = [
    ["autopsy",     "Autopsy Report"],
    ["neural",      "Neural Activity Log"],
    ["temperature", "Temperature Record"],
    ["timeline",    "Incident Timeline"],
  ];

  const inputDisabled = chatStep === "done" || chatStep === "q1" || chatStep === "q2";

  return (
    <div style={{ minHeight: "100vh", background: "#050000", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 12px 40px", fontFamily: mono }}>
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
          {([["CASE","NeuroBand Incident"],["SUBJECT","Rishab Sen"],["STATUS","Post-Incident Analysis"]] as [string,string][]).map(([k,v]) => (
            <div key={k}><span style={{ color: dimRed, fontSize: 10 }}>{k}: </span><span style={{ color: "#cc6666", fontSize: 10 }}>{v}</span></div>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      <div style={{ width: "100%", maxWidth: 960, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Evidence files */}
          <div style={{ border: `1px solid ${dimRed}`, background: "#0a0000", padding: "14px 16px", position: "relative", overflow: "hidden" }}>
            <div style={scanStyle} />
            <div style={{ color: red, fontSize: 13, letterSpacing: 3, marginBottom: 12, borderBottom: `1px solid ${dimRed}`, paddingBottom: 10, fontWeight: 700 }}>── EVIDENCE FILES ──────────────────────</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {evidenceBtns.map(([key, label]) => {
                const opened = openedFiles.includes(key);
                return (
                  <button key={key} onClick={() => handleFileOpen(key)} style={{
                    background: opened ? "#1a0808" : "transparent",
                    border: `1px solid ${opened ? red : dimRed}`,
                    color: opened ? "#ff9999" : "#884444",
                    fontFamily: mono, fontSize: 12, padding: "12px 10px",
                    cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                    boxShadow: opened ? "0 0 10px #ff000033" : "none",
                  }}>
                    <div style={{ fontSize: 9, marginBottom: 3, color: opened ? "#ff5555" : "#442222" }}>{opened ? "▣ ACCESSED" : "▢ CLASSIFIED"}</div>
                    [ {label} ]
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 10, color: "#664444", fontSize: 10 }}>{openedFiles.length}/4 files accessed</div>
          </div>

          {/* Forensic module */}
          <div style={{ border: `1px solid ${dimRed}`, background: "#0a0000", padding: "14px 16px", position: "relative", overflow: "hidden", flexGrow: 1 }}>
            <div style={scanStyle} />
            <div style={{ color: red, fontSize: 13, letterSpacing: 3, marginBottom: 6, borderBottom: `1px solid ${dimRed}`, paddingBottom: 10, fontWeight: 700 }}>── FORENSIC ESTIMATION MODULE ──────────</div>
            <div style={{ color: "#774444", fontSize: 10, marginBottom: 14 }}>Newton's Law of Cooling · Simplified Estimation</div>
            {([
              { label: "Body Temperature (°C):", val: bodyTemp, set: setBodyTemp },
              { label: "Room Temperature (°C):", val: roomTemp, set: setRoomTemp },
            ] as { label: string; val: string; set: (v: string) => void }[]).map(({ label, val, set }) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ color: "#cc6666", fontSize: 11, marginBottom: 5 }}>{label}</div>
                <input value={val} onChange={(e) => set(e.target.value)} placeholder="°C"
                  style={{ background: "#0c0000", border: `1px solid ${dimRed}`, color: "#ff9999", fontFamily: mono, fontSize: 12, padding: "8px 12px", width: "100%", outline: "none" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = red)}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = dimRed)}
                />
              </div>
            ))}
            {todError && <div style={{ color: red, fontSize: 9, marginBottom: 8 }}>⚠ {todError}</div>}
            <button onClick={handleCalc} style={{ background: "#1a0000", border: `1px solid ${red}`, color: red, fontFamily: mono, fontSize: 11, letterSpacing: 2, padding: "10px 14px", cursor: "pointer", width: "100%", boxShadow: "0 0 14px #ff000044" }}>
              [ CALCULATE ESTIMATED TIME OF DEATH ]
            </button>
            <div style={{ marginTop: 14, borderTop: `1px solid ${dimRed}`, paddingTop: 10 }}>
              <div style={{ color: "#cc6666", fontSize: 11, marginBottom: 8, fontWeight: 700 }}>Estimated Time of Death:</div>
              <div style={{ background: "#0c0000", border: `1px solid ${todShown ? red : dimRed}`, padding: "12px 14px", fontSize: 22, letterSpacing: 5, color: todShown ? red : "#331111", boxShadow: todShown ? "0 0 20px #ff000044" : "none", textAlign: "center", fontWeight: 700 }}>
                {todShown ? "~21:15" : "--:--"}
              </div>
              {todShown && (
                <div style={{ marginTop: 8, color: "#886644", fontSize: 9, lineHeight: 1.6 }}>
                  ⚠ Official Report: 21:04<br />⚠ Est. Time of Death: 21:15<br />⚠ DISCREPANCY DETECTED
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right — Ghost */}
        <div style={{ border: "1px solid #00e5cc33", background: "#060d18", display: "flex", flexDirection: "column", minHeight: 600, boxShadow: "0 0 30px #00e5cc11" }}>

          {/* Ghost header */}
          <div style={{ borderBottom: "1px solid #00e5cc22", padding: "12px 14px", background: "#080f1e", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, background: "#0d1f35", border: "1px solid #00e5cc44", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <GhostIcon size={28} />
            </div>
            <div>
              <div style={{ color: teal, fontSize: 12, letterSpacing: 4, fontWeight: 700 }}>GHOST41_ID</div>
              <div style={{ color: "#336677", fontSize: 9, letterSpacing: 2 }}>INVESTIGATION ASSISTANT · <span style={{ color: "#00cc88" }}>ONLINE</span></div>
            </div>
            {submitted && (
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ color: teal, fontSize: 11, letterSpacing: 2 }}>{totalScore}/100</div>
                <div style={{ color: "#336677", fontSize: 9 }}>FINAL SCORE</div>
              </div>
            )}
          </div>

          {/* Chat */}
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

          {/* Q1 clickable options */}
          {chatStep === "q1" && (
            <div style={{ padding: "10px 14px", borderTop: "2px solid #00e5cc33", background: "#030b14" }}>
              <div style={{ color: "#00e5cc99", fontSize: 9, letterSpacing: 3, marginBottom: 10 }}>▶ SELECT CAUSE OF DEATH</div>
              {Q1_OPTIONS.map((opt, i) => (
                <OptBtn key={opt} label={`${String.fromCharCode(65+i)}. ${opt}`} onClick={() => handleQ1Click(opt)} disabled={q1Locked} />
              ))}
            </div>
          )}

          {/* Q2 clickable options + hints */}
          {chatStep === "q2" && (
            <div>
              {/* Options */}
              <div style={{ padding: "10px 14px", borderTop: "2px solid #00e5cc33", background: "#030b14" }}>
                <div style={{ color: "#00e5cc99", fontSize: 9, letterSpacing: 3, marginBottom: 10 }}>▶ SELECT FAILED SYSTEM FUNCTION</div>
                {Q2_OPTIONS.map((opt, i) => (
                  <OptBtn key={opt} label={`${String.fromCharCode(65+i)}. ${opt}`} onClick={() => handleQ2Click(opt)} disabled={q2Locked} />
                ))}
              </div>

              {/* Hint panel */}
              <div style={{ padding: "12px 14px", borderTop: "2px solid #ffaa4455", background: "#120a00" }}>
                <div style={{ color: "#ffaa44", fontSize: 9, letterSpacing: 3, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11 }}>⚠</span> HINTS — CLICK TO REVEAL (points deducted per hint)
                </div>
                {(["weak","medium","direct"] as const).map((level) => (
                  <HintBtn key={level} level={level} used={hintsUsed.has(level)} onClick={() => handleHintClick(level)} />
                ))}
                {hintsUsed.size > 0 && (
                  <div style={{ marginTop: 8, padding: "6px 8px", background: "#0a0600", border: "1px solid #553300", fontSize: 9, color: "#886633", lineHeight: 1.6 }}>
                    Hints used: {[...hintsUsed].join(", ")} | Penalty: -{hintPenalty} pts
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Input row */}
          <div style={{ borderTop: "1px solid #00e5cc22", padding: "10px 12px", background: "#060d18", display: "flex", gap: 8, alignItems: "center" }}>
            {chatStep === "idle" && (
              <button onClick={() => { addUser("Begin analysis"); setTimeout(() => startQ1(), 400); }}
                style={{ background: "#0a2235", border: `1px solid ${teal}`, color: teal, fontFamily: mono, fontSize: 9, letterSpacing: 2, padding: "7px 14px", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 0 10px #00e5cc22", flexShrink: 0 }}>
                [ BEGIN ANALYSIS ]
              </button>
            )}
            <input
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                chatStep === "q1" || chatStep === "q2" ? "Click an option above..."
                : chatStep === "q3"   ? "Type your inference (max 200 chars)..."
                : chatStep === "done" ? "Analysis complete"
                : "Type a message..."
              }
              disabled={inputDisabled}
              style={{ flex: 1, background: "#080f1e", border: "1px solid #00e5cc22", color: "#a0e8d8", fontFamily: mono, fontSize: 10, padding: "7px 10px", outline: "none", opacity: inputDisabled ? 0.4 : 1 }}
            />
            <button onClick={handleSend} disabled={inputDisabled}
              style={{ background: "transparent", border: `1px solid ${teal}`, color: teal, fontFamily: mono, fontSize: 9, padding: "7px 12px", cursor: "pointer", opacity: inputDisabled ? 0.4 : 1 }}>
              ▶
            </button>
          </div>

          {/* Score strip */}
          {submitted && (
            <div style={{ borderTop: "1px solid #00e5cc22", padding: "10px 14px", background: "#04080f", display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 4 }}>
              {([["Q1", scores.q1, 30],["Q2", scores.q2, 30]] as [string,number,number][]).map(([label,val,max]) => (
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
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:#050000; }
        ::-webkit-scrollbar-thumb { background:#331111; }
        * { box-sizing:border-box; }
        button:active { transform:scale(0.98); }
      `}</style>
    </div>
  );
}
