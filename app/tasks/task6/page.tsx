"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import ghostIdImage from "@/assets/ghost-id.jpeg";

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
  bg:        "#0a0a0a",
  bgPanel:   "#111111",
  bgDeep:    "#0d0d0d",
  border:    "#2a1010",
  borderMid: "#4a1a1a",
  borderHot: "#7a2020",
  red:       "#cc3333",
  redBright: "#ff4444",
  redDim:    "#7a2222",
  redFaint:  "#3a1010",
  amber:     "#cc7700",
  amberDim:  "#6a3a00",
  white:     "#e0d0d0",
  whiteDim:  "#8a7a7a",
  whiteGhost:"#3a3030",
  green:     "#22aa44",
  greenDim:  "#0a3a1a",
  scan:      "rgba(30,0,0,0.05)",
  cyan:      "#22cccc",
  cyanDim:   "#0a3a3a",
};

const EVIDENCE: Evidence[] = [
  { id:"autopsy_temp",       title:"Autopsy Temperature Report",         tag:"FORENSIC",
    content:"Body temperature at discovery: 32.4°C\nRoom temperature: 21°C\nEstimated time of death: ~20:47\nOfficial incident report time: 21:04\n\nConclusion: Body cooling indicates death occurred before the official timeline.\nPossible explanation: Delayed reporting or post-incident intervention." },
  { id:"neural_log",         title:"Neural Activity Log",                tag:"SYSTEM LOG",
    content:"21:02 Neural spike detected\n21:03 Sustained stimulation overload\n21:04 Subject collapse\n\nSystem Status: Limiter response unstable. Shutdown trigger requested.\n\nObservation: Neural stimulation exceeded safe operating threshold." },
  { id:"limiter_hw",         title:"Limiter Hardware Revision (REV-B)",  tag:"HARDWARE",
    content:"Component: Feedback Limiter Module\nExpected revision: REV-A\nInstalled module: REV-B\nSerial mismatch detected.\n\nInspection notes: Limiter board appears modified.\nShutdown response timing may be affected.", isRedHerring:true },
  { id:"fw_tolerance",       title:"Firmware Limiter Tolerance Increase",tag:"FIRMWARE",
    content:"Module: Limiter Control\nConfiguration update: Tolerance threshold increased 1.0 → 1.3\nAuthor: lsuri_fw\n\nComment: Adjustment applied to reduce false spike detection during calibration." },
  { id:"override_approval",  title:"Override Approval — a.m_arch",       tag:"AUTHORIZATION",
    content:"Temporary safety override approved.\nAuthority: Architecture Division\nAccount: a.m_arch\n\nPurpose: Allow calibration sequence to complete without triggering shutdown protection." },
  { id:"shutdown_suppressed",title:"Shutdown Escalation Suppressed",     tag:"SYSTEM EVENT",
    content:"Auto-shutdown escalation triggered.\nStatus: SUPPRESSED\nReason: Override state active\n\nNote: Shutdown cannot proceed while architecture override mode remains enabled." },
  { id:"limiter_instability",title:"Limiter Instability Detected",       tag:"DIAGNOSTIC",
    content:"Spike amplitude exceeded limiter threshold.\nLimiter response delayed.\nOutput channel continued stimulation for several seconds beyond safe limit.\n\nRisk Level: CRITICAL" },
  { id:"export_log",         title:"Export Log — nb_v4_backup.zip",      tag:"TRANSFER",
    content:"File exported: nb_v4_backup.zip\nSource: wrk04\nTransfer path: wrk04 → nas02 → usb07 → external host\nExport authorization: a.m_arch", isRedHerring:true },
  { id:"arch_risk_memo",     title:"Architecture Risk Memo",              tag:"MEMO",
    content:"System stability depends on manual monitoring during test mode.\nTemporary overrides permitted for calibration and tuning.\n\nReminder: Overrides must be removed before production deployment.", isRedHerring:true },
  { id:"security_access",    title:"Security Access Log",                tag:"ACCESS",
    content:"User: vk_sec\nAccess time: 21:05\nSystem accessed: Incident reporting console\nAction performed: Log inspection and system review." },
  { id:"incident_timestamp", title:"Incident Reporting Timestamp",       tag:"OFFICIAL",
    content:"Reported time of collapse: 21:04\nReported by: Security Operations\n\nNote: Incident timeline recorded after system shutdown attempt." },
  { id:"ghost_patch",        title:"Ghost Patch Reference",              tag:"PATCH",
    content:"Patch ID: prod_hotfix_ghost41\nChanges:\n• extended spike tolerance window\n• delayed shutdown escalation\nAuthor tag: ghost41\nDeployment mode: temporary override" },
  { id:"maintenance_log",    title:"Maintenance Log Entry",              tag:"MAINTENANCE",
    content:"Routine inspection completed. Components cleaned and reseated. No faults reported.\n\nEngineer signature: Rishab Patel", isRedHerring:true },
  { id:"calibration_notes",  title:"Device Calibration Notes",           tag:"CALIBRATION",
    content:"Neural output calibration successful. Minor limiter drift observed but remained within tolerance.\n\nTest environment stable.", isRedHerring:true },
  { id:"thermal_sensor",     title:"Thermal Sensor Calibration",         tag:"SENSOR",
    content:"Room sensors recalibrated earlier in the day. Temperature readings confirmed accurate.", isRedHerring:true },
  { id:"ghostid_trace",      title:"GhostID Trace Fragment",             tag:"TRACE",
    content:"Reference detected: ghost41\nPatch activity linked to temporary override deployment.\nOrigin of patch remains unidentified.\n\nFlag: Unverified system modification.", isRedHerring:true },
];

