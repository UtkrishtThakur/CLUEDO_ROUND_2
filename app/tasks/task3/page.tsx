'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ─── TYPES ───────────────────────────────────────────────
type FragType = "sys" | "acc";
interface Fragment { id: string; type: FragType; node: number }
type HintLevel = "weak" | "medium" | "strong"; // medium kept in type for HintState compat
interface HintState { weak: boolean; medium: boolean; strong: boolean }
type ToastType = "success" | "error" | "info" | "warn";
interface Toast { id: number; msg: string; type: ToastType }
type PuzzleId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

// ─── CONSTANTS ───────────────────────────────────────────
const FRAGMENTS: Fragment[] = [
  { id: "wrk04",         type: "sys", node: 0 },
  { id: "nas02",         type: "sys", node: 1 },
  { id: "usb07",         type: "sys", node: 2 },
  { id: "ext_host",      type: "sys", node: 3 },
  { id: "lsuri_fw",      type: "acc", node: 4 },
  { id: "a.m_arch",      type: "acc", node: 5 },
  { id: "vk_sec",        type: "acc", node: 6 },
  { id: "ghost_patch41", type: "acc", node: 7 },
];

const NODE_NAMES = [
  "DEV WORKSTATION","BUILD CONSOLE","ARTIFACT CACHE","STORAGE VAULT",
  "BACKUP ARRAY","DEVICE LOCKER","SECURITY MONITOR","EXTERNAL GATEWAY",
];

// ─── GAME INSTRUCTIONS (shown before puzzle starts) ───────
const GAME_INSTRUCTIONS: Record<number, { title: string; steps: string[]; tip: string }> = {
  0: {
    title: "SIGNAL ROUTING",
    steps: [
      "Click any pipe tile to rotate it 90° clockwise.",
      "Connect a continuous path from S (source) to X (exit) with no gaps.",
      "Press CHECK ROUTING when the path looks complete.",
    ],
    tip: "S only outputs to the right. X only accepts from the left. Work outward from both ends to meet in the middle.",
  },
  1: {
    title: "CRACK THE CODE",
    steps: [
      "Use the number pad to build a 4-digit guess — each digit can only appear once. Press SUBMIT to lock it in.",
      "Each guess gives two clues: ✓ (white) means the digit is correct AND in the right slot. ◉ (yellow) means the digit exists in the code but is in the wrong slot.",
      "Read the feedback row-by-row to eliminate wrong digits and pin down correct positions. You get 5 guesses — use them wisely.",
    ],
    tip: "First guess: pick 4 digits that are spread across the range, e.g. 1 4 7 9. This gives you the most information at once. Then use ✓ hits to lock slots, and ◉ hits to try that digit in a different position.",
  },
  2: {
    title: "MEMORY MATCH",
    steps: [
      "Click any face-down card to flip it and reveal its label.",
      "Flip a second card. If both belong to the same pair they lock green.",
      "Find all 8 pairs: WRK↔04, NAS↔02, USB↔07, EXT↔HOST, SYS↔LOG, NET↔KEY, PKT↔07A, SEC↔HEX.",
    ],
    tip: "No penalty for mismatches — flip freely to map card positions before committing to a pair.",
  },
  3: {
    title: "STROOP CHALLENGE",
    steps: [
      "A word will appear on screen in a colored ink — the word and its color will NOT match.",
      "Click the button that matches the INK COLOR of the word — not what the word says.",
      "Get 5 correct answers in a row to unlock the fragment.",
    ],
    tip: "Your brain automatically reads the word — resist it. Focus only on the color of the letters, not the meaning.",
  },
  4: {
    title: "SHREDDED DOCUMENT",
    steps: [
      "Click a document fragment in the pool to select it (it turns yellow).",
      "Click a numbered slot below to place it there. Repeat for all 6 lines.",
      "Press VERIFY DOCUMENT when all slots are filled.",
    ],
    tip: "Think formal classified document order: Classification → File → Origin → Authorization → Destination → Date.",
  },
  5: {
    title: "SYMBOL GROUP",
    steps: [
      "A reference table shows each symbol code and its full name — read it before sorting.",
      "Click an unassigned chip to move it into the correct category bucket. Click again inside a bucket to send it back.",
      "Press CONFIRM GROUPING when all 8 symbols are correctly placed.",
    ],
    tip: "Firmware handles system images, configs and patches. Security handles auth, signatures, keys and audit logs.",
  },
  6: {
    title: "SIMON SAYS",
    steps: [
      "Watch the colored buttons flash a sequence — one new button is added each round.",
      "When the status reads YOUR TURN, press the buttons in the exact same order.",
      "Complete all 4 rounds without a mistake to unlock the fragment.",
    ],
    tip: "A wrong press resets to round 1 — no score penalty. Say the colors aloud as they flash to build a memory hook.",
  },
  7: {
    title: "CODE ALIGNMENT",
    steps: [
      "Six shuffled Python script lines are shown. Drag a line and drop it onto another to swap positions.",
      "Arrange all lines into the correct script execution order.",
      "Press VERIFY ORDER when the sequence looks right.",
    ],
    tip: "Follow logical Python script flow: Import → create session → auth → execute_transfer → commit → close.",
  },
};

const HINT_COSTS: Record<HintLevel, number> = { weak: 5, medium: 10, strong: 10 };

const HINTS: Record<number, Partial<Record<HintLevel, string>>> = {
  // 0 — Dev Workstation: Signal Routing
  0: {
    weak:   "The path bends twice. First it goes straight DOWN through the center column, then turns LEFT across the middle row, then turns DOWN again on the left side, and finally goes RIGHT along the bottom row to EXIT.",
    strong: "Rotate these cells: (1,2)→┃  (2,2)→┘  (2,1)→━  (2,0)→┬  (3,0)→┃  (4,0)→└  (4,1)→━. Leave all other cells as they are.",
  },
  // 1 — Build Console: Crack the Code (dynamic hints injected by puzzle)
  1: {
    weak:   "Loading hint...",
    strong: "Loading hint...",
  },
  // 2 — Artifact Cache: Memory Match (auto-flip hints injected by puzzle)
  2: {
    weak:   "One matched pair is about to flip and lock itself. Watch carefully.",
    strong: "Two more matched pairs will flip and lock automatically. Pay attention.",
  },
  // 3 — Storage Vault: Stroop Challenge
  3: {
    weak:   "Your brain reads the word automatically — fight it. Look ONLY at the color of the letters, not what the word spells. Focus on the physical color you see.",
    strong: "Name the ink color out loud before clicking. Say 'the letters are painted in RED' not 'the word says GREEN'. Saying the color out loud breaks the word-reading reflex.",
  },
  // 4 — Backup Array: Shredded Document
  4: {
    weak:   "Two fragments give away their positions immediately: the one starting with CLASSIFICATION goes first, and the one starting with DATE goes last. Place those two anchors and the remaining four fall into a natural middle order.",
    strong: "Exact order top to bottom — 1: CLASSIFICATION: RESTRICTED · 2: FILE: nb_v4_backup.zip · 3: ORIGIN: wrk04 / lsuri_fw · 4: TRANSFER AUTH: a.m_arch · 5: DESTINATION: ext_host · 6: DATE: 2024-11-03",
  },
  // 5 — Device Locker: Symbol Group
  5: {
    weak:   "Split by prefix: FW_, CFG_, IMG_, PATCH_ all belong to FIRMWARE. SIG_, KEY_, AUTH_, AUDIT_ all belong to SECURITY. You don't even need the full names — just the first three letters of each code tell you the answer.",
    strong: "FIRMWARE: FW_CORE, CFG_BOOT, IMG_FLASH, PATCH_FW. SECURITY: SIG_HASH, KEY_CERT, AUTH_TOKEN, AUDIT_LOG. Click once to move a chip to FIRMWARE, click again to move it to SECURITY, click a third time to return it to the pool.",
  },
  // 6 — Security Monitor: Simon Says
  6: {
    weak:   "Label each button by position — Top-Left, Top-Right, Bottom-Left, Bottom-Right. Mouth the position name silently each time it flashes. You are memorizing locations, not colors.",
    strong: "Each new round adds exactly ONE button at the end. You already know the previous sequence — just watch the very last flash and add it. Build the chain: Round 1=1 button, Round 2=same+1, Round 3=same+1, and so on.",
  },
  // 7 — External Gateway: Code Alignment
  7: {
    weak:   "Three lines are obviously fixed by logic: the import must be line 1, the session.close() must be line 6, and session.auth() must come before session.execute_transfer(). Place those three anchors and only two positions remain ambiguous.",
    strong: "Line 1: import transfer_module as tm · Line 2: session = tm.Session(host=\"ext_host\", port=9091) · Line 3: session.auth(token=\"0x99F_AUT\") · Line 4: session.execute_transfer(payload=\"neuro_dump_v2\", dest=\"ghost_node_x\") · Line 5: session.commit(sign=False) · Line 6: session.close()",
  },
};

// ─── PIPE ROUTING ─────────────────────────────────────────
type Pipe = "━"|"┃"|"┐"|"└"|"┘"|"┌"|"┬"|"┴"|"┤"|"├"|"┼"|"S"|"X"|null;
const PIPE_CONN: Record<string, {l:number;r:number;u:number;d:number}> = {
  "━":{l:1,r:1,u:0,d:0},"┃":{l:0,r:0,u:1,d:1},
  "┐":{l:1,r:0,u:0,d:1},"└":{l:0,r:1,u:1,d:0},
  "┘":{l:1,r:0,u:1,d:0},"┌":{l:0,r:1,u:0,d:1},
  "┬":{l:1,r:1,u:0,d:1},"┴":{l:1,r:1,u:1,d:0},
  "┤":{l:1,r:0,u:1,d:1},"├":{l:0,r:1,u:1,d:1},
  "┼":{l:1,r:1,u:1,d:1},
  "S":{l:1,r:1,u:1,d:1},"X":{l:1,r:1,u:1,d:1},
};
const ROTATE_MAP: Record<string,string> = {
  "━":"┃","┃":"━","┐":"└","└":"┘","┘":"┌","┌":"┐",
  "┬":"┤","┤":"┴","┴":"├","├":"┬","┼":"┼",
};
const SR_INIT = (): Pipe[][] => [
  [null, "┃",  "S",  "┃",  null],
  ["┌",  "┐",  "━",  "┐",  "┘"],
  ["┴",  "┃",  "┌",  "┃",  "┐"],
  ["━",  "┐",  null, "┘",  "━"],
  ["┌",  "━",  "X",  "━",  "┘"],
];

const SHRED_LINES = [
  "CLASSIFICATION: RESTRICTED",
  "FILE: nb_v4_backup.zip",
  "ORIGIN: wrk04 / lsuri_fw",
  "TRANSFER AUTH: a.m_arch",
  "DESTINATION: ext_host",
  "DATE: 2024-11-03",
];
const SYM_CATS: Record<string,string[]> = {
  FIRMWARE: ["FW_CORE","CFG_BOOT","IMG_FLASH","PATCH_FW"],
  SECURITY: ["SIG_HASH","KEY_CERT","AUTH_TOKEN","AUDIT_LOG"],
};
const CODE_CORRECT = [
  'import transfer_module as tm',
  'session = tm.Session(host="ext_host", port=9091)',
  'session.auth(token="0x99F_AUT")',
  'session.execute_transfer(payload="neuro_dump_v2", dest="ghost_node_x")',
  'session.commit(sign=False)',
  'session.close()',
];
const SIMON_EMOJIS = ["🔴","🟢","🔵","🟡"];
const SIMON_COLORS = ["#ff3366","#ff3333","#cc2222","#ffcc00"];
const MEM_PAIRS: [string,string][] = [["WRK","04"],["NAS","02"],["USB","07"],["EXT","HOST"],["SYS","LOG"],["NET","KEY"],["PKT","07A"],["SEC","HEX"]];
const AP_DIRS = ["→","↓","←","↑"];

// Each line is now {cls, text, valCls?, val?} — if val is present, key+val render inline on same row
type FileLine = {cls:string;text:string;valCls?:string;val?:string};
const FILE_CONTENTS: Record<string,{name:string;lines:FileLine[];ghostid:string}> = {
  control_loop:{name:"control_loop.cfg",lines:[
    {cls:"comment",text:"# NeuroBand v4 Control Loop Configuration"},
    {cls:"key",text:"neural_output_mode",valCls:"val",val:"adaptive"},
    {cls:"key",text:"feedback_channel",valCls:"val",val:"active"},
    {cls:"key",text:"loop_gain",valCls:"val",val:"variable"},
    {cls:"key",text:"stimulation_profile",valCls:"val",val:"dynamic"},
    {cls:"key",text:"safety_override",valCls:"warn",val:"permitted"},
    {cls:"key",text:"control_latency_ms",valCls:"val",val:"12"},
    {cls:"key",text:"controller_revision",valCls:"val",val:"NB4_CTRL_A3"},
    {cls:"key",text:"firmware_channel",valCls:"val",val:"production"},
  ],ghostid:"The device can increase neural stimulation dynamically."},
  safety_limits:{name:"safety_limits.cfg",lines:[
    {cls:"comment",text:"# Safety Limits Configuration"},
    {cls:"key",text:"max_output_current",valCls:"danger",val:"42"},
    {cls:"key",text:"max_stimulation_duration",valCls:"val",val:"120s"},
    {cls:"key",text:"auto_shutdown_threshold",valCls:"warn",val:"dynamic"},
    {cls:"key",text:"shutdown_delay",valCls:"danger",val:"15s"},
    {cls:"key",text:"manual_override",valCls:"warn",val:"enabled"},
    {cls:"key",text:"override_clear_required",valCls:"danger",val:"false"},
    {cls:"key",text:"limit_profile",valCls:"warn",val:"clinical_test_mode"},
  ],ghostid:"Manual overrides can bypass automatic safety thresholds."},
  feedback_monitor:{name:"feedback_monitor.cfg",lines:[
    {cls:"comment",text:"# Neural Feedback Monitoring"},
    {cls:"key",text:"sensor_mode",valCls:"val",val:"continuous"},
    {cls:"key",text:"feedback_noise_filter",valCls:"danger",val:"disabled"},
    {cls:"key",text:"spike_detection",valCls:"warn",val:"passive"},
    {cls:"key",text:"feedback_sampling_rate",valCls:"val",val:"1000hz"},
    {cls:"key",text:"shutdown_trigger",valCls:"warn",val:"external"},
    {cls:"key",text:"warning_escalation",valCls:"danger",val:"delayed"},
  ],ghostid:"Neural spike detection relies on external shutdown triggers."},
  shutdown_logic:{name:"shutdown_logic.patch",lines:[
    {cls:"comment",text:"# Patch Reference"},
    {cls:"key",text:"patch_id",valCls:"warn",val:"prod_hotfix_ghost41"},
    {cls:"key",text:"author_tag",valCls:"danger",val:"ghost41"},
    {cls:"key",text:"changes",valCls:"danger",val:"- disable immediate shutdown"},
    {cls:"danger",text:"                       - extend spike tolerance window"},
    {cls:"danger",text:"                       - suppress warning escalation"},
    {cls:"key",text:"deployment_mode",valCls:"warn",val:"temporary_override"},
  ],ghostid:"Safety shutdown response time has been extended."},
  arch_notes:{name:"architecture_notes.txt",lines:[
    {cls:"comment",text:"# NeuroBand v4 Architecture Review Notes"},
    {cls:"text",text:""},
    {cls:"text",text:"Export requested for architecture inspection."},
    {cls:"text",text:""},
    {cls:"key",text:"Environment",valCls:"val",val:"wrk04 test workstation"},
    {cls:"key",text:"Approval",valCls:"warn",val:"a.m_arch"},
    {cls:"key",text:"export_time",valCls:"danger",val:"2024-11-03T21:03:44Z"},
    {cls:"key",text:"transfer_window",valCls:"danger",val:"21:00 — 21:15 UTC"},
    {cls:"key",text:"destination",valCls:"danger",val:"ext_host (unverified)"},
    {cls:"key",text:"file_size",valCls:"warn",val:"2.1 MB"},
    {cls:"text",text:""},
    {cls:"comment",text:"Reminder: Temporary override must be removed"},
    {cls:"comment",text:"before production deployment."},
    {cls:"comment",text:"Internal review only — DO NOT DISTRIBUTE."},
  ],ghostid:"Export occurred at 21:03 UTC. Transfer window: 21:00-21:15. Destination: ext_host (unverified external node)."},
};

