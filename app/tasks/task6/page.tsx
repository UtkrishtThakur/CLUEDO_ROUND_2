"use client";
// @ts-nocheck
import { useState, useCallback } from "react";

// 🔻 ONLY CHANGE: removed default export from Task6

type EvidenceId = string;
type ChainId = "A" | "B" | "C";

interface Evidence {
    id: EvidenceId;
    title: string;
    tag: string;
    content: string;
    isRedHerring?: boolean;
}

interface ChainSlot {
    label: "CAUSE" | "ENABLING DECISION" | "CONSEQUENCE";
    evidenceId: EvidenceId | null;
}

interface Chain {
    id: ChainId;
    slots: [ChainSlot, ChainSlot, ChainSlot];
    department: string | null;
    suspect: string | null;
    verified: boolean;
}

// ── Theme tokens (red/black like the Code Audit UI) ───────────────────────────
const T = {
    bg: "#0a0a0a",
    bgPanel: "#111111",
    bgDeep: "#0d0d0d",
    border: "#2a1010",
    borderMid: "#4a1a1a",
    borderHot: "#7a2020",
    red: "#cc3333",
    redBright: "#ff4444",
    redDim: "#7a2222",
    redFaint: "#3a1010",
    amber: "#cc7700",
    amberDim: "#6a3a00",
    white: "#e0d0d0",
    whiteDim: "#8a7a7a",
    whiteGhost: "#3a3030",
    green: "#22aa44",    // used only for "verified / correct"
    greenDim: "#0a3a1a",
    scan: "rgba(30,0,0,0.05)",
};

const EVIDENCE: Evidence[] = [
    {
        id: "autopsy_temp", title: "Autopsy Temperature Report", tag: "FORENSIC",
        content: "Body temperature at discovery: 32.4°C\nRoom temperature: 21°C\nEstimated time of death: ~20:47\nOfficial incident report time: 21:04\n\nConclusion: Body cooling indicates death occurred before the official timeline.\nPossible explanation: Delayed reporting or post-incident intervention."
    },
    {
        id: "neural_log", title: "Neural Activity Log", tag: "SYSTEM LOG",
        content: "21:02 Neural spike detected\n21:03 Sustained stimulation overload\n21:04 Subject collapse\n\nSystem Status: Limiter response unstable. Shutdown trigger requested.\n\nObservation: Neural stimulation exceeded safe operating threshold."
    },
    {
        id: "limiter_hw", title: "Limiter Hardware Revision (REV-B)", tag: "HARDWARE",
        content: "Component: Feedback Limiter Module\nExpected revision: REV-A\nInstalled module: REV-B\nSerial mismatch detected.\n\nInspection notes: Limiter board appears modified.\nShutdown response timing may be affected.", isRedHerring: true
    },
    {
        id: "fw_tolerance", title: "Firmware Limiter Tolerance Increase", tag: "FIRMWARE",
        content: "Module: Limiter Control\nConfiguration update: Tolerance threshold increased 1.0 → 1.3\nAuthor: lsuri_fw\n\nComment: Adjustment applied to reduce false spike detection during calibration."
    },
    {
        id: "override_approval", title: "Override Approval — a.m_arch", tag: "AUTHORIZATION",
        content: "Temporary safety override approved.\nAuthority: Architecture Division\nAccount: a.m_arch\n\nPurpose: Allow calibration sequence to complete without triggering shutdown protection."
    },
    {
        id: "shutdown_suppressed", title: "Shutdown Escalation Suppressed", tag: "SYSTEM EVENT",
        content: "Auto-shutdown escalation triggered.\nStatus: SUPPRESSED\nReason: Override state active\n\nNote: Shutdown cannot proceed while architecture override mode remains enabled."
    },
    {
        id: "limiter_instability", title: "Limiter Instability Detected", tag: "DIAGNOSTIC",
        content: "Spike amplitude exceeded limiter threshold.\nLimiter response delayed.\nOutput channel continued stimulation for several seconds beyond safe limit.\n\nRisk Level: CRITICAL"
    },
    {
        id: "export_log", title: "Export Log — nb_v4_backup.zip", tag: "TRANSFER",
        content: "File exported: nb_v4_backup.zip\nSource: wrk04\nTransfer path: wrk04 → nas02 → usb07 → external host\nExport authorization: a.m_arch", isRedHerring: true
    },
    {
        id: "arch_risk_memo", title: "Architecture Risk Memo", tag: "MEMO",
        content: "System stability depends on manual monitoring during test mode.\nTemporary overrides permitted for calibration and tuning.\n\nReminder: Overrides must be removed before production deployment.", isRedHerring: true
    },
    {
        id: "security_access", title: "Security Access Log", tag: "ACCESS",
        content: "User: vk_sec\nAccess time: 21:05\nSystem accessed: Incident reporting console\nAction performed: Log inspection and system review."
    },
    {
        id: "incident_timestamp", title: "Incident Reporting Timestamp", tag: "OFFICIAL",
        content: "Reported time of collapse: 21:04\nReported by: Security Operations\n\nNote: Incident timeline recorded after system shutdown attempt."
    },
    {
        id: "ghost_patch", title: "Ghost Patch Reference", tag: "PATCH",
        content: "Patch ID: prod_hotfix_ghost41\nChanges:\n• extended spike tolerance window\n• delayed shutdown escalation\nAuthor tag: ghost41\nDeployment mode: temporary override"
    },
    {
        id: "maintenance_log", title: "Maintenance Log Entry", tag: "MAINTENANCE",
        content: "Routine inspection completed. Components cleaned and reseated. No faults reported.\n\nEngineer signature: Rishab Patel", isRedHerring: true
    },
    {
        id: "calibration_notes", title: "Device Calibration Notes", tag: "CALIBRATION",
        content: "Neural output calibration successful. Minor limiter drift observed but remained within tolerance.\n\nTest environment stable.", isRedHerring: true
    },
    {
        id: "thermal_sensor", title: "Thermal Sensor Calibration", tag: "SENSOR",
        content: "Room sensors recalibrated earlier in the day. Temperature readings confirmed accurate.", isRedHerring: true
    },
    {
        id: "ghostid_trace", title: "GhostID Trace Fragment", tag: "TRACE",
        content: "Reference detected: ghost41\nPatch activity linked to temporary override deployment.\nOrigin of patch remains unidentified.\n\nFlag: Unverified system modification.", isRedHerring: true
    },
];