const CORRECT: Record<ChainId,{slots:[EvidenceId,EvidenceId,EvidenceId];dept:string;suspect:string}> = {
  A:{ slots:["override_approval","shutdown_suppressed","neural_log"],      dept:"Architecture Division", suspect:"Dr Aarya Mehta" },
  B:{ slots:["fw_tolerance","limiter_instability","ghost_patch"],          dept:"Firmware Engineering",  suspect:"Leena Suri"    },
  C:{ slots:["autopsy_temp","security_access","incident_timestamp"],       dept:"Security Operations",   suspect:"Vikrant Kaul"  },
};

const DEPTS   = ["Architecture Division","Firmware Engineering","Security Operations","Research Team","Operations"];
const SUSPECTS= ["Dr Aarya Mehta","Leena Suri","Vikrant Kaul","Kavya Sharma","GURU JI","Rajveer Malhotra","Arjun Nanda"];
const SLOT_LABELS:Array<"CAUSE"|"ENABLING DECISION"|"CONSEQUENCE">=["CAUSE","ENABLING DECISION","CONSEQUENCE"];
const HINTS=[
  "Review events where safety overrides were requested and approved.",
  "Track which account authorized the override — it appears in multiple logs.",
  "Architecture approved override → shutdown suppressed. Firmware raised limiter tolerance → spike amplified. Security accessed logs post-collapse.",
];

// Tag icons mapping
const TAG_ICONS: Record<string, string> = {
  "FORENSIC": "🔬",
  "SYSTEM LOG": "📋",
  "HARDWARE": "🔧",
  "FIRMWARE": "⚙️",
  "AUTHORIZATION": "🔑",
  "SYSTEM EVENT": "⚡",
  "DIAGNOSTIC": "🩺",
  "TRANSFER": "📤",
  "MEMO": "📝",
  "ACCESS": "🔒",
  "OFFICIAL": "📜",
  "PATCH": "🧩",
  "MAINTENANCE": "🛠️",
  "CALIBRATION": "📐",
  "SENSOR": "📡",
  "TRACE": "👻",
};

function makeChains():Chain[]{
  return (["A","B","C"] as ChainId[]).map(id=>({
    id, department:null, suspect:null, verified:false,
    slots:SLOT_LABELS.map(label=>({label,evidenceId:null})) as [ChainSlot,ChainSlot,ChainSlot],
  }));
}