// ─── CSS ─────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
:root{--bg:#110a0a;--bg2:#1a0d0d;--bg3:#241010;--green:#ff3333;--blue:#cc1a1a;--red:#ff6644;--yellow:#ff8800;--orange:#ff5500;--dim:#3a1818;--text:#e8c8c8;--text-dim:#7a4a4a;--border:#3a1818;--glow-g:0 0 8px #ff333366,0 0 20px #ff333322;--glow-b:0 0 8px #cc1a1a66,0 0 20px #cc1a1a22;--glow-r:0 0 8px #ff664466,0 0 20px #ff664422;--glow-y:0 0 8px #ff880066,0 0 20px #ff880022;--font-mono:'Share Tech Mono',monospace;--font-head:'Orbitron',monospace;}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--text);font-family:var(--font-mono);min-height:100vh;overflow-x:hidden}
@keyframes flicker{0%,100%{opacity:1}92%{opacity:1}93%{opacity:.97}94%{opacity:1}97%{opacity:.98}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes glitch{0%,95%,100%{transform:none;opacity:1}96%{transform:skewX(2deg);opacity:.9}97%{transform:skewX(-1deg)}98%{transform:none}}
@keyframes toast-in{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}
@keyframes contentFade{from{opacity:0}to{opacity:1}}
@keyframes bannerReveal{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
@keyframes instrIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.scanlines::before{content:'';position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.08) 2px,rgba(0,0,0,.08) 4px);pointer-events:none;z-index:9999}
.flicker{animation:flicker 8s infinite}
.blink{animation:blink 1s step-end infinite}
.glitch{animation:glitch 4s infinite}
.instr-in{animation:instrIn 0.3s ease}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--dim);border-radius:2px}
`;

// ─── HELPERS ─────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;
}
function pad2(n:number){return String(n).padStart(2,"0");}
function btnStyle(color:"green"|"red"|"blue"):React.CSSProperties{
  return{padding:"5px 14px",background:"transparent",fontFamily:"var(--font-head)",fontSize:"0.55rem",letterSpacing:3,cursor:"pointer",transition:"all 0.2s",borderRadius:3,border:`1px solid var(--${color})`,color:`var(--${color})`};
}

// ─── INSTRUCTIONS SCREEN ──────────────────────────────────
function InstructionsScreen({idx,onStart,hasStarted}:{idx:PuzzleId;onStart:()=>void;hasStarted:boolean}){
  const instr=GAME_INSTRUCTIONS[idx];
  const frag=FRAGMENTS[idx];
  return(
    <div className="instr-in">
      {/* Objective */}
      <div style={{padding:"10px 14px",border:"1px solid var(--blue)",borderRadius:3,background:"#1a0808",marginBottom:18}}>
        <div style={{fontSize:"0.5rem",letterSpacing:3,color:"var(--text-dim)",marginBottom:4}}>OBJECTIVE</div>
        <div style={{fontSize:"0.62rem",color:"var(--blue)",letterSpacing:1}}>
          Solve this node to unlock fragment:{" "}
          <span style={{color:"var(--green)",textShadow:"var(--glow-g)",fontWeight:"bold",letterSpacing:2}}>{frag.id}</span>
        </div>
      </div>

      {/* Steps */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:"0.5rem",letterSpacing:3,color:"var(--text-dim)",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
          <span style={{flex:1,height:1,background:"var(--dim)",display:"inline-block"}}/>
          HOW TO PLAY
          <span style={{flex:1,height:1,background:"var(--dim)",display:"inline-block"}}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {instr.steps.map((step,i)=>(
            <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{width:24,height:24,borderRadius:"50%",border:"1px solid var(--blue)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.55rem",color:"var(--blue)",flexShrink:0,fontFamily:"var(--font-head)"}}>{i+1}</div>
              <div style={{fontSize:"0.62rem",color:"var(--text)",lineHeight:1.75,letterSpacing:0.5,paddingTop:3}}>{step}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tip */}
      <div style={{padding:"10px 14px",border:"1px solid #6a3a1a",borderRadius:3,background:"#1a0800",marginBottom:20,display:"flex",gap:10,alignItems:"flex-start"}}>
        <span style={{fontSize:"0.58rem",color:"var(--yellow)",letterSpacing:2,whiteSpace:"nowrap",fontFamily:"var(--font-head)",flexShrink:0,textShadow:"var(--glow-y)"}}>⚡ TIP</span>
        <span style={{fontSize:"0.6rem",color:"#cc7755",lineHeight:1.7,letterSpacing:0.5}}>{instr.tip}</span>
      </div>

      {/* Score note */}
      <div style={{fontSize:"0.52rem",color:"var(--text-dim)",letterSpacing:1,marginBottom:18,lineHeight:1.8,padding:"8px 12px",border:"1px dashed var(--dim)",borderRadius:3}}>
        ℹ  Hints available inside the puzzle: −5 / −10 / −20 pts each  ·  Retries and wrong answers are always free
      </div>

      {/* CTA */}
      <button
        onClick={onStart}
        style={{width:"100%",padding:"11px 0",background:"transparent",border:"1px solid var(--green)",color:"var(--green)",fontFamily:"var(--font-head)",fontSize:"0.65rem",letterSpacing:5,cursor:"pointer",transition:"all 0.2s",borderRadius:3,textShadow:"var(--glow-g)"}}
        onMouseEnter={e=>(e.currentTarget.style.background="#1a0505")}
        onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
      >{hasStarted?"▶ CONTINUE INVESTIGATION":"▶ BEGIN INVESTIGATION"}</button>
    </div>
  );
}

// ─── PUZZLES ─────────────────────────────────────────────

function PuzzleSignalRouting({solved,onSolve,onToast}:{solved:boolean;onSolve:()=>void;onToast:(m:string,t:ToastType)=>void}){
  const [grid,setGrid]=useState<Pipe[][]>(SR_INIT);
  const rotate=(r:number,c:number)=>{setGrid(g=>{const ng=g.map(row=>[...row]);const v=ng[r][c];if(!v||v==="S"||v==="X") return ng;ng[r][c]=(ROTATE_MAP[v]??v) as Pipe;return ng;});};
  const check=()=>{
    const vis=Array.from({length:5},()=>new Array(5).fill(false));const q:[number,number][]=[[0,2]];vis[0][2]=true;
    const dirs=[{dr:0,dc:-1,to:"l",from:"r"},{dr:0,dc:1,to:"r",from:"l"},{dr:-1,dc:0,to:"u",from:"d"},{dr:1,dc:0,to:"d",from:"u"}];
    while(q.length){const [r,c]=q.shift()!;if(r===4&&c===2){onSolve();return;}const conn=PIPE_CONN[grid[r][c]!]??{l:0,r:0,u:0,d:0};for(const{dr,dc,to,from}of dirs){const nr=r+dr,nc=c+dc;if(nr<0||nr>=5||nc<0||nc>=5||vis[nr][nc]) continue;if(!conn[to as keyof typeof conn]) continue;const nconn=PIPE_CONN[grid[nr][nc]!]??{l:0,r:0,u:0,d:0};if(!nconn[from as keyof typeof nconn]) continue;vis[nr][nc]=true;q.push([nr,nc]);}}
    onToast("SIGNAL LOST — ROUTING INCOMPLETE","error");
  };
  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,56px)",gap:4,margin:"0 auto 12px",width:"fit-content"}}>
      {grid.map((row,r)=>row.map((v,c)=>{const can=v&&v!=="S"&&v!=="X";return(<div key={`${r}-${c}`} onClick={()=>can&&!solved&&rotate(r,c)} style={{width:56,height:56,background:v==="S"?"#1a0808":v==="X"?"#1a0010":v===null?"var(--bg3)":"var(--bg)",border:`1px solid ${v==="S"?"var(--blue)":v==="X"?"var(--yellow)":"var(--border)"}`,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",cursor:can&&!solved?"pointer":"default",fontSize:"1.3rem",userSelect:"none"}}>{v??""}</div>);}))}
    </div>
    <div style={{display:"flex",gap:8}}><button onClick={check} style={btnStyle("green")}>▶ CHECK ROUTING</button>{!solved&&<button onClick={()=>setGrid(SR_INIT())} style={btnStyle("red")}>↺ RESET</button>}</div>
  </div>);
}

function PuzzleTileFlip({solved,onSolve,onToast,hintState}:{solved:boolean;onSolve:()=>void;onToast:(m:string,t:ToastType)=>void;hintState?:HintState}){
  // CRACK THE CODE — guess a 4-digit code using number pad + clues
  // Each guess tells: ✓ correct digit + position, ◉ correct digit wrong position
  const SECRET=()=>{const d: number[]=[];while(d.length<4){const n=Math.floor(Math.random()*10);if(!d.includes(n))d.push(n);}return d;};
  const [secret]=useState<number[]>(SECRET);
  // Dynamic hints — reveal actual digits from the secret
  const shuffledSecret=useMemo(()=>[...secret].sort(()=>Math.random()-0.5),[secret]);
  const weakHintText=`One digit in the code is: ${shuffledSecret[0]}. It appears somewhere in the 4-digit sequence.`;
  const strongHintText=`Two more digits in the code are: ${shuffledSecret[1]} and ${shuffledSecret[2]}. You now know 3 of the 4 digits — figure out the 4th and their positions.`;
  // Override static HINTS with dynamic content
  if(hintState!==undefined){
    (HINTS[1] as Record<string,string>).weak=weakHintText;
    (HINTS[1] as Record<string,string>).strong=strongHintText;
  }
  const MAX_ATTEMPTS=5;
  const [guess,setGuess]=useState<number[]>([]);
  const [history,setHistory]=useState<{g:number[];exact:number;close:number}[]>([]);
  const [won,setWon]=useState(false);
  const [failed,setFailed]=useState(false);

  const reset=()=>{setGuess([]);setHistory([]);setFailed(false);};
  const addDigit=(n:number)=>{if(guess.length<4&&!guess.includes(n)&&!failed) setGuess(g=>[...g,n]);};
  const delDigit=()=>{if(!failed) setGuess(g=>g.slice(0,-1));};
  const submit=()=>{
    if(guess.length<4||failed) return;
    let exact=0,close=0;
    guess.forEach((d,i)=>{if(d===secret[i]) exact++;else if(secret.includes(d)) close++;});
    const h=[...history,{g:[...guess],exact,close}];
    setHistory(h);
    setGuess([]);
    if(exact===4){setWon(true);setTimeout(onSolve,500);}
    else if(h.length>=MAX_ATTEMPTS){setFailed(true);onToast("5 ATTEMPTS USED — NO MATCH","error");}
  };

  return(<div style={{fontFamily:"var(--font-mono)"}}>
    <div style={{fontSize:"0.52rem",color:"var(--text-dim)",letterSpacing:1,marginBottom:12,lineHeight:1.7}}>
      Build a <span style={{color:"var(--yellow)"}}>4-digit code</span> — no repeated digits. After each guess:{" "}
      <span style={{color:"var(--green)"}}>✓ = correct digit in the correct slot</span> &nbsp;·&nbsp;{" "}
      <span style={{color:"var(--yellow)"}}>◉ = correct digit in the wrong slot</span>. Use the clues to crack it in 5 tries.
    </div>

    {/* Current guess display */}
    <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:14}}>
      {[0,1,2,3].map(i=>(
        <div key={i} style={{
          width:44,height:44,borderRadius:4,
          border:`2px solid ${guess[i]!==undefined?"var(--green)":"var(--border)"}`,
          background:guess[i]!==undefined?"#1a0505":"var(--bg)",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontFamily:"var(--font-head)",fontSize:"1.2rem",
          color:guess[i]!==undefined?"#ffffff":"var(--text-dim)",
          textShadow:guess[i]!==undefined?"var(--glow-g)":"none",
        }}>{guess[i]!==undefined?guess[i]:"_"}</div>
      ))}
    </div>

    {/* Number pad */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,marginBottom:10}}>
      {[1,2,3,4,5,6,7,8,9,0].map(n=>{
        const used=guess.includes(n);
        return(
          <button key={n} onClick={()=>addDigit(n)} disabled={used||won||failed}
            style={{
              padding:"10px 0",
              background:used?"#1a0808":"var(--bg3)",
              border:`1px solid ${used?"var(--red)":"var(--border)"}`,
              color:used?"var(--red)":"var(--text)",
              fontFamily:"var(--font-head)",fontSize:"0.8rem",
              cursor:used||won||failed?"default":"pointer",borderRadius:3,
              transition:"all 0.15s",
              textDecoration:used?"line-through":"none",
              opacity:failed&&!used?0.4:1,
            }}>{n}</button>
        );
      })}
    </div>

    {/* Controls */}
    <div style={{display:"flex",gap:6,marginBottom:14}}>
      <button onClick={delDigit} disabled={failed} style={{flex:1,padding:"7px 0",background:"transparent",border:"1px solid var(--border)",color:"var(--text-dim)",fontFamily:"var(--font-head)",fontSize:"0.55rem",letterSpacing:2,cursor:failed?"default":"pointer",borderRadius:3,opacity:failed?0.4:1}}>⌫ DEL</button>
      <button onClick={submit} disabled={guess.length<4||won||failed}
        style={{flex:2,padding:"7px 0",background:guess.length===4&&!failed?"#1a0505":"transparent",border:`1px solid ${guess.length===4&&!failed?"var(--green)":"var(--dim)"}`,color:guess.length===4&&!failed?"var(--green)":"var(--text-dim)",fontFamily:"var(--font-head)",fontSize:"0.55rem",letterSpacing:2,cursor:guess.length<4||failed?"default":"pointer",borderRadius:3,transition:"all 0.2s",opacity:failed?0.4:1}}>
        ▶ SUBMIT ({MAX_ATTEMPTS-history.length} left)
      </button>
    </div>

    {/* Failed state */}
    {failed&&!won&&(
      <div style={{textAlign:"center",padding:"14px 12px",border:"1px solid var(--red)",borderRadius:3,background:"#1a0505",marginBottom:12}}>
        <div style={{fontFamily:"var(--font-head)",fontSize:"0.65rem",letterSpacing:4,color:"var(--red)",marginBottom:10}}>✕ ALL 5 ATTEMPTS USED</div>
        <button onClick={reset} style={{padding:"8px 24px",background:"transparent",border:"1px solid var(--yellow)",color:"var(--yellow)",fontFamily:"var(--font-head)",fontSize:"0.58rem",letterSpacing:3,cursor:"pointer",borderRadius:3,transition:"all 0.2s"}}
          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#1a1500";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="transparent";}}>
          ↺ TRY AGAIN
        </button>
      </div>
    )}

    {/* History */}
    <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:160,overflowY:"auto"}}>
      {history.slice().reverse().map((h,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"5px 10px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:3}}>
          <div style={{display:"flex",gap:5}}>
            {h.g.map((d,j)=>(
              <span key={j} style={{
                fontFamily:"var(--font-head)",fontSize:"0.7rem",
                color:d===secret[j]?"#ffffff":secret.includes(d)?"var(--yellow)":"var(--text-dim)",
                textShadow:d===secret[j]?"var(--glow-g)":secret.includes(d)?"var(--glow-y)":"none",
                width:18,textAlign:"center",
              }}>{d}</span>
            ))}
          </div>
          <div style={{flex:1,display:"flex",gap:12,justifyContent:"flex-end",fontSize:"0.6rem",fontFamily:"var(--font-head)"}}>
            <span style={{color:"#ffffff",textShadow:"var(--glow-g)"}}>✓ {h.exact}</span>
            <span style={{color:"var(--yellow)",textShadow:"var(--glow-y)"}}>◉ {h.close}</span>
          </div>
        </div>
      ))}
    </div>
    {won&&<div style={{textAlign:"center",padding:"12px",color:"var(--green)",fontFamily:"var(--font-head)",fontSize:"0.7rem",letterSpacing:4,textShadow:"var(--glow-g)",marginTop:10}}>✓ CODE CRACKED</div>}
  </div>);
}

function PuzzleMemoryMatch({solved,onSolve,hintState}:{solved:boolean;onSolve:()=>void;hintState?:HintState}){
  interface MC{pair:number;val:string}
  // 8 pairs = 16 cards total
  const TOTAL_PAIRS=MEM_PAIRS.length;
  const [cards]=useState<MC[]>(()=>{const c:MC[]=[];MEM_PAIRS.forEach(([a,b],i)=>{c.push({pair:i,val:a});c.push({pair:i,val:b});});return shuffle(c);});
  const [flipped,setFlipped]=useState<number[]>([]);
  const [matched,setMatched]=useState<Set<number>>(new Set());
  const [lock,setLock]=useState(false);

  // Helper: reveal N unmatched pairs using functional state update
  const revealPairs=(n:number)=>{
    setMatched(prev=>{
      const nm=new Set(prev);
      let revealed=0;
      for(let i=0;i<cards.length&&revealed<n;i++){
        if(nm.has(i)) continue;
        const partner=cards.findIndex((_,j)=>j!==i&&!nm.has(j)&&cards[j].pair===cards[i].pair);
        if(partner!==-1){nm.add(i);nm.add(partner);revealed++;}
      }
      if(nm.size===cards.length) setTimeout(onSolve,300);
      return nm;
    });
  };

  // Weak hint → flip 1 unmatched pair automatically
  useEffect(()=>{
    if(hintState?.weak) revealPairs(1);
  },[hintState?.weak]);

  // Strong hint → flip 2 more unmatched pairs automatically
  useEffect(()=>{
    if(hintState?.strong) revealPairs(2);
  },[hintState?.strong]);

  const flip=(i:number)=>{if(lock||flipped.includes(i)||matched.has(i)||solved) return;const nf=[...flipped,i];setFlipped(nf);if(nf.length===2){setLock(true);const[a,b]=nf;if(cards[a].pair===cards[b].pair){const nm=new Set(matched);nm.add(a);nm.add(b);setMatched(nm);setFlipped([]);setLock(false);if(nm.size===TOTAL_PAIRS*2) setTimeout(onSolve,300);}else{setTimeout(()=>{setFlipped([]);setLock(false);},900);}}};
  return(<div>
    <div style={{fontSize:"0.5rem",color:"var(--text-dim)",marginBottom:8,letterSpacing:1}}>{matched.size/2} / {TOTAL_PAIRS} pairs matched</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,72px)",gap:6,margin:"0 auto 12px",width:"fit-content"}}>
      {cards.map((c,i)=>{
        const f=flipped.includes(i);
        const m=matched.has(i);
        // Each matched pair gets a unique vivid color based on pair index
        const PAIR_COLORS=[
          {bg:"#001a2e",border:"#00aaff",text:"#00aaff",glow:"0 0 14px #00aaff66"},  // cyan
          {bg:"#1a0a2e",border:"#aa44ff",text:"#aa44ff",glow:"0 0 14px #aa44ff66"},  // purple
          {bg:"#002a10",border:"#00ff66",text:"#00ff66",glow:"0 0 14px #00ff6666"},  // green
          {bg:"#2a1a00",border:"#ffaa00",text:"#ffaa00",glow:"0 0 14px #ffaa0066"},  // amber
          {bg:"#2a0010",border:"#ff3388",text:"#ff3388",glow:"0 0 14px #ff338866"},  // pink
          {bg:"#001a2a",border:"#00ddcc",text:"#00ddcc",glow:"0 0 14px #00ddcc66"},  // teal
          {bg:"#1a1a00",border:"#dddd00",text:"#dddd00",glow:"0 0 14px #dddd0066"},  // yellow
          {bg:"#1a0a00",border:"#ff7700",text:"#ff7700",glow:"0 0 14px #ff770066"},  // orange
        ];
        const pc=m?PAIR_COLORS[cards[i].pair%PAIR_COLORS.length]:null;
        return(
          <div key={i} onClick={()=>flip(i)} style={{
            width:72,height:52,borderRadius:3,
            background:m?pc!.bg:f?"#1a1a0a":"var(--bg3)",
            border:`2px solid ${m?pc!.border:f?"var(--yellow)":"var(--border)"}`,
            display:"flex",alignItems:"center",justifyContent:"center",
            cursor:(m||solved)?"default":"pointer",
            fontSize:"0.58rem",letterSpacing:1,
            transition:"all 0.25s",
            color:m?pc!.text:f?"var(--yellow)":"transparent",
            boxShadow:m?pc!.glow:f?"0 0 8px #ffcc0044":"none",
            fontFamily:m?"var(--font-head)":"var(--font-mono)",
            transform:m?"scale(1.04)":"scale(1)",
          }}>
            {(f||m)?c.val:"?"}
          </div>
        );
      })}
    </div>
  </div>);
}

function PuzzleArrowPath({solved,onSolve,onToast}:{solved:boolean;onSolve:()=>void;onToast:(m:string,t:ToastType)=>void}){
  // STROOP EFFECT — select the COLOR of the text, not the word meaning
  const COLORS=["RED","GREEN","BLUE","YELLOW"];
  const COLOR_HEX:Record<string,string>={RED:"#ff3333",GREEN:"#22cc55",BLUE:"#3399ff",YELLOW:"#ffcc00"};
  const COLOR_BG:Record<string,string>={RED:"#2a0808",GREEN:"#0a2a10",BLUE:"#081a2a",YELLOW:"#2a1e00"};

  const makeRound=()=>{
    const word=COLORS[Math.floor(Math.random()*4)];
    let color=COLORS[Math.floor(Math.random()*4)];
    // Ensure word and color are different (makes it a real Stroop challenge)
    while(color===word) color=COLORS[Math.floor(Math.random()*4)];
    return{word,color};
  };

  const TOTAL_Q=5;
  const [round,setRound]=useState(()=>makeRound());
  const [feedback,setFeedback]=useState<""|"correct"|"wrong"|"timeup"|"failed">("");
  const [wrongPick,setWrongPick]=useState<string|null>(null);
  const [stroopScore,setStroopScore]=useState(0);   // correct answers so far
  const [qNum,setQNum]=useState(1);                  // current question number (1-5)
  const [timeLeft,setTimeLeft]=useState(2);

  const resetAll=()=>{setStroopScore(0);setQNum(1);setFeedback("");setWrongPick(null);setTimeLeft(2);setRound(makeRound());};

  // 2-second countdown timer per round
  useEffect(()=>{
    if(solved||feedback!=="") return;
    if(timeLeft<=0){
      // Time up counts as wrong
      const isLast=qNum>=TOTAL_Q;
      if(isLast){
        setFeedback("failed");
      } else {
        setFeedback("timeup");
        setTimeout(()=>{setFeedback("");setWrongPick(null);setTimeLeft(2);setQNum(n=>n+1);setRound(makeRound());},900);
      }
      return;
    }
    const t=setInterval(()=>setTimeLeft(p=>p-1),1000);
    return()=>clearInterval(t);
  },[timeLeft,feedback,solved]);

  useEffect(()=>{setTimeLeft(2);},[round]);

  const pick=(chosen:string)=>{
    if(feedback!==""||solved) return;
    const correct=chosen===round.color;
    const isLast=qNum>=TOTAL_Q;
    if(correct){
      const ns=stroopScore+1;
      setStroopScore(ns);
      setFeedback("correct");
      if(isLast){
        // Last question — only unlock if ALL 5 were correct
        if(ns>=TOTAL_Q){
          setTimeout(onSolve,700);
        } else {
          // Got last one right but missed earlier ones — fail
          setFeedback("failed");
          onToast(`${ns}/${TOTAL_Q} CORRECT — NEED ALL 5`,"error");
        }
      } else {
        setTimeout(()=>{setFeedback("");setWrongPick(null);setTimeLeft(2);setQNum(n=>n+1);setRound(makeRound());},700);
      }
    } else {
      setWrongPick(chosen);
      if(isLast){
        // Wrong on last question — fail state
        setFeedback("failed");
        onToast(`${stroopScore}/${TOTAL_Q} CORRECT — TRY AGAIN`,"error");
      } else {
        setFeedback("wrong");
        onToast("WRONG — pick the ink COLOR, not the word","error");
        setTimeout(()=>{setFeedback("");setWrongPick(null);setTimeLeft(2);setQNum(n=>n+1);setRound(makeRound());},1000);
      }
    }
  };

  return(<div>
    {/* Instructions */}
    <div style={{fontSize:"0.52rem",color:"var(--text-dim)",letterSpacing:1,marginBottom:16,lineHeight:1.7}}>
      Select the <span style={{color:"var(--yellow)",fontFamily:"var(--font-head)"}}>COLOR OF THE INK</span> — ignore what the word says.
    </div>

    {/* Failed screen */}
    {feedback==="failed"&&(
      <div style={{textAlign:"center",padding:"20px",border:"1px solid var(--red)",borderRadius:4,background:"#1a0505",marginBottom:14,animation:"contentFade 0.3s ease"}}>
        <div style={{fontFamily:"var(--font-head)",fontSize:"0.8rem",color:"var(--red)",letterSpacing:4,textShadow:"var(--glow-r)",marginBottom:8}}>✗ OUT OF 5 WRONG</div>
        <div style={{fontSize:"0.58rem",color:"var(--text-dim)",marginBottom:16,lineHeight:1.7}}>You answered {stroopScore} out of {TOTAL_Q} correctly. Try again to unlock the node.</div>
        <button onClick={resetAll} style={{padding:"8px 24px",background:"transparent",border:"1px solid var(--red)",color:"var(--red)",fontFamily:"var(--font-head)",fontSize:"0.55rem",letterSpacing:3,cursor:"pointer",borderRadius:3}}>↺ TRY AGAIN</button>
      </div>
    )}

    {/* Progress — Q number tracker */}
    {feedback!=="failed"&&<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
      <div style={{fontSize:"0.5rem",color:"var(--text-dim)",letterSpacing:2}}>QUESTION</div>
      <div style={{display:"flex",gap:4}}>
        {Array.from({length:TOTAL_Q},(_,i)=>(
          <div key={i} style={{width:18,height:18,borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.44rem",fontFamily:"var(--font-head)",
            background:i<stroopScore?"#1a0505":i===qNum-1?"var(--bg3)":"var(--bg)",
            border:`1px solid ${i<stroopScore?"var(--green)":i===qNum-1?"var(--yellow)":"var(--dim)"}`,
            color:i<stroopScore?"var(--green)":i===qNum-1?"var(--yellow)":"var(--text-dim)",
          }}>{i<stroopScore?"✓":i+1}</div>
        ))}
      </div>
      <div style={{fontSize:"0.52rem",color:"var(--yellow)",letterSpacing:1,marginLeft:4}}>{qNum}/{TOTAL_Q}</div>
    </div>}

    {feedback!=="failed"&&(<div><div style={{
      textAlign:"center",
      marginBottom:16,
      padding:"24px 20px 16px",
      background:"var(--bg)",
      border:`1px solid ${timeLeft<=1&&feedback===""?"var(--red)":"var(--border)"}`,
      borderRadius:4,
      position:"relative",
      transition:"border-color 0.3s",
    }}>
      {/* Timer bar at top */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"var(--dim)",borderRadius:"4px 4px 0 0",overflow:"hidden"}}>
        <div style={{
          height:"100%",
          width:`${(timeLeft/2)*100}%`,
          background:timeLeft<=1?"var(--red)":"var(--green)",
          transition:"width 1s linear, background 0.3s",
          boxShadow:timeLeft<=1?"0 0 8px var(--red)":"none",
        }}/>
      </div>
      {/* Timer countdown */}
      <div style={{
        position:"absolute",top:6,right:10,
        fontFamily:"var(--font-head)",
        fontSize:"0.65rem",
        color:timeLeft<=1?"var(--red)":"var(--text-dim)",
        letterSpacing:1,
        textShadow:timeLeft<=1?"var(--glow-r)":"none",
        transition:"color 0.3s",
      }}>{timeLeft}s</div>
      <div style={{
        fontFamily:"var(--font-head)",
        fontSize:"clamp(1.8rem,6vw,2.6rem)",
        fontWeight:900,
        color:COLOR_HEX[round.color],
        letterSpacing:8,
        textShadow:`0 0 20px ${COLOR_HEX[round.color]}66`,
        userSelect:"none",
      }}>{round.word}</div>
      <div style={{fontSize:"0.46rem",color:"var(--text-dim)",letterSpacing:3,marginTop:10}}>
        WHAT COLOR IS THE TEXT?
      </div>
    </div>

    {/* Feedback */}
    {feedback&&(
      <div style={{
        textAlign:"center",
        fontSize:"0.7rem",
        fontFamily:"var(--font-head)",
        letterSpacing:4,
        color:feedback==="correct"?"var(--green)":feedback==="timeup"?"var(--yellow)":"var(--red)",
        textShadow:feedback==="correct"?"var(--glow-g)":feedback==="timeup"?"var(--glow-y)":"var(--glow-r)",
        marginBottom:14,
        animation:"contentFade 0.2s ease",
      }}>
        {feedback==="correct"?"✓ CORRECT!":feedback==="timeup"?"⏱ TIME UP!":"✗ WRONG!"}
      </div>
    )}

    {/* Color option buttons */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
      {COLORS.map(c=>{
        const isCorrect=c===round.color;
        const isWrong=c===wrongPick;
        const showCorrect=feedback==="wrong"&&isCorrect;
        const showWrong=feedback==="wrong"&&isWrong;
        return(
          <button key={c} onClick={()=>pick(c)}
            style={{
              padding:"14px 8px",
              background:showCorrect?COLOR_HEX[c]:showWrong?"#2a0808":COLOR_BG[c],
              border:`2px solid ${showCorrect?"#ffffff":showWrong?"var(--red)":COLOR_HEX[c]}`,
              borderRadius:4,
              cursor:solved?"default":"pointer",
              fontFamily:"var(--font-head)",
              fontSize:"0.65rem",
              letterSpacing:4,
              color:COLOR_HEX[c],
              textShadow:`0 0 10px ${COLOR_HEX[c]}88`,
              transition:"all 0.15s",
              boxShadow:feedback===""?`0 0 12px ${COLOR_HEX[c]}22`:"none",
              transform:showCorrect?"scale(1.04)":"scale(1)",
            }}
            onMouseEnter={e=>{if(!feedback&&!solved){e.currentTarget.style.background=COLOR_HEX[c]+"22";e.currentTarget.style.boxShadow=`0 0 18px ${COLOR_HEX[c]}44`;}}}
            onMouseLeave={e=>{if(!feedback&&!solved){e.currentTarget.style.background=COLOR_BG[c];e.currentTarget.style.boxShadow=`0 0 12px ${COLOR_HEX[c]}22`;}}}
          >{c}</button>
        );
      })}
    </div></div>)}
  </div>);
}

function PuzzleShredDoc({solved,onSolve,onToast}:{solved:boolean;onSolve:()=>void;onToast:(m:string,t:ToastType)=>void}){
  const [shuffled]=useState(()=>shuffle(SHRED_LINES.map((t,i)=>({t,i}))));
  const [slots,setSlots]=useState<(number|null)[]>(new Array(6).fill(null));
  const [sel,setSel]=useState<number|null>(null);
  const place=(idx:number)=>{if(sel===null) return onToast("Select a piece first","info");setSlots(s=>{const n=[...s].map(v=>v===sel?null:v);n[idx]=sel;return n;});setSel(null);};
  const check=()=>{if(slots.every((v,i)=>v===i)) setTimeout(onSolve,300);else onToast("DOCUMENT ORDER INCORRECT — RETRY","error");};
  return(<div>
    <div style={{border:"1px solid var(--border)",borderRadius:3,padding:10,background:"var(--bg)",marginBottom:8,minHeight:80,display:"flex",gap:6,alignItems:"center",justifyContent:"center",flexWrap:"wrap"}}>
      {shuffled.map(({t,i})=>{const s=sel===i,u=slots.includes(i);return(<div key={i} onClick={()=>!solved&&!u&&setSel(i)} style={{padding:"5px 12px",background:"var(--bg3)",borderRadius:2,fontSize:"0.52rem",letterSpacing:1,cursor:u||solved?"default":"pointer",border:`1px solid ${s?"var(--yellow)":"var(--border)"}`,color:s?"var(--yellow)":"var(--text)",opacity:u?0.3:1,userSelect:"none"}}>{t}</div>);})}
    </div>
    <div style={{border:"1px dashed var(--dim)",borderRadius:3,padding:8,background:"var(--bg)",marginBottom:8,display:"flex",flexDirection:"column",gap:4,alignItems:"center"}}>
      {SHRED_LINES.map((_,i)=>{const v=slots[i];const ok=v===i&&solved;return(<div key={i} onClick={()=>!solved&&place(i)} style={{width:260,height:26,borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.52rem",letterSpacing:1,cursor:solved?"default":"pointer",border:`1px ${v!==null?"solid":"dashed"} ${ok?"var(--green)":v!==null?"var(--blue)":"var(--border)"}`,background:ok?"#1a0505":v!==null?"#1a0808":"transparent",color:ok?"var(--green)":v!==null?"var(--blue)":"var(--text-dim)"}}>{v!==null?SHRED_LINES[v]:`[ slot ${i+1} ]`}</div>);})}
    </div>
    <div style={{display:"flex",gap:8}}><button onClick={check} style={btnStyle("green")}>▶ VERIFY DOCUMENT</button>{!solved&&<button onClick={()=>{setSlots(new Array(6).fill(null));setSel(null);}} style={btnStyle("red")}>↺ RESET</button>}</div>
  </div>);
}

function PuzzleSymbolGroup({solved,onSolve,onToast}:{solved:boolean;onSolve:()=>void;onToast:(m:string,t:ToastType)=>void}){
  // Full form labels shown on the game page alongside each abbreviation
  const SYM_LABELS: Record<string,string> = {
    "FW_CORE":    "Firmware Core Image",
    "CFG_BOOT":   "Boot Configuration",
    "IMG_FLASH":  "Flash Memory Image",
    "PATCH_FW":   "Firmware Patch File",
    "SIG_HASH":   "Signature Hash",
    "KEY_CERT":   "Key Certificate",
    "AUTH_TOKEN": "Auth Token",
    "AUDIT_LOG":  "Audit Log",
  };
  const [all]=useState(()=>shuffle([...SYM_CATS.FIRMWARE,...SYM_CATS.SECURITY]));
  const [cur,setCur]=useState<Record<string,string|null>>({});
  const moveTo=(s:string,cat:string|null)=>{
    if(solved) return;
    setCur(c=>{const n={...c};n[s]=cat;return n;});
  };
  const check=()=>{
    const ok=Object.entries(SYM_CATS).every(([cat,syms])=>syms.every(s=>cur[s]===cat));
    if(ok) onSolve();else onToast("GROUPING INCORRECT — REASSIGN","error");
  };

  // Category descriptions shown above each bucket
  const CAT_DESC: Record<string,string> = {
    FIRMWARE: "Core images, configs & patch files",
    SECURITY: "Auth, signing, audit & key ops",
  };

  return(<div>

    {/* Legend table — shows code → full form for all 8 symbols */}
    <div style={{marginBottom:14,border:"1px solid var(--border)",borderRadius:3,background:"var(--bg)",overflow:"hidden"}}>
      <div style={{padding:"6px 10px",background:"var(--bg3)",borderBottom:"1px solid var(--border)",fontSize:"0.5rem",letterSpacing:3,color:"var(--text-dim)"}}>SYMBOL REFERENCE</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
        {all.map((s,i)=>(
          <div key={s} style={{display:"flex",alignItems:"baseline",gap:8,padding:"5px 10px",borderBottom:i<all.length-2?"1px solid var(--border)":"none",borderRight:i%2===0?"1px solid var(--border)":"none"}}>
            <span style={{fontSize:"0.58rem",color:"var(--blue)",letterSpacing:1,minWidth:86,flexShrink:0,fontFamily:"var(--font-head)"}}>{s}</span>
            <span style={{fontSize:"0.52rem",color:"var(--text-dim)",letterSpacing:0.5}}>{SYM_LABELS[s]}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Pool of unassigned chips */}
    <div style={{fontSize:"0.5rem",letterSpacing:2,color:"var(--text-dim)",marginBottom:6}}>UNASSIGNED — transfer each chip to FIRMWARE or SECURITY:</div>
    <div style={{display:"flex",flexDirection:"column",gap:6,padding:10,border:"1px solid var(--border)",borderRadius:3,background:"var(--bg)",minHeight:44,marginBottom:12}}>
      {all.filter(s=>!cur[s]).map(s=>(
        <div key={s} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",border:"1px solid var(--border)",borderRadius:5,background:"var(--bg3)",userSelect:"none"}}>
          <div style={{flex:1}}>
            <span style={{letterSpacing:1,fontFamily:"var(--font-head)",fontSize:"0.55rem",color:"var(--text)"}}>{s}</span>
            <span style={{fontSize:"0.44rem",color:"var(--text-dim)",letterSpacing:0.3,marginLeft:8}}>{SYM_LABELS[s]}</span>
          </div>
          <button onClick={()=>moveTo(s,"FIRMWARE")}
            style={{padding:"3px 10px",fontSize:"0.48rem",fontFamily:"var(--font-head)",letterSpacing:1,cursor:"pointer",borderRadius:3,border:"1px solid var(--blue)",background:"transparent",color:"var(--blue)",transition:"background 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.background="#0a1a2a"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            → FIRMWARE
          </button>
          <button onClick={()=>moveTo(s,"SECURITY")}
            style={{padding:"3px 10px",fontSize:"0.48rem",fontFamily:"var(--font-head)",letterSpacing:1,cursor:"pointer",borderRadius:3,border:"1px solid var(--yellow)",background:"transparent",color:"var(--yellow)",transition:"background 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.background="#1a1400"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            → SECURITY
          </button>
        </div>
      ))}
      {all.filter(s=>!cur[s]).length===0&&(
        <div style={{fontSize:"0.52rem",color:"var(--text-dim)",letterSpacing:1}}>All symbols assigned ↓</div>
      )}
    </div>

    {/* Category buckets */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
      {Object.keys(SYM_CATS).map(cat=>(
        <div key={cat} style={{padding:10,border:`1px dashed ${cat==="FIRMWARE"?"var(--blue)":"var(--yellow)"}`,borderRadius:3,background:"var(--bg)"}}>
          <div style={{fontSize:"0.55rem",letterSpacing:2,color:cat==="FIRMWARE"?"var(--blue)":"var(--yellow)",marginBottom:2,fontFamily:"var(--font-head)"}}>{cat}</div>
          <div style={{fontSize:"0.46rem",color:"var(--text-dim)",marginBottom:8,letterSpacing:0.5}}>{CAT_DESC[cat]}</div>
          <div style={{display:"flex",flexDirection:"column",gap:4,minHeight:32}}>
            {Object.entries(cur).filter(([,v])=>v===cat).map(([s])=>(
              <div key={s}
                style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 8px",border:`1px solid ${cat==="FIRMWARE"?"var(--blue)":"var(--yellow)"}`,borderRadius:4,background:cat==="FIRMWARE"?"#0d1a24":"#1a1400",userSelect:"none"}}>
                <div>
                  <div style={{fontSize:"0.55rem",letterSpacing:1,color:cat==="FIRMWARE"?"var(--blue)":"var(--yellow)",fontFamily:"var(--font-head)"}}>{s}</div>
                  <div style={{fontSize:"0.44rem",color:"var(--text-dim)",marginTop:1}}>{SYM_LABELS[s]}</div>
                </div>
                <button onClick={()=>moveTo(s,null)}
                  style={{padding:"2px 8px",fontSize:"0.44rem",fontFamily:"var(--font-head)",letterSpacing:1,cursor:"pointer",borderRadius:3,border:"1px solid var(--border)",background:"transparent",color:"var(--text-dim)",transition:"color 0.15s",marginLeft:8}}
                  onMouseEnter={e=>e.currentTarget.style.color="var(--red)"}
                  onMouseLeave={e=>e.currentTarget.style.color="var(--text-dim)"}>
                  ↩ REMOVE
                </button>
              </div>
            ))}
            {Object.entries(cur).filter(([,v])=>v===cat).length===0&&(
              <div style={{fontSize:"0.48rem",color:"var(--text-dim)",letterSpacing:1,padding:"4px 0"}}>— empty —</div>
            )}
          </div>
        </div>
      ))}
    </div>

    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
      <button onClick={check} style={btnStyle("green")}>▶ CONFIRM GROUPING</button>
      <span style={{fontSize:"0.48rem",color:"var(--text-dim)",letterSpacing:1}}>
        {Object.values(cur).filter(Boolean).length} / {all.length} assigned
      </span>
    </div>
  </div>);
}

function PuzzleSimon({solved,onSolve,onToast,active}:{solved:boolean;onSolve:()=>void;onToast:(m:string,t:ToastType)=>void;active?:boolean}){
  const MAX_ROUNDS=6; // increased from 4 to 6 for more difficulty
  const MAX_LIVES=3;
  const [ps,setPs]=useState<number[]>([]);
  const [waiting,setWaiting]=useState(false);
  const [lit,setLit]=useState<number|null>(null);
  const [status,setStatus]=useState("Preparing sequence...");
  const [lives,setLives]=useState(MAX_LIVES);
  const seqRef=useRef<number[]>([]);const roundRef=useRef(0);

  const go=useCallback((seq: number[],round: number)=>{
    const ns=[...seq,Math.floor(Math.random()*4)];
    seqRef.current=ns;roundRef.current=round;
    setPs([]);setWaiting(false);
    setStatus(`Round ${round}/${MAX_ROUNDS} — Watch the sequence...`);
    ns.forEach((idx,i)=>{
      setTimeout(()=>setLit(idx),350*i+250);
      setTimeout(()=>setLit(null),350*i+550);
    });
    setTimeout(()=>{
      setWaiting(true);
      setStatus(`Round ${round}/${MAX_ROUNDS} — Your turn! Repeat it.`);
    },350*ns.length+250);
  },[]);

  useEffect(()=>{if(!solved&&active) go([],1);},[active]);

  const restart=()=>{setLives(MAX_LIVES);seqRef.current=[];roundRef.current=0;go([],1);};

  const press=(i:number)=>{
    if(!waiting||solved) return;
    setLit(i);setTimeout(()=>setLit(null),120);
    const np=[...ps,i];const pos=np.length-1;
    if(np[pos]!==seqRef.current[pos]){
      const newLives=lives-1;
      setLives(newLives);
      setWaiting(false);
      if(newLives<=0){
        onToast("OUT OF LIVES — FULL RESTART","error");
        setTimeout(()=>restart(),500);
      } else {
        onToast(`WRONG — ${newLives} ${newLives===1?"LIFE":"LIVES"} REMAINING · replaying round ${roundRef.current}`,"error");
        setTimeout(()=>go(seqRef.current.slice(0,-1),roundRef.current),500);
      }
      setPs([]);return;
    }
    setPs(np);
    if(np.length===seqRef.current.length){
      if(roundRef.current>=MAX_ROUNDS) setTimeout(onSolve,300);
      else{setWaiting(false);setTimeout(()=>go(seqRef.current,roundRef.current+1),400);}
    }
  };

  return(<div>
    {/* Lives display */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
      <p style={{fontSize:"0.58rem",letterSpacing:2,color:"var(--text-dim)"}}>{status}</p>
      <div style={{display:"flex",gap:4,alignItems:"center"}}>
        <span style={{fontSize:"0.46rem",color:"var(--text-dim)",letterSpacing:1,marginRight:4}}>LIVES</span>
        {Array.from({length:MAX_LIVES},(_,i)=>(
          <div key={i} style={{width:10,height:10,borderRadius:"50%",background:i<lives?"var(--red)":"var(--dim)",boxShadow:i<lives?"0 0 6px var(--red)":"none",transition:"all 0.3s"}}/>
        ))}
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,66px)",gap:6,margin:"0 auto 12px",width:"fit-content"}}>
      {SIMON_EMOJIS.map((e,i)=>{const l=lit===i;return(<div key={i} onClick={()=>press(i)} style={{width:66,height:66,borderRadius:3,cursor:solved?"default":"pointer",transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.2rem",userSelect:"none",background:l?SIMON_COLORS[i]:"var(--bg3)",border:`2px solid ${SIMON_COLORS[i]}`,boxShadow:l?`0 0 16px ${SIMON_COLORS[i]}`:"none"}}>{e}</div>);})}
    </div>
    {!solved&&<button onClick={restart} style={btnStyle("red")}>↺ RESTART</button>}
  </div>);
}

function PuzzleCodeAlign({solved,onSolve,onToast}:{solved:boolean;onSolve:()=>void;onToast:(m:string,t:ToastType)=>void}){
  const [order,setOrder]=useState<string[]>(()=>shuffle(CODE_CORRECT));
  const [drag,setDrag]=useState<number|null>(null);
  const drop=(t:number)=>{if(drag===null||drag===t) return;setOrder(o=>{const n=[...o];[n[drag],n[t]]=[n[t],n[drag]];return n;});setDrag(null);};
  const check=()=>{if(order.every((v,i)=>v===CODE_CORRECT[i])) setTimeout(onSolve,400);else onToast("CODE ORDER INCORRECT — REARRANGE","error");};
  return(<div>
    <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:10}}>
      {order.map((line,i)=>(<div key={line} draggable={!solved} onDragStart={()=>setDrag(i)} onDragOver={e=>e.preventDefault()} onDrop={()=>drop(i)} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:solved&&order[i]===CODE_CORRECT[i]?"#1a0505":"var(--bg)",border:`1px solid ${solved&&order[i]===CODE_CORRECT[i]?"var(--green)":drag===i?"var(--yellow)":"var(--border)"}`,borderRadius:3,fontSize:"0.58rem",letterSpacing:1,cursor:solved?"default":"grab",userSelect:"none",opacity:drag===i?0.5:1,color:solved&&order[i]===CODE_CORRECT[i]?"var(--green)":"var(--text)"}}>
        <span style={{color:"var(--text-dim)",fontSize:"0.52rem",width:14,textAlign:"right"}}>{i+1}</span>{line}
      </div>))}
    </div>
    <button onClick={check} style={btnStyle("green")}>▶ VERIFY ORDER</button>
  </div>);
}

// ─── HINT BAR ─────────────────────────────────────────────
function HintBar({nodeIdx,hintState,onRequest}:{nodeIdx:number;hintState:HintState;onRequest:(l:HintLevel)=>void}){
  const HINT_DEFS=[
    {lvl:"weak" as HintLevel, label:"EASY HINT", cost:5, color:"#ffcc44", border:"#7a6010", bg:"#1a1400", revealColor:"#ffe080"},
    {lvl:"strong" as HintLevel, label:"SOLUTION HINT", cost:10, color:"#ff6644", border:"#8a2a10", bg:"#1a0800", revealColor:"#ffaa88"},
  ];
  return(
    <div style={{marginBottom:12,borderRadius:4,overflow:"hidden",border:"1px solid #3a2a0a",background:"#120e02"}}>
      {/* Header row */}
      <div style={{padding:"7px 14px",background:"#1e1604",borderBottom:"1px solid #3a2a0a",display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:"0.48rem",letterSpacing:3,color:"#aa8833",fontFamily:"var(--font-head)"}}>💡 HINTS</span>
        <div style={{flex:1,height:"1px",background:"#3a2a0a"}}/>
        <span style={{fontSize:"0.42rem",color:"#5a4a20",letterSpacing:1}}>deducts points</span>
      </div>
      {/* Hint buttons */}
      <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:8}}>
        {HINT_DEFS.map(({lvl,label,cost,color,border,bg,revealColor})=>(
          <div key={lvl}>
            {!hintState[lvl]?(
              <button
                onClick={()=>onRequest(lvl)}
                style={{
                  width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"9px 14px",borderRadius:3,cursor:"pointer",
                  background:bg,
                  border:`1px solid ${border}`,
                  color:color,
                  fontFamily:"var(--font-mono)",fontSize:"0.56rem",letterSpacing:1,
                  boxShadow:`0 0 10px ${color}22`,
                  transition:"all 0.2s",
                }}
                onMouseEnter={e=>{e.currentTarget.style.background=border;e.currentTarget.style.boxShadow=`0 0 16px ${color}44`;}}
                onMouseLeave={e=>{e.currentTarget.style.background=bg;e.currentTarget.style.boxShadow=`0 0 10px ${color}22`;}}
              >
                <span style={{fontFamily:"var(--font-head)",letterSpacing:2,fontSize:"0.54rem"}}>{label}</span>
                <span style={{fontSize:"0.5rem",color:color,fontFamily:"var(--font-head)",letterSpacing:1}}>−{cost} pts</span>
              </button>
            ):(
              <div style={{
                padding:"10px 14px",borderRadius:3,
                background:bg,border:`1px solid ${color}`,
                boxShadow:`0 0 12px ${color}33`,
              }}>
                <div style={{fontSize:"0.46rem",letterSpacing:3,color:color,fontFamily:"var(--font-head)",marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
                  ✓ {label} <span style={{opacity:0.5}}>· −{cost} pts used</span>
                </div>
                <div style={{fontSize:"0.6rem",color:revealColor,lineHeight:1.8,letterSpacing:0.3}}>
                  {HINTS[nodeIdx][lvl]}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PUZZLE MODAL — instructions-first ───────────────────
function PuzzleModal({idx,solved,hintState,onClose,onSolve,onHintRequest,onToast}:{
  idx:PuzzleId;solved:boolean;hintState:HintState;
  onClose:()=>void;onSolve:(i:number)=>void;
  onHintRequest:(i:number,l:HintLevel)=>void;
  onToast:(m:string,t:ToastType)=>void;
}){
  // Solved nodes skip instructions — go straight to puzzle for review
  const [phase,setPhase]=useState<"instructions"|"puzzle">(solved?"puzzle":"instructions");
  // Track whether the player has moved past instructions at least once — used to change button label
  const [hasEverPlayed,setHasEverPlayed]=useState(solved);
  const goToPuzzle=()=>{setHasEverPlayed(true);setPhase("puzzle");};
  const frag=FRAGMENTS[idx];
  const pp={solved,onSolve:()=>onSolve(idx),onToast,hintState};

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,backdropFilter:"blur(4px)"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"var(--bg2)",border:`1px solid ${phase==="instructions"?"var(--yellow)":"var(--blue)"}`,borderRadius:4,padding:"20px 22px",width:"min(600px,95vw)",maxHeight:"90vh",overflowY:"auto",boxShadow:`0 0 40px ${phase==="instructions"?"#ffcc0022":"#cc222233"}`,transition:"border-color 0.35s,box-shadow 0.35s"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,paddingBottom:8,borderBottom:"1px solid var(--border)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontFamily:"var(--font-head)",fontSize:"0.65rem",letterSpacing:3,color:phase==="instructions"?"var(--yellow)":"var(--blue)",textShadow:phase==="instructions"?"var(--glow-y)":"var(--glow-b)",transition:"color 0.35s"}}>
              {phase==="instructions"?`${GAME_INSTRUCTIONS[idx].title} — HOW TO PLAY`:NODE_NAMES[idx]}
            </span>
          </div>
          <button onClick={onClose} style={{background:"none",border:"1px solid var(--border)",color:"var(--text-dim)",cursor:"pointer",fontFamily:"var(--font-mono)",padding:"3px 8px",fontSize:"0.65rem",borderRadius:3}}>✕ CLOSE</button>
        </div>

        {/* Fragment badge */}
        <div style={{display:"inline-block",padding:"3px 10px",border:`1px solid ${solved?"var(--green)":"var(--text-dim)"}`,background:solved?"#1a0505":"transparent",color:solved?"var(--green)":"var(--text-dim)",fontSize:"0.58rem",letterSpacing:2,borderRadius:3,marginBottom:14}}>
          {solved?`✓ FRAGMENT: ${frag.id} — ALREADY COLLECTED`:`UNLOCK FRAGMENT: ${frag.id}`}
        </div>

        {/* Phase content — both always mounted so puzzle state is never lost */}

        {/* INSTRUCTIONS PHASE — hidden (not unmounted) when in puzzle */}
        <div style={{display:phase==="instructions"?"block":"none"}}>
          <InstructionsScreen idx={idx} onStart={goToPuzzle} hasStarted={hasEverPlayed}/>
        </div>

        {/* PUZZLE PHASE — hidden (not unmounted) when showing instructions */}
        <div style={{display:phase==="puzzle"?"block":"none"}}>
          {/* ? HOW TO PLAY button — always visible, never restarts the game */}
          {!solved&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}>
            <button onClick={()=>setPhase("instructions")} style={{background:"none",border:"1px solid #6a3a1a",color:"#aa6644",cursor:"pointer",fontFamily:"var(--font-mono)",padding:"3px 10px",fontSize:"0.52rem",borderRadius:3,letterSpacing:2,transition:"all 0.2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--yellow)";e.currentTarget.style.color="var(--yellow)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#6a3a1a";e.currentTarget.style.color="#aa6644";}}>
              ? HOW TO PLAY
            </button>
          </div>}
          {!solved&&<HintBar nodeIdx={idx} hintState={hintState} onRequest={l=>onHintRequest(idx,l)}/>}
          {idx===0&&<PuzzleSignalRouting {...pp}/>}
          {idx===1&&<PuzzleTileFlip {...pp}/>}
          {idx===2&&<PuzzleMemoryMatch solved={solved} onSolve={()=>onSolve(idx)} hintState={hintState}/>}
          {idx===3&&<PuzzleArrowPath {...pp}/>}
          {idx===4&&<PuzzleShredDoc {...pp}/>}
          {idx===5&&<PuzzleSymbolGroup {...pp}/>}
          {idx===6&&<PuzzleSimon {...pp} active={phase==="puzzle"}/>}
          {idx===7&&<PuzzleCodeAlign {...pp}/>}
        </div>
      </div>
    </div>
  );
}

// ─── HINT CONFIRM ─────────────────────────────────────────
function HintConfirm({nodeIdx,level,onConfirm,onCancel}:{nodeIdx:number;level:HintLevel;onConfirm:()=>void;onCancel:()=>void}){
  const cost=HINT_COSTS[level];
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,backdropFilter:"blur(3px)"}}>
    <div style={{background:"var(--bg2)",border:"1px solid var(--yellow)",borderRadius:4,padding:"24px 28px",width:"min(400px,90vw)",textAlign:"center"}}>
      <div style={{fontFamily:"var(--font-head)",fontSize:"0.65rem",letterSpacing:3,color:"var(--yellow)",marginBottom:10,textShadow:"var(--glow-y)"}}>⚠ HINT ACCESS REQUEST</div>
      <div style={{fontSize:"0.62rem",color:"var(--text)",lineHeight:1.8,marginBottom:12}}>You are requesting a {level.toUpperCase()} HINT. This action cannot be undone.</div>
      <div style={{fontSize:"0.9rem",color:"var(--red)",fontFamily:"var(--font-head)",letterSpacing:2,marginBottom:16}}>−{cost} POINTS</div>
      <div style={{display:"flex",gap:10,justifyContent:"center"}}>
        <button onClick={onConfirm} style={{padding:"7px 20px",background:"transparent",border:"1px solid var(--yellow)",color:"var(--yellow)",fontFamily:"var(--font-head)",fontSize:"0.58rem",letterSpacing:2,cursor:"pointer",borderRadius:3}}>CONFIRM ACCESS</button>
        <button onClick={onCancel} style={{padding:"7px 20px",background:"transparent",border:"1px solid var(--border)",color:"var(--text-dim)",fontFamily:"var(--font-head)",fontSize:"0.58rem",letterSpacing:2,cursor:"pointer",borderRadius:3}}>CANCEL</button>
      </div>
    </div>
  </div>);
}

// ─── FILE VIEWER ─────────────────────────────────────────
function FileViewer(){
  const [af,setAf]=useState<string|null>(null); // null = grid view
  const FILES=["control_loop","safety_limits","feedback_monitor","shutdown_logic","arch_notes"];
  const FL:Record<string,string>={
    control_loop:"control_loop.cfg",
    safety_limits:"safety_limits.cfg",
    feedback_monitor:"feedback_monitor.cfg",
    shutdown_logic:"shutdown_logic.patch",
    arch_notes:"architecture_notes.txt",
  };
  const FILE_ICONS:Record<string,string>={
    control_loop:"⚙",safety_limits:"⛔",feedback_monitor:"📡",shutdown_logic:"🩹",arch_notes:"📋",
  };
  const FILE_DESC:Record<string,string>={
    control_loop:"Neural output control loop configuration",
    safety_limits:"Automatic safety threshold settings",
    feedback_monitor:"Feedback monitoring parameters",
    shutdown_logic:"Emergency shutdown patch file",
    arch_notes:"Architecture review notes",
  };
  const cm:Record<string,string>={comment:"var(--text-dim)",key:"var(--blue)",val:"var(--green)",warn:"var(--yellow)",danger:"var(--red)",text:"var(--text)"};

  return(<div>
    {/* Confirmation banner */}
    <div style={{border:"1px solid var(--green)",borderRadius:3,background:"#1a0505",padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:14,animation:"bannerReveal 0.6s ease forwards"}}>
      <div style={{fontSize:"1.8rem",color:"var(--green)",textShadow:"var(--glow-g)",flexShrink:0}}>◈</div>
      <div style={{flex:1}}>
        <div className="glitch" style={{fontFamily:"var(--font-head)",fontSize:"0.72rem",fontWeight:900,color:"var(--green)",letterSpacing:4,textShadow:"var(--glow-g)"}}>EXPORT TRACE CONFIRMED</div>
        <div style={{fontSize:"0.52rem",color:"var(--blue)",letterSpacing:3,marginTop:3}}>ACCESS HISTORY RECONSTRUCTED · INCIDENT FILE UNLOCKED</div>
        <div style={{display:"flex",gap:10,marginTop:10,flexWrap:"wrap"}}>
          <div style={{padding:"6px 14px",border:"1px solid var(--yellow)",borderRadius:3,background:"#1a1100",display:"flex",flexDirection:"column",gap:3}}>
            <span style={{fontSize:"0.44rem",color:"var(--text-dim)",letterSpacing:3}}>EXPORT TIME</span>
            <span style={{fontSize:"0.85rem",color:"var(--yellow)",textShadow:"var(--glow-y)",fontFamily:"var(--font-head)",letterSpacing:3,fontWeight:900}}>21:06 UTC</span>
          </div>
          <div style={{padding:"6px 14px",border:"1px solid #ff8c00",borderRadius:3,background:"#180e00",display:"flex",flexDirection:"column",gap:3}}>
            <span style={{fontSize:"0.44rem",color:"var(--text-dim)",letterSpacing:3}}>TRANSFER WINDOW</span>
            <span style={{fontSize:"0.85rem",color:"#ff9900",textShadow:"0 0 8px #ff990066",fontFamily:"var(--font-head)",letterSpacing:3,fontWeight:900}}>21:06 – 21:09 UTC</span>
          </div>
        </div>
      </div>
      <div style={{padding:"5px 12px",border:"1px solid var(--green)",borderRadius:3,background:"#2a0808",color:"var(--green)",fontFamily:"var(--font-head)",fontSize:"0.56rem",letterSpacing:2,flexShrink:0}}>⬡ nb_v4_backup.zip</div>
    </div>

    {/* GRID VIEW — shown when no file is open */}
    {!af&&(
      <div>
        <div style={{fontSize:"0.5rem",letterSpacing:3,color:"var(--text-dim)",marginBottom:10,fontFamily:"var(--font-head)"}}>
          SELECT A FILE TO INSPECT
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}>
          {FILES.map(f=>(
            <div key={f} onClick={()=>setAf(f)}
              style={{
                padding:"14px 12px",
                border:"1px solid var(--border)",
                borderRadius:4,
                background:"var(--bg2)",
                cursor:"pointer",
                transition:"all 0.2s",
                display:"flex",flexDirection:"column",gap:8,
              }}
              onMouseEnter={e=>{
                e.currentTarget.style.borderColor="var(--green)";
                e.currentTarget.style.background="var(--bg3)";
                e.currentTarget.style.boxShadow="var(--glow-g)";
              }}
              onMouseLeave={e=>{
                e.currentTarget.style.borderColor="var(--border)";
                e.currentTarget.style.background="var(--bg2)";
                e.currentTarget.style.boxShadow="none";
              }}
            >
              {/* File icon */}
              <div style={{fontSize:"1.6rem",lineHeight:1}}>{FILE_ICONS[f]}</div>
              {/* File name */}
              <div style={{fontFamily:"var(--font-mono)",fontSize:"0.54rem",color:"var(--green)",letterSpacing:1,wordBreak:"break-all"}}>{FL[f]}</div>
              {/* Description */}
              <div style={{fontSize:"0.46rem",color:"var(--text-dim)",lineHeight:1.6,letterSpacing:0.5}}>{FILE_DESC[f]}</div>
              {/* Open hint */}
              <div style={{fontSize:"0.44rem",color:"var(--blue)",letterSpacing:1,marginTop:4}}>▶ OPEN FILE</div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* FILE CONTENT VIEW — shown when a file is open */}
    {af&&(
      <div style={{border:"1px solid var(--border)",borderRadius:3,overflow:"hidden",animation:"contentFade 0.25s ease"}}>
        {/* File header bar */}
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",background:"var(--bg3)",borderBottom:"1px solid var(--border)"}}>
          <span style={{fontSize:"1rem"}}>{FILE_ICONS[af]}</span>
          <div style={{flex:1}}>
            <div style={{fontFamily:"var(--font-head)",fontSize:"0.54rem",letterSpacing:2,color:"var(--green)"}}>{FL[af]}</div>
            <div style={{fontSize:"0.44rem",color:"var(--text-dim)",marginTop:2,letterSpacing:1}}>/core_neural_control/{FL[af]}</div>
          </div>
          {/* Back to grid button */}
          <button onClick={()=>setAf(null)} style={{
            background:"transparent",
            border:"1px solid var(--border)",
            color:"var(--text-dim)",
            fontFamily:"var(--font-mono)",
            fontSize:"0.5rem",
            letterSpacing:1,
            padding:"4px 12px",
            cursor:"pointer",
            borderRadius:3,
            transition:"all 0.15s",
          }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--red)";e.currentTarget.style.color="var(--red)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text-dim)";}}
          >← BACK TO FILES</button>
        </div>

        {/* Content with line numbers — key = value inline */}
        <div style={{background:"var(--bg)",padding:"12px 0",fontFamily:"var(--font-mono)",fontSize:"0.58rem",lineHeight:2,minHeight:80,maxHeight:280,overflowY:"auto"}}>
          {FILE_CONTENTS[af].lines.map((l,i)=>(
            <div key={i} style={{display:"flex",gap:0,alignItems:"baseline"}}>
              <span style={{minWidth:32,textAlign:"right",paddingRight:12,color:"var(--dim)",fontSize:"0.46rem",userSelect:"none",paddingTop:1,flexShrink:0}}>{i+1}</span>
              {l.val!=null
                ? <span style={{flex:1,paddingRight:14,display:"flex",gap:0,alignItems:"baseline",flexWrap:"nowrap"}}>
                    <span style={{color:cm[l.cls]??cm.text,minWidth:200}}>{l.text}</span>
                    <span style={{color:"var(--text-dim)",marginRight:4}}>=</span>
                    <span style={{color:cm[l.valCls??'val']??cm.val}}>{l.val}</span>
                  </span>
                : <span style={{flex:1,color:cm[l.cls]??cm.text,paddingRight:14}}>{l.text||" "}</span>
              }
            </div>
          ))}
        </div>

        {/* GhostID finding banner */}
        <div style={{borderTop:"1px solid var(--yellow)",padding:"10px 14px",background:"#1a0800",display:"flex",alignItems:"flex-start",gap:10}}>
          <div style={{flexShrink:0}}>
            <div style={{fontFamily:"var(--font-head)",fontSize:"0.48rem",letterSpacing:2,color:"var(--yellow)",textShadow:"var(--glow-y)"}}>⚠ GHOSTID FINDING</div>
          </div>
          <div style={{fontSize:"0.58rem",color:"#dd8888",lineHeight:1.65,flex:1}}>{FILE_CONTENTS[af].ghostid}</div>
        </div>

        {/* Close file button at the bottom */}
        <div style={{padding:"10px 14px",background:"var(--bg3)",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"center"}}>
          <button onClick={()=>setAf(null)} style={{
            padding:"7px 32px",
            background:"transparent",
            border:"1px solid var(--border)",
            color:"var(--text-dim)",
            fontFamily:"var(--font-head)",
            fontSize:"0.52rem",
            letterSpacing:3,
            cursor:"pointer",
            borderRadius:3,
            transition:"all 0.15s",
          }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--red)";e.currentTarget.style.color="var(--red)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text-dim)";}}
          >✕ CLOSE FILE</button>
        </div>
      </div>
    )}
  </div>);
}

// ─── GHOST41_ID CHAT INTERFACE ───────────────────────────
interface ChatMsg { role:"ghost"|"user"|"hint"; text:string; }

const GHOST_HINT_STRONG = "Q1: adaptive\nQ2: manual_override\nQ3: The shutdown_logic.patch disables immediate shutdown and extends the spike tolerance window — delaying response to neural spikes and increasing overload risk.";
const GHOST_HINT_MEDIUM = "Check control_loop.cfg for behavior, safety_limits.cfg for overrides, and shutdown_logic.patch for changes affecting response time.";
const GHOST_HINT_WEAK   = "Focus on how the system adapts, what overrides safety, and what affects shutdown timing.";

const GHOST_QUESTIONS = [
  {
    id:1,
    query:"What mode allows the system to dynamically adjust neural stimulation?",
    hints:{weak:GHOST_HINT_WEAK,medium:GHOST_HINT_MEDIUM,strong:GHOST_HINT_STRONG},
    mission:"Your mission: Reconstruct the transfer path of the system file. Analyze node activity, access logs, and file movements across the network. Identify how the file moved beyond internal systems. Once you have mapped the chain — return and report your findings.",
    followup:"Examine the configuration files carefully — come back and tell me what you found.",
    answers:["adaptive"],
    correct_reply:"Confirmed. The system was running in adaptive mode — enabling dynamic real-time adjustment of neural stimulation without manual sign-off. This is the first breach vector.",
    wrong_reply:"That is not in the configuration record. Look at the control parameters — what mode allows the system to adapt automatically?",
  },
  {
    id:2,
    query:"What setting enables bypassing automatic safety limits?",
    hints:{weak:GHOST_HINT_WEAK,medium:GHOST_HINT_MEDIUM,strong:GHOST_HINT_STRONG},
    mission:"The transfer path is becoming clear. Now dig deeper into the system configuration.",
    followup:"Review safety_limits.cfg carefully. There is one key that should not have been enabled.",
    answers:["manual_override","manual override","override"],
    correct_reply:"Correct. manual_override was enabled — disabling automatic safety limits and allowing unrestricted stimulation parameters. This is the second breach vector.",
    wrong_reply:"Not quite. Check safety_limits.cfg — look specifically at the override field. What value was set that bypassed the safety layer?",
  },
  {
    id:3,
    query:"Q3: Explain how the modifications in the shutdown logic increased the risk of delayed system response during neural spikes. Refer to specific changes in the configuration.",
    hints:{weak:GHOST_HINT_WEAK,medium:GHOST_HINT_MEDIUM,strong:GHOST_HINT_STRONG},
    mission:"Final vector. A silent patch changed how the system responds during neural spikes.",
    followup:"Open shutdown_logic.patch and read the changes carefully. Something was disabled. Something else was extended.",
    answers:["disable immediate shutdown","extend spike tolerance","spike tolerance window","delayed shutdown","immediate shutdown","tolerance window","suppress warning","overload"],
    correct_reply:"Confirmed. The shutdown logic patch disables immediate shutdown and extends the spike tolerance window, which delays the system\'s response to dangerous neural activity and increases the risk of overload. Chain of custody fully reconstructed.",
    wrong_reply:"Incomplete. Read shutdown_logic.patch carefully — what specific changes delay the shutdown response during neural spikes, and how does that increase risk?",
  },
];

function Ghost41Chat({solved,unlocked,onHintUsed,onCorrect}:{solved:boolean[];unlocked:boolean;onHintUsed?:(pts:number)=>void;onCorrect?:(pts:number)=>void}){
  const solvedCount=solved.filter(Boolean).length;
  const [open,setOpen]=useState(false);
  const [qIdx,setQIdx]=useState(0);
  const [msgs,setMsgs]=useState<ChatMsg[]>([]);
  const [input,setInput]=useState("");
  const [done,setDone]=useState(false);
  const [hintPanel,setHintPanel]=useState<"closed"|"open">("closed");
  const [shownHints,setShownHints]=useState<Record<string,boolean>>({});
  const [wrongCount,setWrongCount]=useState(0);
  const [lastCorrect,setLastCorrect]=useState(false);
  const msgsEndRef=useRef<HTMLDivElement|null>(null);
  const q=GHOST_QUESTIONS[qIdx];

  useEffect(()=>{msgsEndRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  useEffect(()=>{
    if(qIdx===0){
      // First question — initialise fresh
      setMsgs([
        {role:"ghost",text:q.mission},
        {role:"ghost",text:q.followup},
        {role:"ghost",text:"GHOST41_ID > QUERY\n"+q.query},
      ]);
    } else {
      // Subsequent questions — append to existing conversation, never wipe it
      setMsgs(prev=>[
        ...prev,
        {role:"ghost",text:"— NEXT OBJECTIVE —"},
        {role:"ghost",text:"GHOST41_ID > QUERY\n"+q.query},
      ]);
    }
    setInput("");setHintPanel("closed");if(qIdx===0)setShownHints({});setWrongCount(0);setLastCorrect(false);
  },[qIdx]);

  const send=()=>{
    const val=input.trim();if(!val)return;
    const inp=val.toLowerCase();
    const ok=q.answers.some(a=>inp.includes(a.toLowerCase()));
    setMsgs(m=>[...m,{role:"user",text:val},{role:"ghost",text:ok?q.correct_reply:q.wrong_reply}]);
    setInput("");
    setLastCorrect(ok);
    if(!ok){
      const newCount=wrongCount+1;
      setWrongCount(newCount);
    }
    const Q_POINTS=[30,30,0];
    if(ok){setWrongCount(0);setHintPanel("closed");setShownHints({});
      if(onCorrect&&Q_POINTS[qIdx]>0) onCorrect(Q_POINTS[qIdx]);
      if(qIdx<GHOST_QUESTIONS.length-1)setTimeout(()=>setQIdx(i=>i+1),1800);
      else setTimeout(()=>setDone(true),1800);
    }
  };

  return(<>
    {/* RIGHT SIDE PANEL — slides in from right */}
    {open&&(
      <div style={{position:"fixed",inset:0,zIndex:5000,background:"rgba(0,0,0,0.4)"}}
        onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}}>
      <div style={{position:"absolute",top:0,right:0,bottom:0,width:"min(360px,100vw)",background:"#060d14",borderLeft:"2px solid #0a2a3a",display:"flex",flexDirection:"column",fontFamily:"var(--font-mono)",boxShadow:"-8px 0 32px rgba(0,0,0,0.7)"}}>

        {/* Header */}
        <div style={{background:"#07111a",borderBottom:"1px solid #0a2a3a",padding:"14px 16px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
          <div dangerouslySetInnerHTML={{__html:`<svg width='40' height='35' viewBox='0 0 32 28' xmlns='http://www.w3.org/2000/svg' shape-rendering='crispEdges'><rect width='32' height='28' rx='5' fill='#0c1b27'/><rect x='11' y='3'  width='10' height='2' fill='#ddeaf5'/><rect x='9'  y='5'  width='14' height='2' fill='#ddeaf5'/><rect x='7'  y='7'  width='18' height='8'  fill='#ddeaf5'/><rect x='12' y='9'  width='3'  height='3'  fill='#1a2a4a'/><rect x='12' y='9'  width='1'  height='1'  fill='#00d4ff'/><rect x='17' y='9'  width='3'  height='3'  fill='#1a2a4a'/><rect x='17' y='9'  width='1'  height='1'  fill='#00d4ff'/><rect x='7'  y='15' width='18' height='1'  fill='#ddeaf5'/><rect x='7'  y='16' width='4'  height='5'  fill='#ddeaf5'/><rect x='14' y='16' width='4'  height='5'  fill='#ddeaf5'/><rect x='21' y='16' width='4'  height='5'  fill='#ddeaf5'/></svg>`}}/>
          <div style={{flex:1}}>
            <div style={{fontFamily:"var(--font-head)",fontSize:"0.75rem",letterSpacing:4,color:"#00d4ff",textShadow:"0 0 12px #00d4ff66"}}>GHOST41_ID</div>
            <div style={{fontSize:"0.48rem",color:"#2a4a5a",letterSpacing:3,marginTop:3}}>INVESTIGATION ASSISTANT · ONLINE</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:"0.5rem",color:"#2a4a5a",letterSpacing:2}}>QUESTION {qIdx+1} / {GHOST_QUESTIONS.length}</div>
            <button onClick={()=>setOpen(false)} style={{background:"transparent",border:"1px solid #cc2222",color:"#cc2222",fontFamily:"var(--font-head)",fontSize:"0.46rem",letterSpacing:1,padding:"3px 10px",cursor:"pointer",borderRadius:2}}>X CLOSE</button>
          </div>
        </div>

        {/* Messages — fills remaining height */}
        <div style={{flex:1,overflowY:"auto",padding:"24px",display:"flex",flexDirection:"column",gap:14,minHeight:0}}>
          {msgs.map((m,i)=>{
            // First message (i===0) is always the mission briefing — give it special treatment
            const isMission = i===0 && m.role==="ghost";
            return(
            <div key={i} style={{
              padding: isMission?"16px 18px":"14px 18px",
              borderRadius:6,
              fontSize:"0.65rem",
              lineHeight: isMission?2.1:1.85,
              whiteSpace:"pre-wrap",letterSpacing:0.3,
              background: isMission?"#020f1c" : m.role==="user"?"#001828":"#081624",
              border:`1px solid ${isMission?"#0d4a62" : m.role==="user"?"#0a3a5a":"#0a2a3a"}`,
              color: isMission?"#b8dde8":"#c8d8e8",
              alignSelf: m.role==="user"?"flex-end":"flex-start",
              maxWidth: isMission?"100%":"70%",
              boxShadow: isMission?"0 0 24px #00d4ff0d":"none",
            }}>
              {isMission&&(
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,paddingBottom:8,borderBottom:"1px solid #0a3a4a"}}>
                  <span style={{color:"#00d4ff",fontSize:"0.7rem"}}>◈</span>
                  <span style={{fontFamily:"var(--font-head)",fontSize:"0.48rem",letterSpacing:4,color:"#00d4ff",textShadow:"0 0 8px #00d4ff66"}}>MISSION BRIEFING</span>
                  <div style={{flex:1,height:"1px",background:"#0a3a4a"}}/>
                  <div style={{width:6,height:6,borderRadius:"50%",background:"#00d4ff",boxShadow:"0 0 6px #00d4ff"}} className="blink"/>
                </div>
              )}
              {m.role==="ghost"&&m.text.startsWith("GHOST41_ID")
                ?<>
                  <div style={{fontSize:"0.5rem",color:"#00d4ff",letterSpacing:3,marginBottom:6,fontFamily:"var(--font-head)"}}>{m.text.split("\n")[0]}</div>
                  <div style={{fontSize:"0.65rem"}}>{m.text.split("\n").slice(1).join(" ")}</div>
                </>
                :<span>{m.text}</span>
              }
            </div>
            );
          })}
          {done&&(
            <div style={{padding:"16px",borderRadius:6,background:"#001a0a",border:"2px solid #00ff88",fontSize:"0.65rem",color:"#00ff88",textAlign:"center",letterSpacing:2,fontFamily:"var(--font-head)"}}>
              ✓ DEBRIEF COMPLETE — CHAIN OF CUSTODY CONFIRMED
            </div>
          )}
          <div ref={msgsEndRef}/>
        </div>

        {/* Hint bar — 3-level system */}
        {!done&&!lastCorrect&&(
          <div style={{borderTop:"1px solid #0a2030",background:"#050e18",flexShrink:0}}>
            {/* Toggle button */}
            <div style={{padding:"8px 24px"}}>
              <button onClick={()=>setHintPanel(p=>p==="open"?"closed":"open")}
                style={{
                  background: hintPanel==="open"?"#0a1a2a":"none",
                  border:"1px solid #1a4a5a",
                  color:"#00d4ff",
                  fontSize:"0.52rem",
                  cursor:"pointer",
                  padding:"6px 14px",
                  letterSpacing:1,
                  borderRadius:3,
                  transition:"all 0.2s",
                  width:"100%",
                  textAlign:"left",
                  display:"flex",
                  justifyContent:"space-between",
                  alignItems:"center",
                  boxShadow:"0 0 8px #00d4ff11",
                }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#00d4ff88";e.currentTarget.style.background="#0a1a2a";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="#1a4a5a";e.currentTarget.style.background=hintPanel==="open"?"#0a1a2a":"none";}}>
                <span style={{fontFamily:"var(--font-head)",letterSpacing:2}}>💡 HINTS</span>
                <span style={{fontSize:"0.44rem",color:"#3a8a9a"}}>{hintPanel==="open"?"▲ HIDE":"▼ SHOW HINTS"}</span>
              </button>
            </div>
            {/* Hint level picker */}
            {hintPanel==="open"&&(
              <div style={{padding:"4px 16px 14px",display:"flex",flexDirection:"column",gap:8}}>
                {(["weak","medium","strong"] as const).map(lvl=>{
                  // Global hint key — paid once, shown for all questions
                  const hintKey=lvl;
                  const revealed=shownHints[hintKey];
                  const costs={weak:10,medium:15,strong:50};
                  const labels={weak:"WEAK",medium:"MEDIUM",strong:"STRONG"};
                  const desc={weak:"Subtle nudge in the right direction",medium:"Specific area to investigate",strong:"Direct answers for all 3 questions"};
                  const colors={weak:"#44cc88",medium:"#ccaa33",strong:"#ff6644"};
                  const borders={weak:"#1a4a2a",medium:"#4a3a0a",strong:"#4a1a08"};
                  const bgs={weak:"#071a0f",medium:"#1a1205",strong:"#1a0803"};
                  return(
                    <div key={lvl} style={{borderRadius:4,overflow:"hidden",border:`1px solid ${revealed?colors[lvl]:borders[lvl]}`,transition:"all 0.2s"}}>
                      {/* Hint header — always visible */}
                      <div style={{
                        display:"flex",justifyContent:"space-between",alignItems:"center",
                        padding:"8px 12px",
                        background:revealed?bgs[lvl]:"transparent",
                        cursor:revealed?"default":"pointer",
                      }}
                        onClick={()=>{
                          if(!revealed){setShownHints(h=>({...h,[hintKey]:true}));if(onHintUsed)onHintUsed(costs[lvl]);}
                        }}>
                        <div style={{display:"flex",flexDirection:"column",gap:2}}>
                          <span style={{fontFamily:"var(--font-head)",fontSize:"0.52rem",letterSpacing:2,color:colors[lvl]}}>{labels[lvl]} HINT</span>
                          <span style={{fontSize:"0.42rem",color:"#3a6a7a"}}>{desc[lvl]}</span>
                        </div>
                        {!revealed
                          ?<div style={{textAlign:"right"}}>
                            <div style={{fontFamily:"var(--font-head)",fontSize:"0.54rem",color:colors[lvl]}}>-{costs[lvl]}pts</div>
                            <div style={{fontSize:"0.4rem",color:"#3a6a7a"}}>click to reveal · applies to all questions</div>
                          </div>
                          :<span style={{fontSize:"0.5rem",color:colors[lvl]}}>✓ unlocked</span>
                        }
                      </div>
                      {/* Hint content — shown for every question once revealed */}
                      {revealed&&(
                        <div style={{padding:"10px 12px",background:bgs[lvl],borderTop:`1px solid ${borders[lvl]}`,fontSize:"0.56rem",color:"#c8d8c8",lineHeight:1.9,letterSpacing:0.3,whiteSpace:"pre-line"}}>
                          {q.hints[lvl]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Progress dots */}
        <div style={{display:"flex",gap:8,padding:"8px 24px",borderTop:"1px solid #0a2030",background:"#050e18",flexShrink:0,alignItems:"center"}}>
          <span style={{fontSize:"0.46rem",color:"#2a4a5a",letterSpacing:2,marginRight:6}}>PROGRESS</span>
          {GHOST_QUESTIONS.map((_,i)=>(
            <div key={i} style={{width:10,height:10,borderRadius:"50%",background:i<qIdx?"#00ff88":i===qIdx?"#00d4ff":"#0a2030",transition:"all 0.3s",boxShadow:i===qIdx?"0 0 8px #00d4ff":"none"}}/>
          ))}
        </div>

        {/* Input bar */}
        {!done&&(
          <div style={{borderTop:"2px solid #0a2a3a",display:"flex",background:"#07111a",flexShrink:0}}>
            <input
              value={input}
              autoFocus
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&send()}
              placeholder="Type your answer..."
              style={{flex:1,background:"transparent",border:"none",color:"#c8d8e8",fontFamily:"var(--font-mono)",fontSize:"0.65rem",padding:"16px 24px",outline:"none",letterSpacing:0.5}}
            />
            <button onClick={send} style={{background:"transparent",border:"none",borderLeft:"1px solid #0a2a3a",color:"#00d4ff",fontFamily:"var(--font-head)",fontSize:"0.6rem",letterSpacing:3,padding:"16px 28px",cursor:"pointer",transition:"all 0.2s"}}
              onMouseEnter={e=>e.currentTarget.style.background="#001a2e"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            >[ SEND ]</button>
          </div>
        )}
      </div>
      </div>
    )}

    {/* CORNER WIDGET — fixed bottom-right */}
    <div style={{position:"fixed",bottom:20,right:20,zIndex:4000,display:"flex",flexDirection:"column",alignItems:"center",gap:8,cursor:unlocked?"pointer":"default"}}
      onClick={()=>unlocked&&setOpen(o=>!o)}>
      <div style={{opacity:unlocked?1:0.2,filter:unlocked?"none":"grayscale(1)",transition:"all 0.4s",imageRendering:"pixelated"}}
        dangerouslySetInnerHTML={{__html:`<svg width='64' height='56' viewBox='0 0 32 28' xmlns='http://www.w3.org/2000/svg' shape-rendering='crispEdges'><rect width='32' height='28' rx='6' fill='#0c1b27'/><rect x='11' y='3'  width='10' height='2' fill='#ddeaf5'/><rect x='9'  y='5'  width='14' height='2' fill='#ddeaf5'/><rect x='7'  y='7'  width='18' height='8'  fill='#ddeaf5'/><rect x='12' y='9'  width='3'  height='3'  fill='#1a2a4a'/><rect x='12' y='9'  width='1'  height='1'  fill='#00d4ff'/><rect x='17' y='9'  width='3'  height='3'  fill='#1a2a4a'/><rect x='17' y='9'  width='1'  height='1'  fill='#00d4ff'/><rect x='7'  y='15' width='18' height='1'  fill='#ddeaf5'/><rect x='7'  y='16' width='4'  height='5'  fill='#ddeaf5'/><rect x='14' y='16' width='4'  height='5'  fill='#ddeaf5'/><rect x='21' y='16' width='4'  height='5'  fill='#ddeaf5'/></svg>`}}/>
      {unlocked
        ?<div style={{border:"2px solid #00d4ff",color:"#00d4ff",fontFamily:"var(--font-head)",fontSize:"0.6rem",letterSpacing:3,padding:"4px 10px",borderRadius:3,boxShadow:"0 0 10px #00d4ff33",background:"rgba(0,8,18,0.9)",userSelect:"none",transition:"all 0.2s"}}>
            {open?"CLOSE ✕":"ASK ME!"}
          </div>
        :<div style={{fontSize:"0.42rem",color:"#0a1a2a",letterSpacing:2,fontFamily:"var(--font-head)",textAlign:"center",lineHeight:1.8}}>GHOST41_ID<br/>LOCKED</div>
      }
    </div>
  </>);
}
// ─── RECONSTRUCTION PANEL ────────────────────────────────
// Decoy fragment IDs mixed with correct ones to increase difficulty
const DECOY_FRAGS = ["tmp_cache","srv_relay","bkp_node","relay_x","int_hub","prx_gate","arc_node","null_host"];

function makeFragPool(): string[] {
  // 4 correct + 4 random decoys, shuffled fresh each call
  const decoys = shuffle([...DECOY_FRAGS]).slice(0, 4);
  return shuffle(["wrk04","nas02","usb07","ext_host",...decoys]);
}

// Actor options base — stable order, not shuffled (prevents continuous reshuffling)
const _AO_BASE=["lsuri_fw","a.m_arch","vk_sec","ghost_patch41","babaji","km_pr","rs_e","rm_fin"];

function ReconPanel({onToast,onUnlockGhost}:{onToast:(m:string,t:ToastType)=>void;onUnlockGhost?:()=>void}){
  const CF=["wrk04","nas02","usb07","ext_host"];
  const AO=["lsuri_fw","a.m_arch","vk_sec","ghost_patch41"];
  const AS=["wrk04","nas02","usb07"];

  // Fragment pool: correct + decoys, reshuffled on every failed attempt
  const [pool,setPool]=useState<string[]>(makeFragPool);
  const [cs,setCs]=useState<string[]>(["","","",""]);
  const [sf,setSf]=useState<string|null>(null);
  const [s1,setS1]=useState(false);const [s2,setS2]=useState(false);
  const [act,setAct]=useState<Record<string,string>>({"act-0":"","act-1":"","act-2":""});
  // Stable per-mount shuffle — never changes after first render
  const [actorOpts]=useState<[string[],string[],string[]]>(()=>[
    [...shuffle(_AO_BASE)],
    [...shuffle(_AO_BASE)],
    [...shuffle(_AO_BASE)],
  ]);
  const [showF,setShowF]=useState(false);
  const [attempts,setAttempts]=useState(0);

  const fill=(i:number)=>{
    if(!sf) return onToast("Select a fragment first","info");
    setCs(s=>{const n=[...s].map(v=>v===sf?"":v);n[i]=sf;return n;});
    setSf(null);
  };

  const v1=()=>{
    if(JSON.stringify(cs)===JSON.stringify(CF)){
      setS1(true);
      onToast("TRANSFER PATH VALIDATED","success");
    } else {
      // Reset slots AND reshuffle pool with fresh decoys on each failed attempt
      setCs(["","","",""]);
      setSf(null);
      setPool(makeFragPool());
      setAttempts(a=>a+1);
      onToast("INVALID ORDER — FRAGMENTS RESHUFFLED","error");
    }
  };

  const v2=()=>{
    if(act["act-0"]==="lsuri_fw"&&act["act-1"]==="a.m_arch"&&act["act-2"]==="vk_sec"){
      setS2(true);
      onToast("CHAIN OF CUSTODY RECONSTRUCTED","success");
      setTimeout(()=>setShowF(true),700);
      if(onUnlockGhost) setTimeout(onUnlockGhost,1200);
    } else {
      setAct({"act-0":"","act-1":"","act-2":""});
      onToast("INVALID LINKS","error");
    }
  };

  // Which pool items are still available (not placed in a slot)
  const placed=cs.filter(Boolean);
  const available=pool.filter(f=>!placed.includes(f));
  const isCorrect=(f:string)=>CF.includes(f);

  return(<div style={{fontFamily:"var(--font-mono)",fontSize:"0.62rem"}}>
    <div style={{color:"var(--text-dim)",fontSize:"0.58rem",lineHeight:1.6,whiteSpace:"nowrap",overflow:"hidden"}}>────────────────────────────────────────────────────────────</div>
    <div className="glitch" style={{color:"var(--green)",fontFamily:"var(--font-head)",fontSize:"0.6rem",letterSpacing:3,padding:"5px 0",textShadow:"var(--glow-g)"}}>|                  TRANSFER RECONSTRUCTION PANEL                  |</div>
    <div style={{color:"var(--text-dim)",fontSize:"0.58rem",lineHeight:1.6,whiteSpace:"nowrap",overflow:"hidden"}}>────────────────────────────────────────────────────────────</div>
    <div style={{padding:"10px 0 4px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontSize:"0.62rem",color:"var(--text)",letterSpacing:2}}>Transfer Path:</div>
        {attempts>0&&<div style={{fontSize:"0.48rem",color:"var(--red)",letterSpacing:1}}>ATTEMPT {attempts+1} · pool reshuffled</div>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        {[0,1,2,3].map(i=>(<span key={i} style={{display:"flex",alignItems:"center",gap:8}}>
          <div onClick={()=>!s1&&fill(i)} style={{minWidth:90,height:32,border:`1px solid ${cs[i]?"var(--green)":"var(--text-dim)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.6rem",color:cs[i]?"var(--green)":"var(--text-dim)",cursor:s1?"default":"pointer",letterSpacing:1,padding:"0 6px",userSelect:"none",background:cs[i]?"#1a0505":"transparent"}}>{cs[i]||"[ ? ]"}</div>
          {i<3&&<span style={{color:"var(--text-dim)",fontSize:"0.9rem"}}>→</span>}
        </span>))}
      </div>
      <div style={{fontSize:"0.58rem",color:"var(--text-dim)",marginBottom:8}}>
        Available fragments <span style={{color:"var(--text-dim)",fontSize:"0.46rem"}}>(correct + decoys mixed — identify the real ones)</span>:
      </div>
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        {pool.map(f=>{
          const isPlaced=placed.includes(f);
          const isSel=sf===f;
          return(
            <button key={f} onClick={()=>!s1&&!isPlaced&&setSf(f===sf?null:f)}
              style={{
                background:isSel?"#1a0505":"transparent",
                border:`1px solid ${isSel?"var(--yellow)":isPlaced?"var(--dim)":"var(--border)"}`,
                fontFamily:"var(--font-mono)",fontSize:"0.6rem",letterSpacing:2,
                cursor:s1||isPlaced?"default":"pointer",
                padding:"3px 10px",borderRadius:3,
                color:isSel?"var(--yellow)":isPlaced?"var(--text-dim)":"var(--text)",
                textDecoration:isPlaced?"line-through":"none",
                transition:"all 0.15s",
                opacity:isPlaced?0.4:1,
              }}
            >{f}</button>
          );
        })}
      </div>
      {!s1&&<button onClick={v1} style={btnStyle("green")}>▶ VALIDATE PATH</button>}
      {s1&&<div style={{padding:"8px 14px",border:"1px solid var(--green)",background:"#1a0505",color:"var(--green)",fontFamily:"var(--font-head)",fontSize:"0.65rem",letterSpacing:4,textAlign:"center",marginTop:10}}>✓ TRANSFER PATH VALIDATED</div>}
    </div>
    {s1&&<div style={{padding:"10px 0 4px"}}>
      <div style={{color:"var(--dim)",fontSize:"0.55rem",margin:"8px 0 12px"}}>· · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·</div>
      <div style={{fontSize:"0.62rem",color:"var(--text)",letterSpacing:2,marginBottom:6}}>Actor Links:</div>
      {/* Instructions for actor links */}
      <div style={{padding:"8px 12px",border:"1px solid var(--border)",borderRadius:3,background:"var(--bg)",marginBottom:12,fontSize:"0.52rem",color:"var(--text-dim)",lineHeight:1.7,letterSpacing:0.5}}>
        Each system node was accessed by a specific account. Match each node to the account that accessed it during the transfer. One account is a decoy — it was never involved.
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
        {AS.map((sys,i)=>(
          <div key={sys} style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{display:"flex",flexDirection:"column",minWidth:60}}>
              <span style={{fontSize:"0.62rem",color:"var(--green)",letterSpacing:2}}>{sys}</span>
              <span style={{fontSize:"0.44rem",color:"var(--text-dim)",letterSpacing:1}}>
                {sys==="wrk04"?"dev workstation":sys==="nas02"?"storage array":"usb device"}
              </span>
            </div>
            <span style={{color:"var(--text-dim)"}}>→</span>
            <select value={act[`act-${i}`]} onChange={e=>!s2&&setAct(a=>({...a,[`act-${i}`]:e.target.value}))} disabled={s2} style={{background:"var(--bg)",border:"1px solid var(--text-dim)",color:"var(--text)",fontFamily:"var(--font-mono)",fontSize:"0.6rem",padding:"3px 8px",outline:"none",flex:1}}>
              <option value="">— select account —</option>
              {actorOpts[i].map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div style={{fontSize:"0.5rem",color:"var(--text-dim)",marginBottom:12,letterSpacing:1}}>
        Available accounts: {AO.map((o,i)=>(
          <span key={o} style={{color:o==="ghost_patch41"?"#5a3a3a":"var(--blue)",marginLeft:i>0?10:4}}>
            {o}{o==="ghost_patch41"&&<span style={{color:"var(--red)",fontSize:"0.42rem"}}> (decoy)</span>}
          </span>
        ))}
      </div>
      {!s2&&<button onClick={v2} style={btnStyle("green")}>▶ CONFIRM LINKS</button>}
      {s2&&<div style={{padding:"8px 14px",border:"1px solid var(--green)",background:"#1a0505",color:"var(--green)",fontFamily:"var(--font-head)",fontSize:"0.65rem",letterSpacing:4,textAlign:"center",marginTop:10}}>✓ CHAIN OF CUSTODY RECONSTRUCTED</div>}
    </div>}
    {showF&&<div style={{marginTop:12}}><hr style={{border:"none",borderTop:"1px solid var(--border)",margin:"12px 0"}}/><FileViewer/></div>}
    
  </div>);
}

// ─── LANDING BOOT SEQUENCE ───────────────────────────────
function LandingBoot({lines,onDone}:{lines:string[];onDone:()=>void}){
  const [shown,setShown]=useState<string[]>([]);
  const [idx,setIdx]=useState(0);
  const [bar,setBar]=useState(0);
  useEffect(()=>{
    if(idx<lines.length){
      const t=setTimeout(()=>{setShown(s=>[...s,lines[idx]]);setIdx(i=>i+1);setBar(Math.round((idx+1)/lines.length*100));},340+Math.random()*180);
      return()=>clearTimeout(t);
    } else {
      const t=setTimeout(onDone,700);
      return()=>clearTimeout(t);
    }
  },[idx]);
  return(
    <div style={{minHeight:"100vh",background:"#080000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-mono)",padding:"40px 24px"}}>
      <style>{CSS}</style>
      {/* Shield icon */}
      <div style={{marginBottom:28,opacity:0.5}}>
        <svg width="44" height="48" viewBox="0 0 44 48" fill="none">
          <path d="M22 2L4 10v14c0 11 7.8 21.3 18 24 10.2-2.7 18-13 18-24V10L22 2z" stroke="#cc2222" strokeWidth="2" fill="none"/>
          <circle cx="22" cy="22" r="5" stroke="#cc2222" strokeWidth="1.5" fill="none"/>
        </svg>
      </div>
      {/* Boot lines */}
      <div style={{width:"min(520px,90vw)",marginBottom:24}}>
        {shown.map((l,i)=>(
          <div key={i} style={{
            fontSize:"0.62rem",color:i===shown.length-1?"#ff4444":"#5a2a2a",
            letterSpacing:1,lineHeight:1.9,
            animation:"contentFade 0.2s ease",
          }}>
            {i===shown.length-1&&<span style={{color:"#ff2222",marginRight:6}}>▶</span>}
            {l}
          </div>
        ))}
      </div>
      {/* Progress bar */}
      <div style={{width:"min(520px,90vw)",height:2,background:"#1a0505",borderRadius:2,overflow:"hidden"}}>
        <div style={{height:"100%",background:"linear-gradient(90deg,#660000,#ff2222)",width:`${bar}%`,transition:"width 0.3s ease",boxShadow:"0 0 8px #ff222266"}}/>
      </div>
      <div style={{marginTop:8,fontSize:"0.46rem",color:"#3a1010",letterSpacing:3}}>{bar}% LOADED</div>
    </div>
  );
}

// ─── LANDING BRIEF ────────────────────────────────────────
function LandingBrief({onStart}:{onStart:()=>void}){
  const [visible,setVisible]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVisible(true),100);return()=>clearTimeout(t);},[]);
  return(
    <div style={{
      minHeight:"100vh",background:"#0a0000",
      display:"flex",flexDirection:"column",alignItems:"center",
      fontFamily:"var(--font-mono)",padding:"32px 20px 24px",
      opacity:visible?1:0,transition:"opacity 0.6s ease",
    }}>
      <style>{CSS}</style>

      {/* Shield icon */}
      <div style={{marginBottom:20}}>
        <svg width="52" height="58" viewBox="0 0 44 48" fill="none">
          <path d="M22 2L4 10v14c0 11 7.8 21.3 18 24 10.2-2.7 18-13 18-24V10L22 2z" stroke="#cc2222" strokeWidth="2" fill="none" opacity="0.7"/>
          <circle cx="22" cy="22" r="5" stroke="#cc2222" strokeWidth="1.5" fill="none"/>
        </svg>
      </div>

      {/* Main title */}
      <div style={{
        fontFamily:"'Courier New',monospace",
        fontSize:"clamp(1.4rem,5vw,2rem)",
        fontWeight:900,
        color:"#fff",
        letterSpacing:8,
        marginBottom:14,
        textAlign:"center",
        textShadow:"0 0 20px rgba(200,0,0,0.3)",
      }}>TASK: CHAIN OF CUSTODY</div>

      {/* Protocol badge */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:28}}>
        <div style={{flex:1,height:"1px",background:"#cc2222",maxWidth:60}}/>
        <div style={{
          padding:"4px 14px",border:"1px solid #cc2222",borderRadius:2,
          fontSize:"0.48rem",letterSpacing:3,color:"#cc2222",
          fontFamily:"'Courier New',monospace",
        }}>GHOST41_ID PROTOCOL INITIATED</div>
        <div style={{flex:1,height:"1px",background:"#cc2222",maxWidth:60}}/>
      </div>

      {/* Brief sections */}
      <div style={{width:"min(640px,92vw)",display:"flex",flexDirection:"column",gap:20,marginBottom:24}}>
        {[
          {
            label:"> SCANNING NETWORK",
            text:"Node activity logs from the corporate network are being processed. Transfer paths are being traced across internal and external systems.",
          },
          {
            label:"> OBJECTIVE ANALYSIS",
            text:"Solve all 8 node challenges to collect transfer fragments. Reconstruct the chain of custody to identify how the file moved beyond internal systems.",
          },
          {
            label:"> COMMUNICATION PROTOCOL",
            text:"Once you have mapped the transfer chain — open the Ghost41_ID terminal and answer the debrief questions.",
          },
        ].map(({label,text},i)=>(
          <div key={i}>
            <div style={{fontFamily:"'Courier New',monospace",fontSize:"0.58rem",letterSpacing:2,color:"#cc3333",marginBottom:6,fontWeight:"bold"}}>{label}</div>
            <div style={{fontFamily:"'Courier New',monospace",fontSize:"0.62rem",color:"#c8b8b8",lineHeight:1.85,letterSpacing:0.5,fontWeight:"bold"}}>{text}</div>
          </div>
        ))}
      </div>

      {/* Note box */}
      <div style={{
        width:"min(640px,92vw)",
        padding:"12px 18px",
        background:"#120505",
        border:"1px solid #2a0808",
        borderRadius:3,
        marginBottom:22,
        fontSize:"0.54rem",
        color:"#7a4040",
        fontStyle:"italic",
        fontFamily:"'Courier New',monospace",
        letterSpacing:0.3,
      }}>
        Note: You may retry each challenge as many times as necessary. Hints deduct points.
      </div>

      {/* ARE YOU READY */}
      <div style={{
        fontFamily:"'Courier New',monospace",
        fontSize:"0.85rem",
        fontWeight:900,
        color:"#cc2222",
        letterSpacing:4,
        marginBottom:24,
        textShadow:"0 0 12px #cc222266",
      }}>ARE YOU READY TO PROCEED?</div>

      {/* Divider */}
      <div style={{width:"min(640px,92vw)",height:"1px",background:"#1a0505",marginBottom:24}}/>

      {/* Begin button */}
      <button
        onClick={onStart}
        style={{
          padding:"14px 40px",
          background:"linear-gradient(135deg,#1a0404,#2a0808)",
          border:"2px solid #cc2222",
          color:"#ff4444",
          fontFamily:"'Courier New',monospace",
          fontSize:"0.75rem",
          letterSpacing:4,
          fontWeight:900,
          cursor:"pointer",
          borderRadius:3,
          boxShadow:"0 0 20px #cc222233",
          transition:"all 0.2s",
          marginBottom:32,
        }}
        onMouseEnter={e=>{e.currentTarget.style.background="linear-gradient(135deg,#2a0606,#3a0a0a)";e.currentTarget.style.boxShadow="0 0 30px #cc222266";}}
        onMouseLeave={e=>{e.currentTarget.style.background="linear-gradient(135deg,#1a0404,#2a0808)";e.currentTarget.style.boxShadow="0 0 20px #cc222233";}}
      >[ BEGIN INVESTIGATION ]</button>

      {/* Footer stats */}
      <div style={{display:"flex",gap:32,fontSize:"0.44rem",color:"#3a1010",letterSpacing:2,fontFamily:"'Courier New',monospace",alignItems:"center"}}>
        {[["⊙","INTEGRITY: 98.4%"],["∿","SIGNAL: SECURE"],["⊙","PRIORITY: ALPHA"]].map(([icon,text],i)=>(
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <span style={{fontSize:"0.6rem",color:"#4a1a1a"}}>{icon}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────
export default function App(){
  const [landing,setLanding]=useState<"case"|"booting"|"brief"|"game">("brief");
  const [solved,setSolved]=useState<boolean[]>(new Array(8).fill(false));
  const [score,setScore]=useState(100);
  const [toasts,setToasts]=useState<Toast[]>([]);
  const [modal,setModal]=useState<PuzzleId|null>(null);
  const [hints,setHints]=useState<HintState[]>(Array.from({length:8},()=>({weak:false,medium:false,strong:false})));
  const [pending,setPending]=useState<{nodeIdx:number;level:HintLevel}|null>(null);
  const [allSolved,setAllSolved]=useState(false);
  const [showGhost,setShowGhost]=useState(true);
  const tid=useRef(0);
  // Fixed random row order for node column — set once on mount
  const [rowOrder]=useState<number[]>(()=>shuffle([0,1,2,3,4,5,6,7]));
  // Separate shuffle for fragment column — deliberately mismatched from rowOrder
  // so wrk04 never appears next to Dev Workstation, nas02 never next to Build Console, etc.
  const [fragColOrder]=useState<number[]>(()=>{
    // Keep shuffling until no index i has rowOrder[i] === fragColOrder[i]
    let attempt=shuffle([0,1,2,3,4,5,6,7]);
    const ro=shuffle([0,1,2,3,4,5,6,7]); // temp rowOrder for this closure — we use the real one below
    for(let tries=0;tries<20;tries++){
      attempt=shuffle([0,1,2,3,4,5,6,7]);
      // no position should map to itself (derangement-like check done at render)
      if(attempt.every((_,i)=>attempt[i]!==i)) break;
    }
    return attempt;
  });

  const toast=useCallback((msg:string,type:ToastType)=>{const id=tid.current++;setToasts(t=>[...t,{id,msg,type}]);setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3100);},[]);

  const onSolve=(idx:number)=>{setSolved(s=>{if(s[idx]) return s;const ns=[...s];ns[idx]=true;if(ns.filter(Boolean).length===8) setTimeout(()=>setAllSolved(true),600);return ns;});setModal(null);toast(`FRAGMENT ACQUIRED: ${FRAGMENTS[idx].id}`,"success");};
  const onHR=(ni:number,lv:HintLevel)=>setPending({nodeIdx:ni,level:lv});
  const applyHint=()=>{if(!pending) return;const{nodeIdx,level}=pending;setHints(h=>{const n=[...h];n[nodeIdx]={...n[nodeIdx],[level]:true};return n;});setScore(s=>s-HINT_COSTS[level]);toast(`HINT ACCESSED: −${HINT_COSTS[level]} PTS`,"warn");setPending(null);};

  const total=solved.filter(Boolean).length;

  // Boot sequence lines
  const BOOT_LINES = [
    "NEUROBAND FORENSIC INTERFACE v2.4.1",
    "Initializing secure channel...",
    "GHOST41_ID protocol: ACTIVE",
    "Loading node map...",
    "Decrypting transfer logs...",
    "Fragment index: 8 nodes detected",
    "Chain of custody: UNVERIFIED",
    "ACCESS GRANTED — loading task briefing...",
  ];

  if(landing!=="game"){
    // Phase: booting
    if(landing==="booting") return <LandingBoot lines={BOOT_LINES} onDone={()=>setLanding("brief")}/>;
    // Phase: brief
    if(landing==="brief") return <LandingBrief onStart={()=>setLanding("game")}/>;

    // Phase: case file
    return(
      <div style={{
        minHeight:"100vh",
        background:"#0f0000",
        fontFamily:"var(--font-mono)",
        position:"relative",
        overflow:"hidden",
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
      }}>
        <style>{CSS+`
          @keyframes floatA{0%,100%{transform:translateY(0px) rotate(-15deg)}50%{transform:translateY(-18px) rotate(-10deg)}}
          @keyframes floatB{0%,100%{transform:translateY(0px) rotate(12deg)}50%{transform:translateY(-22px) rotate(18deg)}}
          @keyframes floatC{0%,100%{transform:translateY(0px) rotate(-5deg)}50%{transform:translateY(-14px) rotate(2deg)}}
          @keyframes floatD{0%,100%{transform:translateY(0px) rotate(20deg)}50%{transform:translateY(-20px) rotate(14deg)}}
          @keyframes floatE{0%,100%{transform:translateY(0px) rotate(-25deg)}50%{transform:translateY(-16px) rotate(-18deg)}}
          @keyframes swingLine{0%,100%{transform:rotate(-1deg)}50%{transform:rotate(1deg)}}
          @keyframes fadeSlideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
          @keyframes critBlink{0%,100%{opacity:1}45%{opacity:1}55%{opacity:0.4}}
        `}</style>

        {/* Dark red radial bg */}
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 60% 30%,#2a0000 0%,#0f0000 60%,#080000 100%)"}}/>

        {/* Grid lines */}
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(180,0,0,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(180,0,0,0.06) 1px,transparent 1px)",backgroundSize:"48px 48px"}}/>

        {/* Vignette */}
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at center,transparent 35%,rgba(0,0,0,0.75) 100%)"}}/>

        {/* ── CLOTHESLINE + FLOATING CUBES (right side) ── */}
        <div style={{position:"absolute",top:0,right:0,width:"55%",height:"100%",pointerEvents:"none"}}>

          {/* Clothesline string */}
          <svg style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",animation:"swingLine 4s ease-in-out infinite"}} viewBox="0 0 600 500" preserveAspectRatio="none">
            <path d="M 0 80 Q 200 160 400 100 Q 500 70 600 120" stroke="#3a0808" strokeWidth="1.5" fill="none" opacity="0.7"/>
            <path d="M 50 60 Q 250 140 500 80" stroke="#2a0606" strokeWidth="1" fill="none" opacity="0.4"/>
            {/* Hanging strings for cubes */}
            {[[120,88],[230,130],[360,108],[480,105]].map(([x,y],i)=>(
              <line key={i} x1={x} y1={y} x2={x+8} y2={y+55} stroke="#2a0808" strokeWidth="1" opacity="0.6"/>
            ))}
          </svg>

          {/* Floating 3D cubes — SVG perspective boxes */}
          {[
            {top:"8%",left:"18%",size:62,anim:"floatA 5.5s ease-in-out infinite",rot:-15,delay:"0s"},
            {top:"16%",left:"36%",size:50,anim:"floatB 6.2s ease-in-out infinite",rot:12,delay:"0.8s"},
            {top:"11%",left:"56%",size:58,anim:"floatC 5.8s ease-in-out infinite",rot:-5,delay:"0.3s"},
            {top:"9%",left:"74%",size:46,anim:"floatD 6.5s ease-in-out infinite",rot:20,delay:"1.1s"},
            {top:"42%",left:"25%",size:38,anim:"floatE 7s ease-in-out infinite",rot:-22,delay:"1.6s"},
            {top:"55%",left:"60%",size:44,anim:"floatA 6.8s ease-in-out infinite",rot:15,delay:"2s"},
            {top:"68%",left:"40%",size:30,anim:"floatB 7.5s ease-in-out infinite",rot:-8,delay:"0.5s"},
          ].map(({top,left,size,anim,rot,delay},i)=>(
            <div key={i} style={{position:"absolute",top,left,animation:anim,animationDelay:delay}}>
              <svg width={size} height={size} viewBox="0 0 40 40">
                {/* Front face */}
                <polygon points="8,12 32,12 32,34 8,34" fill={`rgba(${140+i*8},${10+i*4},${10+i*4},0.85)`}/>
                {/* Top face */}
                <polygon points="8,12 32,12 38,6 14,6" fill={`rgba(${180+i*6},${20+i*5},${20+i*5},0.9)`}/>
                {/* Right face */}
                <polygon points="32,12 38,6 38,28 32,34" fill={`rgba(${100+i*6},${5+i*3},${5+i*3},0.8)`}/>
                {/* Shine line */}
                <line x1="10" y1="14" x2="28" y2="14" stroke="rgba(255,100,100,0.3)" strokeWidth="0.8"/>
                {/* Doc lines */}
                <line x1="11" y1="19" x2="29" y2="19" stroke="rgba(255,80,80,0.2)" strokeWidth="0.6"/>
                <line x1="11" y1="23" x2="24" y2="23" stroke="rgba(255,80,80,0.2)" strokeWidth="0.6"/>
              </svg>
            </div>
          ))}
        </div>

        {/* ── CASE FILE CARD ── */}
        <div style={{
          position:"relative",zIndex:10,
          width:"min(480px,92vw)",
          marginLeft:"min(-60px,-5vw)",
          animation:"fadeSlideUp 0.9s ease forwards",
        }}>

          {/* Top label */}
          <div style={{fontSize:"0.46rem",color:"#4a1a1a",letterSpacing:4,fontFamily:"var(--font-head)",marginBottom:12}}>
            NEUROBAND FORENSIC INTERFACE  ·  ROUND 2 TASK 3
          </div>

          {/* Case title */}
          <div style={{
            fontFamily:"var(--font-head)",
            fontSize:"clamp(1.4rem,5vw,2.2rem)",
            fontWeight:900,
            color:"#ffffff",
            letterSpacing:2,
            marginBottom:4,
            textShadow:"0 0 30px rgba(255,40,40,0.3)",
          }}>
            CASE FILE #131
          </div>
          <div style={{height:"2px",width:60,background:"#cc0000",marginBottom:22,boxShadow:"0 0 8px #cc000066"}}/>

          {/* Priority */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
            <span style={{fontSize:"0.52rem",color:"#5a2a2a",letterSpacing:2}}>Priority:</span>
            <span style={{
              fontFamily:"var(--font-head)",fontSize:"0.55rem",letterSpacing:3,
              color:"#ff2222",textShadow:"0 0 10px #ff222288",
              animation:"critBlink 2s ease-in-out infinite",
            }}>CRITICAL</span>
          </div>

          {/* Case details */}
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:22,paddingLeft:4}}>
            <div style={{fontSize:"0.58rem",color:"#999",lineHeight:1.6,letterSpacing:0.5}}>
              <span style={{color:"#5a2a2a",letterSpacing:2,fontSize:"0.48rem"}}>Subject: </span>Software Engineer<br/>
              <span style={{color:"#5a2a2a",letterSpacing:2,fontSize:"0.48rem"}}>Company: </span>NeuroBand Technologies
            </div>
            <div style={{width:"100%",height:"1px",background:"#2a0a0a"}}/>
            <div style={{fontSize:"0.58rem",color:"#999",lineHeight:1.6,letterSpacing:0.5}}>
              Employee missing. Suspected insider data theft.<br/>
              <span style={{color:"#5a2a2a",letterSpacing:2,fontSize:"0.48rem"}}>Status: </span>
              <span style={{color:"#ff5533"}}>Active Investigation</span>
            </div>
          </div>

          {/* Buttons */}
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <button
              onClick={()=>setLanding("booting")}
              style={{
                padding:"11px 24px",
                background:"#cc0000",
                border:"none",
                color:"#fff",
                fontFamily:"var(--font-head)",
                fontSize:"0.6rem",
                letterSpacing:3,
                cursor:"pointer",
                borderRadius:3,
                boxShadow:"0 0 20px #cc000066",
                transition:"all 0.2s",
              }}
              onMouseEnter={e=>{e.currentTarget.style.background="#ff1111";e.currentTarget.style.boxShadow="0 0 30px #ff111188";}}
              onMouseLeave={e=>{e.currentTarget.style.background="#cc0000";e.currentTarget.style.boxShadow="0 0 20px #cc000066";}}
            >
              START INVESTIGATION
            </button>

            <button
              onClick={()=>setLanding("booting")}
              style={{
                padding:"11px 24px",
                background:"transparent",
                border:"1px solid #5a1a1a",
                color:"#cc4444",
                fontFamily:"var(--font-head)",
                fontSize:"0.6rem",
                letterSpacing:3,
                cursor:"pointer",
                borderRadius:3,
                transition:"all 0.2s",
                display:"flex",alignItems:"center",gap:8,
              }}
              onMouseEnter={e=>{e.currentTarget.style.background="#1a0404";e.currentTarget.style.borderColor="#cc2222";}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="#5a1a1a";}}
            >
              <span style={{fontSize:"0.7rem"}}>🔍</span> VIEW EVIDENCE
            </button>
          </div>

        </div>
      </div>
    );
  }

  return(<div className="scanlines flicker" style={{minHeight:"100vh",background:"var(--bg)",color:"var(--text)",fontFamily:"var(--font-mono)"}}>
    <style>{CSS}</style>

    <header style={{background:"linear-gradient(135deg,#190808,#1c0c0c)",borderBottom:"1px solid var(--green)",padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 20px #ff333322",position:"sticky",top:0,zIndex:100,flexWrap:"wrap",gap:8}}>
      <div>
        <div style={{fontFamily:"var(--font-head)",fontSize:"1rem",fontWeight:900,color:"var(--green)",letterSpacing:4,textShadow:"var(--glow-g)"}}>NEUROBAND FORENSIC INTERFACE</div>
        
      </div>
      <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
        {[["STATUS","ACTIVE",true],["NODES",`${total}/8`,false],["FRAGS",`${total}/8`,false]].map(([k,v,b])=>(<div key={String(k)} style={{fontSize:"0.58rem",letterSpacing:2,color:"var(--text-dim)"}}>{k}: <span className={b?"blink":""} style={{color:"var(--green)"}}>{String(v)}</span></div>))}
        
      </div>
    </header>

    <div style={{display:"grid",gridTemplateColumns:"240px 1fr",height:"calc(100vh - 60px)"}}>

      {/* LEFT */}
      <div style={{background:"var(--bg2)",borderRight:"1px solid var(--border)",padding:14,overflowY:"auto"}}>

        {/* ── NODE PANEL ── */}
        <div style={{fontFamily:"var(--font-head)",fontSize:"0.52rem",letterSpacing:3,color:"var(--blue)",marginBottom:10,paddingBottom:6,borderBottom:"1px solid var(--border)"}}>▸ INVESTIGATION NODES</div>
        {FRAGMENTS.map((f,i)=>{
          const sv=solved[i];
          const hc=Object.values(hints[i]).filter(Boolean).length;
          return(
            <div key={i} onClick={()=>setModal(i as PuzzleId)} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 10px",marginBottom:5,border:`1px solid ${sv?"var(--green)":"var(--border)"}`,borderRadius:3,cursor:"pointer",background:"var(--bg3)",transition:"all 0.2s",position:"relative",overflow:"hidden",boxShadow:sv?"var(--glow-g)":"none"}}>
              <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:sv?"var(--green)":"var(--text-dim)",boxShadow:sv?"var(--glow-g)":"none"}}/>
              <div style={{fontSize:"0.7rem",color:sv?"var(--green)":"var(--text-dim)",width:14}}>⬡</div>
              <div style={{fontSize:"0.62rem",letterSpacing:1,flex:1}}>{NODE_NAMES[i]}</div>
              {hc>0&&<span style={{fontSize:"0.55rem"}}>{"💡".repeat(hc)}</span>}
              {sv&&<span style={{fontSize:"0.62rem",color:"var(--green)",textShadow:"var(--glow-g)"}}>✓</span>}
            </div>
          );
        })}

        {/* Progress + Score */}
        <div style={{marginTop:12,padding:10,border:"1px solid var(--border)",borderRadius:3,background:"var(--bg)"}}>
          <div style={{fontSize:"0.52rem",letterSpacing:2,color:"var(--text-dim)",marginBottom:6}}>INVESTIGATION PROGRESS</div>
          <div style={{height:4,background:"var(--dim)",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",background:"linear-gradient(90deg,var(--green),var(--blue))",width:`${total/8*100}%`,transition:"width 0.5s ease"}}/></div>
          <div style={{fontSize:"0.52rem",color:"var(--green)",marginTop:4,textAlign:"right"}}>{total} / 8 NODES</div>
        </div>




      </div>

      {/* RIGHT — single scrollable column: status panel + reconstruction */}
      <div style={{background:"var(--bg2)",overflowY:"auto",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"10px 14px 6px",fontFamily:"var(--font-mono)",fontSize:"0.62rem"}}>
          <div style={{color:"var(--text-dim)",fontSize:"0.58rem",lineHeight:1.6,whiteSpace:"nowrap",overflow:"hidden"}}>────────────────────────────────────────────────────────────────────</div>
          {/* Unified node+fragment table — one row per node, fragment shown inline */}
          <div style={{padding:"6px 0 4px",minHeight:145}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:"0 8px",paddingBottom:6,marginBottom:4,borderBottom:"1px solid var(--dim)"}}>
              <span style={{fontSize:"0.52rem",letterSpacing:3,color:"var(--text-dim)",padding:"0 10px"}}>NODE</span>
              <span style={{fontSize:"0.52rem",letterSpacing:3,color:"var(--text-dim)"}}>FRAGMENT</span>
              <span style={{fontSize:"0.52rem",color:"var(--text-dim)",width:14}}/>
            </div>
            {/* Node rows — show COLLECTED next to solved node name */}
            {rowOrder.map((nodeIdx,position)=>(
              <div key={position} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"2px 0"}}>
                <span style={{fontSize:"0.58rem",color:solved[nodeIdx]?"var(--text)":"var(--text-dim)",letterSpacing:0.5,padding:"0 10px"}}>
                  {NODE_NAMES[nodeIdx].split(" ").map(w=>w[0]+w.slice(1).toLowerCase()).join(" ")}
                </span>
                {solved[nodeIdx]
                  ? <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <span style={{fontSize:"0.5rem",color:"var(--green)",textShadow:"var(--glow-g)"}}>✓</span>
                      <span style={{fontSize:"0.48rem",letterSpacing:1,color:"var(--green)",textShadow:"var(--glow-g)"}}>COLLECTED</span>
                    </div>
                  : <span style={{fontSize:"0.52rem",color:"var(--text-dim)",padding:"0 4px"}}>——</span>
                }
              </div>
            ))}
          </div>
          <div style={{color:"var(--text-dim)",fontSize:"0.58rem",lineHeight:1.6,whiteSpace:"nowrap",overflow:"hidden"}}>────────────────────────────────────────────────────────────────────</div>

          {/* ── COLLECTED FRAGMENTS — right panel, above LOCKED ── */}
          <div style={{padding:"8px 0 6px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontFamily:"var(--font-head)",fontSize:"0.5rem",letterSpacing:3,color:"var(--green)",textShadow:"var(--glow-g)"}}>COLLECTED FRAGMENTS</span>
              <span style={{fontSize:"0.48rem",color:"var(--text-dim)",letterSpacing:1}}>{solved.filter(Boolean).length} / 8</span>
            </div>

            {solved.every(s=>!s)
              ? <div style={{fontSize:"0.5rem",color:"var(--text-dim)",letterSpacing:1,padding:"6px 0"}}>— none yet —</div>
              : <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {FRAGMENTS.filter((_,i)=>solved[i]).map(f=>(
                    <div key={f.id} style={{
                      padding:"4px 10px",
                      border:`1px solid ${f.type==="sys"?"#5a1a1a":"#3a1010"}`,
                      borderRadius:3,
                      background:f.type==="sys"?"#1a0505":"#150505",
                      animation:"contentFade 0.35s ease",
                      display:"flex",alignItems:"center",gap:6,
                    }}>
                      <span style={{fontSize:"0.55rem",color:"var(--green)",textShadow:"var(--glow-g)"}}>✓</span>
                      <span style={{fontFamily:"var(--font-head)",fontSize:"0.54rem",letterSpacing:2,color:f.type==="sys"?"var(--green)":"var(--blue)",textShadow:f.type==="sys"?"var(--glow-g)":"var(--glow-b)"}}>{f.id}</span>
                    </div>
                  ))}
                </div>
            }
          </div>

          <div style={{color:"var(--text-dim)",fontSize:"0.58rem",lineHeight:1.6,whiteSpace:"nowrap",overflow:"hidden"}}>────────────────────────────────────────────────────────────────────</div>
          <div style={{fontSize:"0.52rem",letterSpacing:1,padding:"2px 0"}}>
            {allSolved?<span className="glitch" style={{color:"var(--green)",textShadow:"var(--glow-g)"}}>|   TRANSFER RECONSTRUCTION (NOW UNLOCKED)                           |</span>:<span style={{color:"var(--text-dim)"}}>|   TRANSFER RECONSTRUCTION (LOCKED — COLLECT ALL FRAGMENTS)         |</span>}
          </div>
          <div style={{color:"var(--text-dim)",fontSize:"0.58rem",lineHeight:1.6,whiteSpace:"nowrap",overflow:"hidden"}}>────────────────────────────────────────────────────────────────────</div>
        </div>

        {/* RECONSTRUCTION SECTION — inline below status, scrolls with right panel */}
        <div style={{background:"var(--bg3)",borderTop:"1px solid var(--border)",padding:"14px 16px",flex:1}}>
          {!allSolved?(<div style={{color:"var(--text-dim)",fontSize:"0.62rem",letterSpacing:2,padding:14,border:"1px dashed var(--dim)",borderRadius:3,textAlign:"center",lineHeight:1.9}}><span style={{color:"var(--red)"}}>⚠ LOCKED</span> — Collect all 8 fragments to unlock Transfer Reconstruction.</div>):(<ReconPanel onToast={toast} onUnlockGhost={()=>setShowGhost(true)}/>)}
        </div>
      </div>


    </div>

    {/* ── GHOST41_ID — fixed bottom-right corner widget ── */}
    <Ghost41Chat solved={solved} unlocked={showGhost} onHintUsed={(pts)=>{setScore(s=>s-pts);toast(`GHOST HINT: −${pts} PTS`,"warn");}} onCorrect={(pts)=>{setScore(s=>s+pts);toast(`+${pts} POINTS AWARDED`,"success");}}/>

    {modal!==null&&<PuzzleModal idx={modal} solved={solved[modal]} hintState={hints[modal]} onClose={()=>setModal(null)} onSolve={onSolve} onHintRequest={onHR} onToast={toast}/>}
    {pending&&<HintConfirm nodeIdx={pending.nodeIdx} level={pending.level} onConfirm={applyHint} onCancel={()=>setPending(null)}/>}


    <div style={{position:"fixed",top:68,right:14,zIndex:3000,display:"flex",flexDirection:"column",gap:5}}>
      {toasts.map(t=>(<div key={t.id} style={{padding:"7px 14px",borderRadius:3,fontSize:"0.58rem",letterSpacing:2,animation:"toast-in 0.3s ease",maxWidth:280,background:{success:"#1a0505",error:"#1a000a",info:"#1a0808",warn:"#1a1000"}[t.type],border:`1px solid ${{success:"var(--green)",error:"var(--red)",info:"var(--blue)",warn:"var(--yellow)"}[t.type]}`,color:{success:"var(--green)",error:"var(--red)",info:"var(--blue)",warn:"var(--yellow)"}[t.type]}}>{t.msg}</div>))}
    </div>
  </div>);
}