const CORRECT: Record<ChainId, { slots: [EvidenceId, EvidenceId, EvidenceId]; dept: string; suspect: string }> = {
    A: { slots: ["override_approval", "shutdown_suppressed", "neural_log"], dept: "Architecture Division", suspect: "Dr Aarya Mehta" },
    B: { slots: ["fw_tolerance", "limiter_instability", "ghost_patch"], dept: "Firmware Engineering", suspect: "Leena Suri" },
    C: { slots: ["autopsy_temp", "security_access", "incident_timestamp"], dept: "Security Operations", suspect: "Vikrant Kaul" },
};

const DEPTS = ["Architecture Division", "Firmware Engineering", "Security Operations", "Research Team", "Operations"];
const SUSPECTS = ["Dr Aarya Mehta", "Leena Suri", "Vikrant Kaul", "Kavya Sharma", "GURU JI", "Rajveer Malhotra", "Arjun Nanda"];
const SLOT_LABELS: Array<"CAUSE" | "ENABLING DECISION" | "CONSEQUENCE"> = ["CAUSE", "ENABLING DECISION", "CONSEQUENCE"];
const HINTS = [
    "Review events where safety overrides were requested and approved.",
    "Track which account authorized the override — it appears in multiple logs.",
    "Architecture approved override → shutdown suppressed. Firmware raised limiter tolerance → spike amplified. Security accessed logs post-collapse.",
];