// ── Error Popup (replaces red marks) ──────────────────────────────────────────
function ErrorPopup({message,onClose}:{message:string;onClose:()=>void}){
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.bgPanel,border:`1px solid ${T.borderHot}`,borderRadius:6,padding:28,maxWidth:420,width:"90%",boxShadow:`0 0 60px ${T.redFaint}, 0 0 120px rgba(204,51,51,0.1)`,textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:12}}>⚠️</div>
        <div style={{fontFamily:"monospace",fontSize:9,color:T.redDim,letterSpacing:3,marginBottom:10}}>SYSTEM ALERT</div>
        <div style={{fontFamily:"monospace",fontSize:13,color:T.white,marginBottom:8,lineHeight:1.6}}>{message}</div>
        <div style={{fontFamily:"monospace",fontSize:10,color:T.whiteDim,marginBottom:18,lineHeight:1.6}}>
          Re-check your evidence placement, department assignments, and suspect links.
        </div>
        <button onClick={onClose} style={{background:T.redFaint,border:`1px solid ${T.borderHot}`,color:T.redBright,fontFamily:"monospace",fontSize:11,padding:"8px 28px",cursor:"pointer",letterSpacing:1.5,borderRadius:3,transition:"all .2s"}}>
          [ UNDERSTOOD ]
        </button>
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ev,onClose}:{ev:Evidence;onClose:()=>void}){
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.bgPanel,border:`1px solid ${T.borderHot}`,borderRadius:6,padding:28,maxWidth:520,width:"90%",boxShadow:`0 0 40px ${T.redFaint}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <span style={{fontSize:18}}>{TAG_ICONS[ev.tag] || "📄"}</span>
          <div style={{fontFamily:"monospace",fontSize:8,color:T.redDim,letterSpacing:2}}>EVIDENCE CARD — {ev.tag}</div>
        </div>
        <div style={{fontFamily:"monospace",fontSize:14,color:T.white,marginBottom:12,borderBottom:`1px solid ${T.border}`,paddingBottom:10,fontWeight:"bold"}}>{ev.title}</div>
        <pre style={{fontFamily:"monospace",fontSize:11,color:T.whiteDim,whiteSpace:"pre-wrap",margin:0,lineHeight:1.8}}>{ev.content}</pre>
        {ev.isRedHerring&&<div style={{marginTop:12,fontSize:9,color:T.amber,letterSpacing:1,display:"flex",alignItems:"center",gap:6}}>
          <span>⚠️</span> UNCLASSIFIED — relevance unconfirmed
        </div>}
        <button onClick={onClose} style={{marginTop:18,background:T.redFaint,border:`1px solid ${T.borderMid}`,color:T.red,fontFamily:"monospace",fontSize:11,padding:"7px 20px",cursor:"pointer",letterSpacing:1,borderRadius:3}}>[ CLOSE ]</button>
      </div>
    </div>
  );
}

// ── GhostID Panel ─────────────────────────────────────────────────────────────
function GhostIdPanel({ghostActive,onToggle}:{ghostActive:boolean;onToggle:()=>void}){
  return(
    <div style={{border:`1px solid ${ghostActive?T.cyan:T.border}`,borderRadius:4,padding:12,background:ghostActive?T.cyanDim:T.bgDeep,marginTop:12,transition:"all .3s"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <Image src={ghostIdImage} alt="GhostID" style={{width:40,height:40,borderRadius:4,border:`1px solid ${ghostActive?T.cyan:T.borderMid}`,objectFit:"cover"}} />
        <div>
          <div style={{fontSize:9,color:ghostActive?T.cyan:T.red,letterSpacing:2,fontFamily:"monospace",fontWeight:"bold"}}>GHOSTID_41</div>
          <div style={{fontSize:7,color:T.whiteGhost,letterSpacing:1,fontFamily:"monospace"}}>INTELLIGENCE MODULE</div>
        </div>
        <div style={{marginLeft:"auto",width:8,height:8,borderRadius:"50%",background:ghostActive?T.cyan:T.redDim,boxShadow:ghostActive?`0 0 8px ${T.cyan}`:"none"}} />
      </div>
      <div style={{fontSize:9,color:T.whiteDim,lineHeight:1.7,marginBottom:8,fontFamily:"monospace",fontStyle:"italic"}}>
        "Read behavior, not comments."
      </div>
      <div style={{fontSize:8,color:T.whiteGhost,lineHeight:1.6,fontFamily:"monospace",marginBottom:10}}>
        {ghostActive 
          ? "🟢 Ghost mode active — evidence tags highlighted. Look for connections between override approvals, firmware changes, and security actions."
          : "Ask the right questions to proceed. Activate Ghost mode for pattern hints."}
      </div>
      <button onClick={onToggle}
        style={{width:"100%",background:"transparent",border:`1px solid ${ghostActive?T.cyan:T.borderMid}`,color:ghostActive?T.cyan:T.redDim,fontFamily:"monospace",fontSize:9,padding:"6px",cursor:"pointer",letterSpacing:1,borderRadius:3,transition:"all .2s"}}>
        {ghostActive ? "[ DEACTIVATE GHOST MODE ]" : "[ ACTIVATE GHOST MODE ]"}
      </button>
    </div>
  );
}

// ── Drop Slot (NO red/green borders on wrong — just neutral) ──────────────────
function Slot({slot,verified,onDrop,onClear,onInspect,ghostActive}:
  {slot:ChainSlot;verified:boolean;onDrop:(id:EvidenceId)=>void;onClear:()=>void;onInspect:(ev:Evidence)=>void;ghostActive:boolean}){
  const [over,setOver]=useState(false);
  const ev=slot.evidenceId?EVIDENCE.find(e=>e.id===slot.evidenceId):null;
  // Only show green on verified, otherwise neutral border
  const bc=verified?T.green:over?T.borderHot:T.border;
  return(
    <div onDragOver={e=>{e.preventDefault();setOver(true)}} onDragLeave={()=>setOver(false)}
      onDrop={e=>{e.preventDefault();setOver(false);const id=e.dataTransfer.getData("evidenceId");if(id)onDrop(id);}}
      style={{flex:1,minHeight:90,border:`1px dashed ${bc}`,borderRadius:4,padding:10,background:over?T.redFaint:"transparent",transition:"all .15s",display:"flex",flexDirection:"column",gap:5}}>
      <div style={{fontFamily:"monospace",fontSize:8,color:T.redDim,letterSpacing:1.5,display:"flex",alignItems:"center",gap:4}}>
        <span>{slot.label==="CAUSE"?"🔴":slot.label==="ENABLING DECISION"?"🟡":"🔵"}</span>
        {slot.label}
      </div>
      {ev?(
        <>
          <div onClick={()=>onInspect(ev)} style={{fontFamily:"monospace",fontSize:10,color:ghostActive?T.cyan:T.white,cursor:"pointer",lineHeight:1.5,flex:1,display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:14}}>{TAG_ICONS[ev.tag]||"📄"}</span>
            {ev.title}
          </div>
          {!verified&&<button onClick={onClear} style={{background:"transparent",border:"none",color:T.whiteGhost,fontSize:9,fontFamily:"monospace",cursor:"pointer",padding:0,textAlign:"left",display:"flex",alignItems:"center",gap:3}}>
            ✕ clear
          </button>}
        </>
      ):(
        <div style={{fontFamily:"monospace",fontSize:9,color:T.whiteGhost,fontStyle:"italic",flex:1,display:"flex",alignItems:"center",gap:4}}>
          <span style={{fontSize:14,opacity:0.3}}>📥</span> drop evidence here
        </div>
      )}
    </div>
  );
}

// ── Final Questions ───────────────────────────────────────────────────────────
function FinalQs({onDone}:{onDone:(pts:number)=>void}){
  const [a1,setA1]=useState("");const [a2,setA2]=useState("");const [a3,setA3]=useState("");
  const [res,setRes]=useState<{r1:boolean;r2:boolean;pts3:number}|null>(null);
  const [showError,setShowError]=useState(false);
  const submit=()=>{
    const r1=a1.toLowerCase().includes("neural overload")||(a1.toLowerCase().includes("neural")&&a1.toLowerCase().includes("overload"));
    const r2=a2.toLowerCase().includes("a.m_arch")||(a2.toLowerCase().includes("architecture")&&a2.toLowerCase().includes("override"));
    const l=a3.toLowerCase();
    const h=[l.includes("architecture")||l.includes("override"),l.includes("firmware")||l.includes("limiter"),l.includes("security")||l.includes("reporting")||l.includes("delay")].filter(Boolean).length;
    const pts3=h===3?50:h===2?35:h===1?15:0;
    const total=(r1?40:0)+(r2?40:0)+pts3;
    if(total<50){
      setShowError(true);
      return;
    }
    const r={r1,r2,pts3};setRes(r);onDone((r1?40:0)+(r2?40:0)+pts3);
  };
  const inp=(ok?:boolean):React.CSSProperties=>({width:"100%",background:T.bgDeep,border:`1px solid ${res?(ok?T.green:T.amber):T.border}`,borderRadius:4,padding:"8px 12px",fontFamily:"monospace",fontSize:11,color:T.white,outline:"none",boxSizing:"border-box"});
  return(
    <div style={{border:`1px solid ${T.borderMid}`,borderRadius:6,padding:22,background:T.bgDeep,marginTop:18}}>
      {showError&&<ErrorPopup message="Some answers appear incorrect or incomplete. Review your analysis and try again." onClose={()=>setShowError(false)}/>}
      <div style={{fontFamily:"monospace",fontSize:9,color:T.red,letterSpacing:2,marginBottom:14,borderBottom:`1px solid ${T.border}`,paddingBottom:8,display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:14}}>📊</span> FINAL ANALYSIS QUESTIONS
      </div>
      {[
        {n:"Q1",pts:40,q:"What technical condition directly caused Rishab's death?",v:a1,sv:setA1,ok:res?.r1,ans:"Neural overload"},
        {n:"Q2",pts:40,q:"Which system decision prevented automatic shutdown during the neural spike escalation?",v:a2,sv:setA2,ok:res?.r2,ans:"Architecture override approval (a.m_arch)"},
      ].map(f=>(
        <div key={f.n} style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
            <span style={{fontFamily:"monospace",fontSize:11,color:T.whiteDim}}>{f.n}. {f.q}</span>
            <span style={{fontFamily:"monospace",fontSize:9,color:T.redDim,whiteSpace:"nowrap"}}>{f.pts} pts</span>
          </div>
          <input value={f.v} onChange={e=>f.sv(e.target.value)} disabled={!!res} placeholder="Short text answer…" style={inp(f.ok)}/>
          {res&&<div style={{fontFamily:"monospace",fontSize:9,color:f.ok?T.green:T.amber,marginTop:3,display:"flex",alignItems:"center",gap:4}}>
            {f.ok?<span>✅ +{f.pts} pts</span>:<span>💡 Hint: {f.ans}</span>}
          </div>}
        </div>
      ))}
      <div style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
          <span style={{fontFamily:"monospace",fontSize:11,color:T.whiteDim}}>Q3. Explain how three departments interfered with safety mechanisms. (≤150 chars)</span>
          <span style={{fontFamily:"monospace",fontSize:9,color:T.redDim,whiteSpace:"nowrap"}}>50 pts</span>
        </div>
        <textarea value={a3} onChange={e=>{if(e.target.value.length<=150)setA3(e.target.value)}} disabled={!!res} rows={3} placeholder="Architecture… Firmware… Security…"
          style={{...inp(res?res.pts3>=30:undefined),resize:"none"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
          <span style={{fontFamily:"monospace",fontSize:9,color:T.whiteGhost}}>{a3.length}/150</span>
          {res&&<span style={{fontFamily:"monospace",fontSize:9,color:res.pts3>=30?T.green:T.amber}}>{res.pts3>0?`+${res.pts3} pts`:"💡 Mention all three departments"}</span>}
        </div>
      </div>
      {!res?(
        <button onClick={submit} disabled={!a1.trim()||!a2.trim()||!a3.trim()}
          style={{background:a1&&a2&&a3?T.redFaint:"transparent",border:`1px solid ${a1&&a2&&a3?T.borderHot:T.border}`,color:a1&&a2&&a3?T.redBright:T.whiteGhost,fontFamily:"monospace",fontSize:11,padding:"9px 24px",cursor:a1&&a2&&a3?"pointer":"not-allowed",letterSpacing:1.5,opacity:a1&&a2&&a3?1:.4,borderRadius:3}}>
          [ SUBMIT ANALYSIS ]
        </button>
      ):(
        <div style={{fontFamily:"monospace",fontSize:11,color:T.green,borderTop:`1px solid ${T.border}`,paddingTop:10,display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:16}}>✅</span> ANALYSIS SUBMITTED — {(res.r1?40:0)+(res.r2?40:0)+res.pts3} pts earned
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function Task6(){
  const [chains,setChains]=useState<Chain[]>(makeChains());
  const [modalEv,setModalEv]=useState<Evidence|null>(null);
  const [allOk,setAllOk]=useState(false);
  const [hintUsed,setHintUsed]=useState(0);
  const [hintText,setHintText]=useState("");
  const [score,setScore]=useState(0);
  const [phase,setPhase]=useState<"chains"|"questions"|"done">("chains");
  const [ghostActive,setGhostActive]=useState(false);
  const [errorPopup,setErrorPopup]=useState<string|null>(null);
  const [attempts,setAttempts]=useState(0);

  // Any evidence can go in any chain
  const drop=useCallback((ci:number,si:number,id:EvidenceId)=>{
    setChains(p=>p.map((c,cI)=>cI!==ci?c:{...c,slots:c.slots.map((s,sI)=>sI!==si?s:{...s,evidenceId:id}) as [ChainSlot,ChainSlot,ChainSlot]}));
  },[]);
  const clear=useCallback((ci:number,si:number)=>{
    setChains(p=>p.map((c,cI)=>cI!==ci?c:{...c,slots:c.slots.map((s,sI)=>sI!==si?s:{...s,evidenceId:null}) as [ChainSlot,ChainSlot,ChainSlot]}));
  },[]);

  // Validate with popup instead of red marks
  const validate=()=>{
    setAttempts(a=>a+1);
    const upd=chains.map(c=>({...c,verified:c.slots.every((s,i)=>s.evidenceId===CORRECT[c.id].slots[i])&&c.department===CORRECT[c.id].dept&&c.suspect===CORRECT[c.id].suspect}));
    setChains(upd);
    const ok=upd.every(c=>c.verified);
    setAllOk(ok);
    if(ok){
      // Points: base 250, minus 15 per extra attempt
      const bonus=Math.max(0, 250 - (attempts * 15));
      setScore(s=>s+bonus);
    } else {
      const wrongCount=upd.filter(c=>!c.verified).length;
      setErrorPopup(`${wrongCount} chain${wrongCount>1?"s":""} could not be verified. Something doesn't match — re-examine your evidence placement, department, and suspect assignments.`);
      // Reset verified status so no red/green shows
      setChains(upd.map(c=>({...c,verified:false})));
    }
  };

  const useHint=()=>{
    if(hintUsed>=3)return;
    const cost=[15,25,40][hintUsed];
    setScore(s=>s-cost);setHintText(HINTS[hintUsed]);setHintUsed(h=>h+1);
  };

  const ready=chains.every(c=>c.slots.every(s=>s.evidenceId)&&c.department&&c.suspect);

  // Count placed evidence
  const placedIds=new Set(chains.flatMap(c=>c.slots.map(s=>s.evidenceId).filter(Boolean)));

  return(
    <div style={{minHeight:"100vh",background:T.bg,color:T.whiteDim,fontFamily:"monospace"}}>
      <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:${T.bg}}
        ::-webkit-scrollbar-thumb{background:${T.borderMid};border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:${T.borderHot}}
        select option{background:${T.bgPanel};color:${T.whiteDim}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes pulse{0%,100%{opacity:.7}50%{opacity:1}}
        @keyframes glitch{0%{transform:translate(0)}20%{transform:translate(-2px,1px)}40%{transform:translate(1px,-1px)}60%{transform:translate(-1px,2px)}80%{transform:translate(2px,-1px)}100%{transform:translate(0)}}
        .fu{animation:fadeUp .3s ease both}
        .blink{animation:blink 1.1s step-start infinite}
        .pulse{animation:pulse 2s ease infinite}
        .glitch:hover{animation:glitch .3s ease}
        button:hover{opacity:.85!important}
      `}</style>

        {/* CRT scanlines */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:1,backgroundImage:`repeating-linear-gradient(transparent,transparent 2px,${T.scan} 2px,${T.scan} 4px)`}}/>

      {errorPopup&&<ErrorPopup message={errorPopup} onClose={()=>setErrorPopup(null)}/>}
      {modalEv&&<Modal ev={modalEv} onClose={()=>setModalEv(null)}/>}

      <div style={{maxWidth:1200,margin:"0 auto",padding:"0",position:"relative",zIndex:2}}>

        {/* ── Top bar ── */}
        <div style={{background:T.bgDeep,borderBottom:`1px solid ${T.border}`,padding:"10px 20px",display:"flex",alignItems:"center",gap:12}}>
          <Image src={ghostIdImage} alt="Ghost" style={{width:24,height:24,borderRadius:3,opacity:0.7}} />
          <span style={{fontSize:9,color:T.redDim,letterSpacing:3}}>INTERNAL OPS CONSOLE // CASE #131</span>
          <span style={{color:T.border}}>|</span>
          <span style={{fontSize:9,color:T.whiteGhost,letterSpacing:1}}>NEUROBAND INVESTIGATION — ROUND 2</span>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:14}}>
            <span style={{fontSize:9,color:T.whiteGhost}}>ATTEMPTS: <span style={{color:T.whiteDim}}>{attempts}</span></span>
            <span style={{fontSize:9,color:T.redDim}}>
              SCORE: <span style={{color:score>=0?T.green:T.redBright,fontWeight:"bold",fontSize:11}}>{score>=0?"+":""}{score}</span> pts
            </span>
          </div>
        </div>

        {/* ── Breadcrumb + title ── */}
        <div style={{padding:"16px 20px 0"}}>
          <div style={{fontSize:9,color:T.redDim,letterSpacing:1,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
            <span>📁</span> CASE #131 / TASK 6 / INCIDENT SYNTHESIS
          </div>
          <div style={{fontSize:24,color:T.white,letterSpacing:3,fontWeight:"bold",marginBottom:6,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:28}}>🔗</span> INCIDENT SYNTHESIS BOARD
          </div>
          <div style={{display:"flex",gap:24,alignItems:"center",flexWrap:"wrap",marginBottom:14,fontSize:9,color:T.whiteGhost,letterSpacing:1}}>
            <span>🎯 OBJECTIVE: <span style={{color:T.white}}>Reconstruct three causal failure chains</span></span>
            <span style={{color:T.border}}>|</span>
            <span>{allOk?"✅":"⏳"} CLEARANCE: <span style={{color:allOk?T.green:T.amber}}>{allOk?"COMPLETE":"INCOMPLETE"}</span></span>
            <span style={{color:T.border}}>|</span>
            <span>💡 HINTS: <span style={{color:T.whiteDim}}>{hintUsed}/3</span></span>
            <span style={{color:T.border}}>|</span>
            <span>📦 PLACED: <span style={{color:T.whiteDim}}>{placedIds.size}/{EVIDENCE.length}</span></span>
          </div>
          <div style={{height:1,background:`linear-gradient(to right, ${T.borderHot}, ${T.border}, transparent)`,marginBottom:16}}/>
        </div>

        {/* ── Main layout ── */}
        <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:0}}>

          {/* ── Left: Evidence Archive ── */}
          <div style={{borderRight:`1px solid ${T.border}`,padding:"0 14px 20px 20px"}}>
            <div style={{fontSize:9,color:T.red,letterSpacing:2,marginBottom:10,paddingBottom:6,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:5}}>
              <span>🗂️</span> EVIDENCE ARCHIVE
            </div>
            <div style={{fontSize:8,color:T.whiteGhost,marginBottom:10,display:"flex",alignItems:"center",gap:4}}>
              <span>👆</span> Click to inspect · Drag to any chain slot
            </div>

            <div style={{maxHeight:"48vh",overflowY:"auto",paddingRight:4}}>
              {EVIDENCE.map(ev=>{
                const isPlaced=placedIds.has(ev.id);
                return(
                <div key={ev.id} draggable onDragStart={e=>e.dataTransfer.setData("evidenceId",ev.id)} onClick={()=>setModalEv(ev)}
                  style={{cursor:"grab",background:isPlaced?"rgba(34,170,68,0.05)":T.bgPanel,border:`1px solid ${isPlaced?T.greenDim:ev.isRedHerring?T.amberDim:ghostActive&&!ev.isRedHerring?T.cyanDim:T.border}`,borderRadius:4,padding:"7px 10px",marginBottom:5,display:"flex",alignItems:"center",gap:8,userSelect:"none",transition:"all .2s",opacity:isPlaced?0.6:1}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=ev.isRedHerring?T.amber:ghostActive?T.cyan:T.borderHot}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=isPlaced?T.greenDim:ev.isRedHerring?T.amberDim:ghostActive&&!ev.isRedHerring?T.cyanDim:T.border}>
                  <span style={{fontSize:16,flexShrink:0}}>{TAG_ICONS[ev.tag]||"📄"}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <span style={{fontSize:7,color:ev.isRedHerring?T.amber:ghostActive?T.cyan:T.red,background:ev.isRedHerring?"#1a1000":ghostActive?T.cyanDim:T.redFaint,border:`1px solid ${ev.isRedHerring?T.amberDim:ghostActive?T.cyanDim:T.borderMid}`,padding:"1px 5px",borderRadius:2,letterSpacing:.8,display:"inline-block",marginBottom:2}}>
                      {ev.tag}
                    </span>
                    <div style={{fontFamily:"monospace",fontSize:9,color:ev.isRedHerring?T.amber:ghostActive?T.cyan:T.whiteDim,lineHeight:1.4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ev.title}</div>
                  </div>
                  {isPlaced&&<span style={{fontSize:10,color:T.green,flexShrink:0}}>✓</span>}
                </div>
              );})}
            </div>

            {/* Evidence Tags section */}
            <div style={{marginTop:14,borderTop:`1px solid ${T.border}`,paddingTop:10}}>
              <div style={{fontSize:8,color:T.red,letterSpacing:1.5,marginBottom:6,display:"flex",alignItems:"center",gap:4}}>
                <span>🏷️</span> KEY EVIDENCE TAGS
              </div>
              {["autopsy_temp","neural_log","fw_tolerance","override_approval","shutdown_suppressed","security_access"].map(id=>{
                const e=EVIDENCE.find(x=>x.id===id)!;
                return <div key={id} style={{fontSize:9,color:T.red,marginBottom:4,display:"flex",alignItems:"center",gap:5}}>
                  <span style={{fontSize:12}}>{TAG_ICONS[e.tag]}</span>
                  <span style={{color:T.whiteDim}}>{e.title}</span>
                </div>;
              })}
            </div>

            {/* GhostID Panel */}
            <GhostIdPanel ghostActive={ghostActive} onToggle={()=>setGhostActive(g=>!g)} />

            {/* Hint System */}
            <div style={{marginTop:12,border:`1px solid ${T.border}`,borderRadius:4,padding:12}}>
              <div style={{fontSize:8,color:T.red,letterSpacing:1.5,marginBottom:6,display:"flex",alignItems:"center",gap:4}}>
                <span>💡</span> HINT SYSTEM
              </div>
              <div style={{fontSize:8,color:T.whiteGhost,marginBottom:8}}>Cost: −15 / −25 / −40 pts per use</div>
              <button onClick={useHint} disabled={hintUsed>=3}
                style={{width:"100%",background:hintUsed>=3?"transparent":T.redFaint,border:`1px solid ${hintUsed>=3?T.border:T.borderMid}`,color:hintUsed>=3?T.whiteGhost:T.red,fontFamily:"monospace",fontSize:9,padding:"6px",cursor:hintUsed>=3?"not-allowed":"pointer",letterSpacing:1,borderRadius:3}}>
                [ REQUEST HINT{hintUsed>=3?" — EXHAUSTED":""} ]
              </button>
              {hintText&&<div style={{marginTop:8,fontSize:9,color:T.whiteDim,lineHeight:1.7,borderTop:`1px solid ${T.border}`,paddingTop:8}} className="fu">{hintText}</div>}
            </div>
          </div>

          {/* ── Right: Chain Builder ── */}
          <div style={{padding:"0 20px 20px 18px"}}>
            <div style={{fontSize:9,color:T.red,letterSpacing:2,marginBottom:14,paddingBottom:6,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:5}}>
              <span>⛓️</span> FAILURE CHAIN BUILDER — FULL CAUSAL RECONSTRUCTION
            </div>

            {chains.map((chain,ci)=>{
              return(
                <div key={chain.id} className="fu" style={{border:`1px solid ${chain.verified?T.green:T.border}`,borderRadius:6,padding:16,marginBottom:18,background:T.bgPanel,transition:"all .4s",boxShadow:chain.verified?`0 0 20px ${T.greenDim}`:"none"}}>
                  {/* Chain header */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <span style={{fontSize:13,color:chain.verified?T.green:T.white,letterSpacing:2,display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:16}}>⛓️</span> CHAIN {chain.id}
                    </span>
                    {chain.verified&&<span style={{fontSize:9,letterSpacing:1,color:T.green,display:"flex",alignItems:"center",gap:4}}>
                      <span>✅</span> CHAIN VERIFIED
                    </span>}
                  </div>

                  {/* Three slots — any evidence can go anywhere */}
                  <div style={{display:"flex",gap:8,marginBottom:10}}>
                    {chain.slots.map((slot,si)=>(
                      <Slot key={si} slot={slot} verified={chain.verified} ghostActive={ghostActive}
                        onDrop={id=>drop(ci,si,id)} onClear={()=>clear(ci,si)} onInspect={setModalEv}/>
                    ))}
                  </div>

                  <div style={{fontSize:8,color:T.whiteGhost,letterSpacing:1,marginBottom:12,display:"flex",alignItems:"center",gap:4}}>
                    🔴 [ CAUSE ] ──→ 🟡 [ ENABLING DECISION ] ──→ 🔵 [ CONSEQUENCE ]
                  </div>

                  {/* Dept + Suspect row */}
                  <div style={{display:"flex",gap:12}}>
                    {[
                      {lbl:"🏢 RESPONSIBLE DEPARTMENT",val:chain.department,opts:DEPTS,   set:(v:string)=>setChains(p=>p.map((c,i)=>i===ci?{...c,department:v}:c))},
                      {lbl:"🧑‍💼 LINKED SUSPECT",         val:chain.suspect,   opts:SUSPECTS,set:(v:string)=>setChains(p=>p.map((c,i)=>i===ci?{...c,suspect:v}:c))},
                    ].map(f=>(
                      <div key={f.lbl} style={{flex:1}}>
                        <div style={{fontSize:8,color:T.redDim,letterSpacing:1,marginBottom:4}}>{f.lbl}</div>
                        <select value={f.val||""} onChange={e=>f.set(e.target.value)} disabled={chain.verified}
                          style={{width:"100%",background:T.bgDeep,border:`1px solid ${T.border}`,color:T.whiteDim,fontFamily:"monospace",fontSize:10,padding:"6px 8px",outline:"none",borderRadius:4}}>
                          <option value="">-- select --</option>
                          {f.opts.map(o=><option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Validate button */}
            {!allOk&&(
              <button onClick={validate} disabled={!ready}
                style={{background:ready?T.redFaint:"transparent",border:`1px solid ${ready?T.borderHot:T.border}`,color:ready?T.redBright:T.whiteGhost,fontFamily:"monospace",fontSize:12,padding:"10px 30px",cursor:ready?"pointer":"not-allowed",letterSpacing:2,marginBottom:14,display:"flex",alignItems:"center",gap:8,opacity:ready?1:.4,transition:"all .2s",borderRadius:4}}>
                <span style={{fontSize:16}}>🔍</span> [ VALIDATE CHAINS ]
              </button>
            )}

            {/* All verified */}
            {allOk&&phase==="chains"&&(
              <div className="fu" style={{border:`1px solid ${T.green}`,borderRadius:6,padding:20,background:T.bgDeep,marginBottom:14,boxShadow:`0 0 30px ${T.greenDim}`}}>
                <div style={{fontSize:12,color:T.green,letterSpacing:2,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:18}}>✅</span> SYSTEM FAILURE MODEL COMPLETE
                </div>
                <div style={{fontSize:10,color:T.whiteDim,lineHeight:1.9,marginBottom:12}}>
                  Multiple operational decisions contributed to the NeuroBand incident.<br/><br/>
                  <span style={{color:T.red}}>🔴</span> Architecture Override — shutdown safeguard bypassed<br/>
                  <span style={{color:T.red}}>🔴</span> Firmware Instability — limiter tolerance elevated<br/>
                  <span style={{color:T.red}}>🔴</span> Security Manipulation — incident reporting delayed
                </div>
                <div style={{fontSize:8,color:T.border,marginBottom:10}}>─────────────────────────────────────────────────</div>
                <div style={{fontSize:10,color:T.whiteDim,lineHeight:1.9,marginBottom:16}}>
                  CONFIRMED INVOLVEMENT<br/><br/>
                  🏢 Architecture Division → <span style={{color:T.white}}>Dr Aarya Mehta</span><br/>
                  🏢 Firmware Engineering &nbsp;→ <span style={{color:T.white}}>Leena Suri</span><br/>
                  🏢 Security Operations &nbsp;→ <span style={{color:T.white}}>Vikrant Kaul</span>
                </div>
                <button onClick={()=>setPhase("questions")}
                  style={{background:T.redFaint,border:`1px solid ${T.borderHot}`,color:T.redBright,fontFamily:"monospace",fontSize:11,padding:"9px 24px",cursor:"pointer",letterSpacing:1.5,borderRadius:4,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:14}}>📊</span> [ PROCEED TO FINAL QUESTIONS ]
                </button>
              </div>
            )}

            {phase==="questions"&&allOk&&(
              <FinalQs onDone={pts=>{setScore(s=>s+pts);setPhase("done");}}/>
            )}

            {phase==="done"&&(
              <div className="fu" style={{border:`1px solid ${T.borderMid}`,borderRadius:6,padding:20,background:T.bgDeep,marginTop:16}}>
                <div style={{fontSize:11,color:T.green,letterSpacing:2,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:16}}>🎯</span> INCIDENT SYNTHESIS COMPLETE
                </div>
                <div style={{fontSize:10,color:T.whiteDim,lineHeight:1.8,marginBottom:14}}>
                  Key departments implicated: Architecture · Firmware · Security<br/><br/>
                  Prepare to question the individuals responsible during the interrogation round.
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <Image src={ghostIdImage} alt="GhostID" style={{width:32,height:32,borderRadius:4,border:`1px solid ${T.cyan}`}} />
                  <div style={{fontSize:13,color:T.redBright,letterSpacing:2}} className="blink">
                    ▶ TASK 7 — INTERROGATION ROOM
                  </div>
                </div>
                <div style={{fontSize:11,color:T.whiteGhost}}>
                  🏆 FINAL SCORE: <span style={{color:score>=0?T.green:T.redBright,fontWeight:"bold",fontSize:14}}>{score>=0?"+":""}{score} pts</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return <Task6 />;
}