function makeChains(): Chain[] {
    return (["A", "B", "C"] as ChainId[]).map(id => ({
        id, department: null, suspect: null, verified: false,
        slots: SLOT_LABELS.map(label => ({ label, evidenceId: null })) as [ChainSlot, ChainSlot, ChainSlot],
    }));
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ ev, onClose }: { ev: Evidence; onClose: () => void }) {
    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: T.bgPanel, border: `1px solid ${T.borderHot}`, borderRadius: 4, padding: 28, maxWidth: 500, width: "90%", boxShadow: `0 0 40px ${T.redFaint}` }}>
                <div style={{ fontFamily: "monospace", fontSize: 8, color: T.redDim, letterSpacing: 2, marginBottom: 6 }}>EVIDENCE CARD — {ev.tag}</div>
                <div style={{ fontFamily: "monospace", fontSize: 13, color: T.white, marginBottom: 12, borderBottom: `1px solid ${T.border}`, paddingBottom: 8 }}>{ev.title}</div>
                <pre style={{ fontFamily: "monospace", fontSize: 11, color: T.whiteDim, whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.8 }}>{ev.content}</pre>
                {ev.isRedHerring && <div style={{ marginTop: 10, fontSize: 8, color: T.amberDim, letterSpacing: 1 }}>⚠ UNCLASSIFIED — relevance unconfirmed</div>}
                <button onClick={onClose} style={{ marginTop: 16, background: "transparent", border: `1px solid ${T.borderMid}`, color: T.redDim, fontFamily: "monospace", fontSize: 11, padding: "6px 16px", cursor: "pointer", letterSpacing: 1 }}>[ CLOSE ]</button>
            </div>
        </div>
    );
}

// ── Drop Slot ─────────────────────────────────────────────────────────────────
function Slot({ slot, verified, validated, correct, onDrop, onClear, onInspect }:
    { slot: ChainSlot; verified: boolean; validated: boolean; correct: boolean; onDrop: (id: EvidenceId) => void; onClear: () => void; onInspect: (ev: Evidence) => void }) {
    const [over, setOver] = useState(false);
    const ev = slot.evidenceId ? EVIDENCE.find(e => e.id === slot.evidenceId) : null;
    const bc = verified ? T.green : validated && slot.evidenceId ? (correct ? T.green : T.red) : over ? T.borderHot : T.border;
    return (
        <div onDragOver={e => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
            onDrop={e => { e.preventDefault(); setOver(false); const id = e.dataTransfer.getData("evidenceId"); if (id) onDrop(id); }}
            style={{ flex: 1, minHeight: 80, border: `1px dashed ${bc}`, borderRadius: 3, padding: 8, background: over ? T.redFaint : "transparent", transition: "all .15s", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontFamily: "monospace", fontSize: 7, color: T.redDim, letterSpacing: 1.5 }}>{slot.label}</div>
            {ev ? (
                <>
                    <div onClick={() => onInspect(ev)} style={{ fontFamily: "monospace", fontSize: 10, color: T.white, cursor: "pointer", lineHeight: 1.4, flex: 1 }}>{ev.title}</div>
                    {!verified && <button onClick={onClear} style={{ background: "transparent", border: "none", color: T.whiteGhost, fontSize: 8, fontFamily: "monospace", cursor: "pointer", padding: 0, textAlign: "left" }}>✕ clear</button>}
                </>
            ) : (
                <div style={{ fontFamily: "monospace", fontSize: 9, color: T.whiteGhost, fontStyle: "italic", flex: 1 }}>drop here</div>
            )}
        </div>
    );
}

// ── Final Questions ───────────────────────────────────────────────────────────
function FinalQs({ onDone }: { onDone: (pts: number) => void }) {
    const [a1, setA1] = useState(""); const [a2, setA2] = useState(""); const [a3, setA3] = useState("");
    const [res, setRes] = useState<{ r1: boolean; r2: boolean; pts3: number } | null>(null);
    const submit = () => {
        const r1 = a1.toLowerCase().includes("neural overload") || (a1.toLowerCase().includes("neural") && a1.toLowerCase().includes("overload"));
        const r2 = a2.toLowerCase().includes("a.m_arch") || (a2.toLowerCase().includes("architecture") && a2.toLowerCase().includes("override"));
        const l = a3.toLowerCase();
        const h = [l.includes("architecture") || l.includes("override"), l.includes("firmware") || l.includes("limiter"), l.includes("security") || l.includes("reporting") || l.includes("delay")].filter(Boolean).length;
        const pts3 = h === 3 ? 40 : h === 2 ? 28 : h === 1 ? 12 : 0;
        const r = { r1, r2, pts3 }; setRes(r); onDone((r1 ? 30 : 0) + (r2 ? 30 : 0) + pts3);
    };
    const inp = (ok?: boolean): React.CSSProperties => ({ width: "100%", background: T.bgDeep, border: `1px solid ${res ? (ok ? T.green : T.red) : T.border}`, borderRadius: 3, padding: "7px 10px", fontFamily: "monospace", fontSize: 11, color: T.white, outline: "none", boxSizing: "border-box" });
    return (
        <div style={{ border: `1px solid ${T.borderMid}`, borderRadius: 4, padding: 20, background: T.bgDeep, marginTop: 18 }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: T.red, letterSpacing: 2, marginBottom: 14, borderBottom: `1px solid ${T.border}`, paddingBottom: 8 }}>── FINAL ANALYSIS QUESTIONS ─────────────────────</div>
            {[
                { n: "Q1", pts: 30, q: "What technical condition directly caused Rishab's death?", v: a1, sv: setA1, ok: res?.r1, ans: "Neural overload" },
                { n: "Q2", pts: 30, q: "Which system decision prevented automatic shutdown during the neural spike escalation?", v: a2, sv: setA2, ok: res?.r2, ans: "Architecture override approval (a.m_arch)" },
            ].map(f => (
                <div key={f.n} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 11, color: T.whiteDim }}>{f.n}. {f.q}</span>
                        <span style={{ fontFamily: "monospace", fontSize: 8, color: T.redDim }}>{f.pts} pts</span>
                    </div>
                    <input value={f.v} onChange={e => f.sv(e.target.value)} disabled={!!res} placeholder="Short text answer…" style={inp(f.ok)} />
                    {res && <div style={{ fontFamily: "monospace", fontSize: 8, color: f.ok ? T.green : T.red, marginTop: 2 }}>{f.ok ? `✓ +${f.pts} pts` : `✗ — ${f.ans}`}</div>}
                </div>
            ))}
            <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: T.whiteDim }}>Q3. Explain how three departments interfered with safety mechanisms. (≤150 chars)</span>
                    <span style={{ fontFamily: "monospace", fontSize: 8, color: T.redDim }}>40 pts</span>
                </div>
                <textarea value={a3} onChange={e => { if (e.target.value.length <= 150) setA3(e.target.value) }} disabled={!!res} rows={3} placeholder="Architecture… Firmware… Security…"
                    style={{ ...inp(res ? res.pts3 >= 30 : undefined), resize: "none" }} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 8, color: T.whiteGhost }}>{a3.length}/150</span>
                    {res && <span style={{ fontFamily: "monospace", fontSize: 8, color: res.pts3 >= 30 ? T.green : T.amber }}>{res.pts3 > 0 ? `+${res.pts3} pts` : "✗ Insufficient reasoning"}</span>}
                </div>
            </div>
            {!res ? (
                <button onClick={submit} disabled={!a1.trim() || !a2.trim() || !a3.trim()}
                    style={{ background: "transparent", border: `1px solid ${a1 && a2 && a3 ? T.borderHot : T.border}`, color: a1 && a2 && a3 ? T.red : T.whiteGhost, fontFamily: "monospace", fontSize: 11, padding: "8px 22px", cursor: a1 && a2 && a3 ? "pointer" : "not-allowed", letterSpacing: 1, opacity: a1 && a2 && a3 ? 1 : .4 }}>
                    [ SUBMIT ANALYSIS ]
                </button>
            ) : (
                <div style={{ fontFamily: "monospace", fontSize: 10, color: T.green, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
                    ANALYSIS SUBMITTED — {(res.r1 ? 30 : 0) + (res.r2 ? 30 : 0) + res.pts3} pts from final questions
                </div>
            )}
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function Task6() {
    const [chains, setChains] = useState<Chain[]>(makeChains());
    const [modalEv, setModalEv] = useState<Evidence | null>(null);
    const [validated, setValidated] = useState(false);
    const [allOk, setAllOk] = useState(false);
    const [hintUsed, setHintUsed] = useState(0);
    const [hintText, setHintText] = useState("");
    const [score, setScore] = useState(0);
    const [phase, setPhase] = useState<"chains" | "questions" | "done">("chains");

    const drop = useCallback((ci: number, si: number, id: EvidenceId) => {
        setChains(p => p.map((c, cI) => cI !== ci ? c : { ...c, slots: c.slots.map((s, sI) => sI !== si ? s : { ...s, evidenceId: id }) as [ChainSlot, ChainSlot, ChainSlot] }));
    }, []);
    const clear = useCallback((ci: number, si: number) => {
        setChains(p => p.map((c, cI) => cI !== ci ? c : { ...c, slots: c.slots.map((s, sI) => sI !== si ? s : { ...s, evidenceId: null }) as [ChainSlot, ChainSlot, ChainSlot] }));
    }, []);

    const validate = () => {
        setValidated(true);
        const upd = chains.map(c => ({ ...c, verified: c.slots.every((s, i) => s.evidenceId === CORRECT[c.id].slots[i]) && c.department === CORRECT[c.id].dept && c.suspect === CORRECT[c.id].suspect }));
        setChains(upd);
        const ok = upd.every(c => c.verified);
        setAllOk(ok);
        if (ok) setScore(s => s + 200);
    };

    const useHint = () => {
        if (hintUsed >= 3) return;
        const cost = [10, 20, 35][hintUsed];
        setScore(s => s - cost); setHintText(HINTS[hintUsed]); setHintUsed(h => h + 1);
    };

    const ready = chains.every(c => c.slots.every(s => s.evidenceId) && c.department && c.suspect);

    return (
        <div style={{ minHeight: "100vh", background: T.bg, color: T.whiteDim, fontFamily: "monospace" }}>
            <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:${T.bg}}
        ::-webkit-scrollbar-thumb{background:${T.borderMid};border-radius:3px}
        select option{background:${T.bgPanel};color:${T.whiteDim}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes pulse{0%,100%{opacity:.7}50%{opacity:1}}
        .fu{animation:fadeUp .3s ease both}
        .blink{animation:blink 1.1s step-start infinite}
        .pulse{animation:pulse 2s ease infinite}
        button:hover{opacity:.85!important}
      `}</style>

            {/* CRT scanlines */}
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, backgroundImage: `repeating-linear-gradient(transparent,transparent 2px,${T.scan} 2px,${T.scan} 4px)` }} />

            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0", position: "relative", zIndex: 2 }}>

                {/* ── Top bar (like "INTERNAL OPS CONSOLE // CASE #131") ── */}
                <div style={{ background: T.bgDeep, borderBottom: `1px solid ${T.border}`, padding: "8px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 9, color: T.redDim, letterSpacing: 3 }}>INTERNAL OPS CONSOLE // CASE #131</span>
                    <span style={{ color: T.border }}>|</span>
                    <span style={{ fontSize: 9, color: T.whiteGhost, letterSpacing: 1 }}>NEUROBAND INVESTIGATION — ROUND 2</span>
                    <div style={{ marginLeft: "auto", fontSize: 9, color: T.redDim }}>
                        SCORE: <span style={{ color: score >= 0 ? T.green : T.red }}>{score >= 0 ? "+" : ""}{score}</span> pts
                    </div>
                </div>

                {/* ── Breadcrumb + title ── */}
                <div style={{ padding: "14px 20px 0" }}>
                    <div style={{ fontSize: 9, color: T.redDim, letterSpacing: 1, marginBottom: 6 }}>
                        ▸ CASE #131 / TASK 6 / INCIDENT SYNTHESIS
                    </div>
                    <div style={{ fontSize: 22, color: T.white, letterSpacing: 3, fontWeight: "bold", marginBottom: 4 }}>
                        INCIDENT SYNTHESIS BOARD
                    </div>
                    <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap", marginBottom: 14, fontSize: 9, color: T.whiteGhost, letterSpacing: 1 }}>
                        <span>OBJECTIVE: <span style={{ color: T.white }}>Reconstruct three causal failure chains</span></span>
                        <span style={{ color: T.border }}>|</span>
                        <span>CLEARANCE: <span style={{ color: allOk ? T.green : T.amber }}>{allOk ? "COMPLETE" : "INCOMPLETE"}</span></span>
                        <span style={{ color: T.border }}>|</span>
                        <span>HINTS: <span style={{ color: T.whiteDim }}>{hintUsed}/3</span></span>
                    </div>
                    {/* Thin red rule */}
                    <div style={{ height: 1, background: `linear-gradient(to right, ${T.borderHot}, transparent)`, marginBottom: 16 }} />
                </div>

                {/* ── Main layout ── */}
                <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 0 }}>

                    {/* ── Left: Evidence Archive ── */}
                    <div style={{ borderRight: `1px solid ${T.border}`, padding: "0 14px 20px 20px" }}>
                        <div style={{ fontSize: 8, color: T.red, letterSpacing: 2, marginBottom: 8, paddingBottom: 5, borderBottom: `1px solid ${T.border}` }}>
                            ── EVIDENCE ARCHIVE
                        </div>
                        <div style={{ fontSize: 8, color: T.whiteGhost, marginBottom: 8 }}>Click to inspect · Drag to chain slots</div>

                        <div style={{ maxHeight: "52vh", overflowY: "auto", paddingRight: 4 }}>
                            {EVIDENCE.map(ev => (
                                <div key={ev.id} draggable onDragStart={e => e.dataTransfer.setData("evidenceId", ev.id)} onClick={() => setModalEv(ev)}
                                    style={{ cursor: "grab", background: T.bgPanel, border: `1px solid ${ev.isRedHerring ? T.amberDim : T.border}`, borderRadius: 3, padding: "5px 8px", marginBottom: 4, display: "flex", alignItems: "center", gap: 6, userSelect: "none", transition: "border-color .15s" }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = ev.isRedHerring ? T.amber : T.borderMid}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = ev.isRedHerring ? T.amberDim : T.border}>
                                    <span style={{ fontSize: 7, color: ev.isRedHerring ? T.amber : T.red, background: ev.isRedHerring ? "#1a1000" : T.redFaint, border: `1px solid ${ev.isRedHerring ? T.amberDim : T.borderMid}`, padding: "1px 4px", borderRadius: 2, letterSpacing: .8, whiteSpace: "nowrap" }}>
                                        {ev.tag}
                                    </span>
                                    <span style={{ fontFamily: "monospace", fontSize: 9, color: ev.isRedHerring ? T.amber : T.whiteDim, flex: 1, lineHeight: 1.3 }}>{ev.title}</span>
                                </div>
                            ))}
                        </div>

                        {/* Evidence Tags section (like the screenshot sidebar) */}
                        <div style={{ marginTop: 14, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
                            <div style={{ fontSize: 8, color: T.red, letterSpacing: 1.5, marginBottom: 6 }}>EVIDENCE TAGS</div>
                            {["autopsy_temp", "neural_log", "fw_tolerance", "override_approval", "shutdown_suppressed", "security_access"].map(id => {
                                const e = EVIDENCE.find(x => x.id === id)!;
                                return <div key={id} style={{ fontSize: 9, color: T.red, marginBottom: 3 }}>▸ <span style={{ color: T.whiteDim }}>{e.title}</span></div>;
                            })}
                        </div>

                        {/* GhostID notes */}
                        <div style={{ marginTop: 12, border: `1px solid ${T.border}`, borderRadius: 3, padding: 10, background: T.bgDeep }}>
                            <div style={{ fontSize: 8, color: T.red, letterSpacing: 1.5, marginBottom: 6 }}>GHOSTID_41 NOTES</div>
                            <div style={{ fontSize: 9, color: T.whiteDim, lineHeight: 1.6, marginBottom: 6 }}>"Read behavior, not comments."</div>
                            <div style={{ fontSize: 8, color: T.whiteGhost }}>Ask the right questions to proceed.</div>
                        </div>

                        {/* Hint System */}
                        <div style={{ marginTop: 12, border: `1px solid ${T.border}`, borderRadius: 3, padding: 10 }}>
                            <div style={{ fontSize: 8, color: T.red, letterSpacing: 1.5, marginBottom: 5 }}>HINT SYSTEM</div>
                            <div style={{ fontSize: 8, color: T.whiteGhost, marginBottom: 7 }}>Cost: −10 / −20 / −35 pts per use</div>
                            <button onClick={useHint} disabled={hintUsed >= 3}
                                style={{ width: "100%", background: "transparent", border: `1px solid ${hintUsed >= 3 ? T.border : T.borderMid}`, color: hintUsed >= 3 ? T.whiteGhost : T.red, fontFamily: "monospace", fontSize: 9, padding: "5px", cursor: hintUsed >= 3 ? "not-allowed" : "pointer", letterSpacing: 1 }}>
                                [ REQUEST HINT{hintUsed >= 3 ? " — EXHAUSTED" : ""} ]
                            </button>
                            {hintText && <div style={{ marginTop: 7, fontSize: 9, color: T.whiteDim, lineHeight: 1.6, borderTop: `1px solid ${T.border}`, paddingTop: 7 }} className="fu">{hintText}</div>}
                        </div>
                    </div>

                    {/* ── Right: Chain Builder ── */}
                    <div style={{ padding: "0 20px 20px 18px" }}>
                        <div style={{ fontSize: 8, color: T.red, letterSpacing: 2, marginBottom: 12, paddingBottom: 5, borderBottom: `1px solid ${T.border}` }}>
                            ── FAILURE CHAIN BUILDER — SOURCE COMPARISON: FULL CAUSAL RECONSTRUCTION
                        </div>

                        {chains.map((chain, ci) => {
                            const cor = CORRECT[chain.id];
                            const bCol = chain.verified ? T.green : validated && !chain.verified ? T.red : T.border;
                            return (
                                <div key={chain.id} className="fu" style={{ border: `1px solid ${bCol}`, borderRadius: 4, padding: 14, marginBottom: 16, background: T.bgPanel, transition: "all .4s", boxShadow: chain.verified ? `0 0 18px ${T.greenDim}` : validated && !chain.verified ? `0 0 12px ${T.redFaint}` : "none" }}>
                                    {/* Chain header */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                        <span style={{ fontSize: 12, color: chain.verified ? T.green : validated && !chain.verified ? T.red : T.white, letterSpacing: 1.5 }}>
                                            CHAIN {chain.id}
                                        </span>
                                        <span style={{ fontSize: 8, letterSpacing: 1, color: chain.verified ? T.green : validated && !chain.verified ? T.red : T.whiteGhost }}>
                                            {chain.verified ? "✓ CHAIN VERIFIED" : validated && !chain.verified ? "✗ INCORRECT — RETRY" : ""}
                                        </span>
                                    </div>

                                    {/* Three slots */}
                                    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                                        {chain.slots.map((slot, si) => (
                                            <Slot key={si} slot={slot} verified={chain.verified} validated={validated}
                                                correct={slot.evidenceId === cor.slots[si]}
                                                onDrop={id => drop(ci, si, id)} onClear={() => clear(ci, si)} onInspect={setModalEv} />
                                        ))}
                                    </div>

                                    <div style={{ fontSize: 7, color: T.whiteGhost, letterSpacing: 1, marginBottom: 10 }}>
                                        [ CAUSE ] ──────→ [ ENABLING DECISION ] ──────→ [ CONSEQUENCE ]
                                    </div>

                                    {/* Dept + Suspect row */}
                                    <div style={{ display: "flex", gap: 10 }}>
                                        {[
                                            { lbl: "RESPONSIBLE DEPARTMENT", val: chain.department, opts: DEPTS, set: (v: string) => setChains(p => p.map((c, i) => i === ci ? { ...c, department: v } : c)), cor2: chain.department === cor.dept },
                                            { lbl: "LINKED SUSPECT", val: chain.suspect, opts: SUSPECTS, set: (v: string) => setChains(p => p.map((c, i) => i === ci ? { ...c, suspect: v } : c)), cor2: chain.suspect === cor.suspect },
                                        ].map(f => (
                                            <div key={f.lbl} style={{ flex: 1 }}>
                                                <div style={{ fontSize: 7, color: T.redDim, letterSpacing: 1, marginBottom: 3 }}>{f.lbl}</div>
                                                <select value={f.val || ""} onChange={e => f.set(e.target.value)} disabled={chain.verified}
                                                    style={{ width: "100%", background: T.bgDeep, border: `1px solid ${validated ? (f.cor2 ? T.green : T.red) : T.border}`, color: T.whiteDim, fontFamily: "monospace", fontSize: 9, padding: "5px 7px", outline: "none", borderRadius: 3 }}>
                                                    <option value="">-- select --</option>
                                                    {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Validate button */}
                        {!allOk && (
                            <button onClick={validate} disabled={!ready}
                                style={{ background: "transparent", border: `1px solid ${ready ? T.borderHot : T.border}`, color: ready ? T.red : T.whiteGhost, fontFamily: "monospace", fontSize: 11, padding: "9px 26px", cursor: ready ? "pointer" : "not-allowed", letterSpacing: 1.5, marginBottom: 14, display: "block", opacity: ready ? 1 : .4, transition: "all .2s" }}>
                                [ VALIDATE CHAINS ]
                            </button>
                        )}

                        {/* Validation result */}
                        {validated && !allOk && (
                            <div className="fu" style={{ border: `1px solid ${T.borderMid}`, borderRadius: 3, padding: 10, marginBottom: 12, background: T.bgDeep }}>
                                <div style={{ fontSize: 7, color: T.red, letterSpacing: 1.5, marginBottom: 5 }}>VALIDATION RESULT</div>
                                {chains.map(c => (
                                    <div key={c.id} style={{ fontFamily: "monospace", fontSize: 9, color: c.verified ? T.green : T.red, marginBottom: 2 }}>
                                        CHAIN {c.id} {c.verified ? "✓ VERIFIED" : "✗ INCORRECT"}
                                    </div>
                                ))}
                                <div style={{ fontFamily: "monospace", fontSize: 8, color: T.amber, marginTop: 5 }}>
                                    INVALID CHAIN DETECTED — Re-check recovered fragments. No penalty for retrying.
                                </div>
                            </div>
                        )}

                        {/* All verified */}
                        {allOk && phase === "chains" && (
                            <div className="fu" style={{ border: `1px solid ${T.green}`, borderRadius: 4, padding: 18, background: T.bgDeep, marginBottom: 14, boxShadow: `0 0 24px ${T.greenDim}` }}>
                                <div style={{ fontSize: 11, color: T.green, letterSpacing: 2, marginBottom: 9 }}>SYSTEM FAILURE MODEL COMPLETE</div>
                                <div style={{ fontSize: 10, color: T.whiteDim, lineHeight: 1.9, marginBottom: 10 }}>
                                    Multiple operational decisions contributed to the NeuroBand incident.<br /><br />
                                    <span style={{ color: T.red }}>▸</span> Architecture Override — shutdown safeguard bypassed<br />
                                    <span style={{ color: T.red }}>▸</span> Firmware Instability — limiter tolerance elevated<br />
                                    <span style={{ color: T.red }}>▸</span> Security Manipulation — incident reporting delayed
                                </div>
                                <div style={{ fontSize: 8, color: T.border, marginBottom: 9 }}>─────────────────────────────────────────────────</div>
                                <div style={{ fontSize: 10, color: T.whiteDim, lineHeight: 1.9, marginBottom: 14 }}>
                                    CONFIRMED INVOLVEMENT<br /><br />
                                    Architecture Division → <span style={{ color: T.white }}>Dr Aarya Mehta</span><br />
                                    Firmware Engineering &nbsp;→ <span style={{ color: T.white }}>Leena Suri</span><br />
                                    Security Operations &nbsp;→ <span style={{ color: T.white }}>Vikrant Kaul</span>
                                </div>
                                <button onClick={() => setPhase("questions")}
                                    style={{ background: "transparent", border: `1px solid ${T.borderHot}`, color: T.red, fontFamily: "monospace", fontSize: 11, padding: "8px 22px", cursor: "pointer", letterSpacing: 1 }}>
                                    [ PROCEED TO FINAL QUESTIONS ]
                                </button>
                            </div>
                        )}

                        {phase === "questions" && allOk && (
                            <FinalQs onDone={pts => { setScore(s => s + pts); setPhase("done"); }} />
                        )}

                        {phase === "done" && (
                            <div className="fu" style={{ border: `1px solid ${T.borderMid}`, borderRadius: 4, padding: 18, background: T.bgDeep, marginTop: 16 }}>
                                <div style={{ fontSize: 10, color: T.green, letterSpacing: 1.5, marginBottom: 7 }}>INCIDENT SYNTHESIS COMPLETE</div>
                                <div style={{ fontSize: 10, color: T.whiteDim, lineHeight: 1.8, marginBottom: 12 }}>
                                    Key departments implicated: Architecture · Firmware · Security<br /><br />
                                    Prepare to question the individuals responsible during the interrogation round.
                                </div>
                                <div style={{ fontSize: 12, color: T.red, letterSpacing: 2, marginBottom: 8 }} className="blink">
                                    ▶ TASK 7 — INTERROGATION ROOM
                                </div>
                                <div style={{ fontSize: 10, color: T.whiteGhost }}>
                                    FINAL SCORE: <span style={{ color: score >= 0 ? T.green : T.red }}>{score >= 0 ? "+" : ""}{score} pts</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {modalEv && <Modal ev={modalEv} onClose={() => setModalEv(null)} />}
        </div>
    );
}
export default function Page() {
    return <Task6 />;
}