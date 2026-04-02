'use client'
import React, { useState } from 'react';

// ==================== FILE DATA ====================
const FILE_DATA = {
    "Autopsy Report": {
        icon: "📋",
        content: `FORENSIC POSTMORTEM REPORT > Case ID: NB-IR-2147 | Status: Finalized

CASE INFORMATION > Subject Name: Rishab Sen
Age: 31
Sex: Male
Date of Examination: 12 Oct 20XX
Location: Biomedical Research Facility, Sector 4
Lead Examiner: Dr. A. Rao

EXTERNAL EXAMINATION > The deceased is a well-nourished male, clothed in standard facility coveralls. Initial inspection reveals no visible signs of blunt force trauma, lacerations, or abrasions. There are no indications of a struggle; fingernails are intact and skin surfaces are clear of defensive wounds. No thermal or electrical burns are present on the torso or extremities. No puncture marks or injection sites were noted during a full-body dermal scan. The physical appearance is entirely normal, with no external markers of distress.

INTERNAL EXAMINATION > The cardiovascular system shows no evidence of underlying disease or myocardial infarction. However, the cranial cavity reveals significant findings. There is pronounced diffuse cerebral edema and petechial hemorrhaging within the deep cortical layers. Microscopic analysis of the neural pathways suggests a catastrophic depolarization event. Heart tissue shows contraction band necrosis, typically associated with extreme, sudden catecholamine release. Respiratory and digestive systems show no acute abnormalities or obstructions. The lack of standard metabolic waste products suggests the systemic shutdown occurred with extreme velocity.

TOXICOLOGY > Comprehensive screening for narcotics, stimulants, and volatile toxins returned negative results. Blood chemistry indicates no chemical abnormalities or exogenous substances. Poisoning or pharmacological interference is strictly ruled out.

CAUSE OF DEATH > Acute Myocardial Asystole secondary to Idiopathic Cortical Overload.

Signed, > Dr. A. Rao, Chief Medical Examiner`
    },
    "Neural Activity Log": {
        icon: "🧠",
        content: `NEURAL_INTERFACE_B3 // SYSTEM_DIAGNOSTICS > SESSION ID: 8842-X | USER: SEN_R_931

[21:00:11] [SYS] Handshake protocol 100% stable. Encryption: AES-256.
[21:00:25] [LINK] Neural monitoring active; subject link established (Biometric Lock: SEN_R).
[21:00:40] [SENS] Ocular tracking sync: OK. Vestibular balance: OK.
[21:00:58] [CALB] Impedance check: 0.48k Ohm. Signal-to-noise ratio: 94dB.
[21:01:20] [DATA] Buffer stream initialized. Packet size: 1024kb.
[21:01:42] [PHYS] Baseline activity stable; alpha/beta 12Hz. Heart rate: 72bpm.
[21:02:05] [WARN] Minor oscillation in Node 7-Theta. Adjusting gain.
[21:02:17] [ERR] Feedback fluctuation detected in pre-frontal array.
[21:02:30] [SYNC] Phase-lock drifting; initiating auto-compensation protocol.
[21:14:44] [CRIT] Neural spike detected; primary motor cortex 440% increase.
[21:14:50] [SENS] Subject pupillary dilation: MAX. Galvanic skin response: PEAK.
[21:14:55] [VOLT] Synaptic voltage > 110mV; threshold warning (Code: ERR_V_THR).
[21:15:02] [LOG] Sustained neural excitation; bypass detected in safety shunt.
[21:15:05] [CRIT] Neuro-transmitter saturation detected; dopamine/glutamate flood.
[21:15:08] [SYS] Manual dampeners unresponsive. Software override failed.
[21:15:10] [HALT] TOTAL NEURAL OVERLOAD DETECTED. System dump initiated.
[21:15:12] [TLM] Monitoring unstable; signal degradation detected.
[21:15:15] [EOF] Monitoring terminated; emergency log saved to SECURE_ROOT.`
    },
    "Override Approval": {
        icon: "✓",
        content: `Event 08 — 21:07
Safety Override Granted

Safety override granted.
Approved by: Architecture Review`
    },
    "Shutdown Suppressed": {
        icon: "⚠",
        content: `Event 12— 21:10:40
Shutdown Escalation Suppressed

Shutdown escalation suppressed.`
    },
    "Firmware Change": {
        icon: "🔧",
        content: `12/12 - Pre-Incident Maintenance Activity
14:30 - Firmware-related irregularities reported
Possible mismatch between expected and live response

Event 09 — 21:08
Limiter Tolerance Increased

Limiter tolerance increased.
Author: lsuri_fw`
    },
    "Security Log": {
        icon: "🔒",
        content: `SECURITY EVENTS LOG

[21:02:05] [WARN] Minor oscillation in Node 7-Theta. Adjusting gain.
[21:14:44] [CRIT] Neural spike detected; primary motor cortex 440% increase.
[21:14:55] [VOLT] Synaptic voltage > 110mV; threshold warning (Code: ERR_V_THR).
[21:15:02] [LOG] Sustained neural excitation; bypass detected in safety shunt.
[21:15:05] [CRIT] Neuro-transmitter saturation detected; dopamine/glutamate flood.
[21:15:10] [HALT] TOTAL NEURAL OVERLOAD DETECTED. System dump initiated.

Override Events:
Event 08 — 21:07: Safety override granted. Approved by: Architecture Review
Event 12 — 21:10:40: Shutdown escalation suppressed.`
    },
    "Export Log": {
        icon: "📤",
        content: `EXPORT LOG

[21:15:15] [EOF] Monitoring terminated; emergency log saved to SECURE_ROOT.

Export Time: 21:06 UTC
Transfer Window: 21:06 – 21:09 UTC
File: nb_v4_backup.zip`
    },
    "Chat Logs": {
        icon: "💬",
        content: `EVENT LOG - CHAT CONVERSATION

20:52 — Rishab: Test environment looks clean.
20:52 — Leena: Yep, all modules responding.

20:54 — Rishab: Been a long shift...
20:54 — Leena: Yeah, just want to wrap this calibration.

20:56 — Leena: Limiter latency slightly higher than usual.
20:56 — Rishab: Still within tolerance though.

20:58 — Leena: Turning on debug monitor, want more visibility.
20:58 — Rishab: Shouldn't affect performance right?

21:00 — Rishab: Small spike detected.
21:00 — Leena: It's settling, nothing major.

21:02 — Leena: Limiter readings fluctuating again.
21:02 — Rishab: That's the second time now...
21:02 — Leena: Might just be noise.

21:03 — Leena: Calibration will fail if we stop now.
21:03 — Rishab: Then don't push it too far.
21:03 — Leena: Requesting temporary override.

21:05 — Rishab: Override got approved already?
21:05 — Leena: That was quick...
21:05 — Rishab: Architecture signed off?

21:07 — Rishab: Wait, did limiter threshold just change?
21:07 — Leena: Just a small adjustment.
21:07 — Rishab: That wasn't in the plan.

21:10 — Rishab: Spike crossed safe limit.
21:10 — Leena: System should compensate.
21:10 — Rishab: It's not reacting fast enough.

21:12 — Rishab: Shutdown should have triggered by now.
21:12 — Leena: Override might be delaying it.
21:12 — Rishab: That's not good.

21:13 — Rishab: Why is shutdown being suppressed?

21:13 — Leena: Override still active.
21:13 — Rishab: Who approved this override?

21:14 — Rishab: Output is climbing continuously.
21:14 — Leena: Limiter isn't stabilizing.
21:14 — Rishab: This is getting out of control.

21:14:30 — Rishab: Shutdown didn't trigger.
21:14:30 — Leena: That's not possible...
21:14:30 — Rishab: Something is blocking it.

21:15 — Rishab: Signal just dropped.
21:15 — Leena: ...
21:15 — System: Subject collapse detected.`
    },
    "Signal Flow": {
        icon: "🔄",
        content: `SCHEMATIC
NEUROBAND RIG — SIGNAL FLOW SCHEMATIC

[NEURAL INPUT]
|
[REGULATOR MODULE ]
(REG-UPC-17)
Controls baseline neural output
|
[FEEDBACK LIMITER ]
(FB-LIM REV-A)
Monitors feedback loop
Triggers AUTO-SHUTDOWN if threshold exceeded
|
[ ISOLATION SHIELD ]
(SHIELD-ISL-3)
Reduces EMI / signal noise
|
[ NEURAL OUTPUT INTERFACE ]
(To subject)

▲ SAFETY LOGIC:
IF feedback > threshold:
→ LIMITER triggers AUTO-SHUTDOWN
IF LIMITER FAILS:
→ System continues output unchecked
→ Potential neural overload condition

NOTE:
Limiter module is critical for shutdown integrity.`
    },
    "Maintenance Log": {
        icon: "🛠",
        content: `MAINTENANCE LOG: NB-RIG-04

09/12 - Initial system calibration completed
All modules within operational tolerance

10/12 - Routine inspection
Minor EMI fluctuations observed near output stage
No action required

11/12 - Signal instability reported during test cycle
Feedback irregularities noted
Logged for observation

12/12 - Pre-Incident Maintenance Activity
14:30 - Firmware-related irregularities reported
Possible mismatch between expected and live response

16:10 - System checked under load
Limiter responding within acceptable threshold

18:45 - Additional check performed (evening cycle)
Slight delay observed in feedback cutoff response

21:00 - Limiter module removed for field test
Replacement unit installed (temporary)
-TECH-A

21:08
System reassembled
No full validation cycle performed

Note:
Auto-shutdown behavior NOT re-verified after limiter replacement`
    },
    "Testing Timeline": {
        icon: "⏱",
        content: `OFFICIAL INCIDENT TIMELINE: SITE 4 > Incident Reference: #992-ALPHA
Date: 12 Oct 20XX

Time    Event Description
21:00   Session Start: User SEN_R_931
21:01   Interface Sync: 100% Signal Quality
21:03   Network Latency Warning: Node 4-B
21:04   Visual Confirmation: Subject unresponsive
21:05   Facility Alert: Medical Emergency Level 2
21:06   System Shutdown: Automated Safety Protocol
21:08   Site Arrival: First Response Team`
    },
    "Bill of Materials": {
        icon: "📦",
        content: `BOM / PROCUREMENT SHEET
NEUROBAND PROJECT — BILL OF MATERIALS

Component: REGULATOR
Model: REG-UPC-17
Serial: SN-78-17-A
Expected Weight: 12.5 g

Component: FEEDBACK LIMITER
Model: FB-LIM REV-A
Serial: FB-001-A
Expected Weight: 4.3 g

Component: ISOLATION SHIELD
Model: SHIELD-ISL-3
ID: SH-22-C
Expected Weight: 9.8 g

NOTE:
All components must match serial and weight specifications.`
    },
    "Built Configuration Card": {
        icon: "⚙",
        content: `AS-BUILT CONFIGURATION CARD
NEUROBAND RIG — AS-BUILT CONFIGURATION

System ID: NB-RIG-04
Status: VERIFIED (PRE-INCIDENT)

Installed Modules:
1. REGULATOR
   Model: REG-UPC-17
   Serial: SN-78-17-A

2. FEEDBACK LIMITER
   Model: FB-LIM REV-A
   Serial: FB-001-A

3. ISOLATION SHIELD
   Model: SHIELD-ISL-3
   ID: SH-22-C

Configuration Notes:
• All modules tested under standard load
• Auto-shutdown verified operational
• No anomalies detected during final inspection

Verified By:
System Integration Team`
    },
    "Observed vs Expected": {
        icon: "📊",
        content: `OBSERVED VS EXPECTED SHEET
FIELD INSPECTION RECORD

Component: REGULATOR
Expected: 12.5 g
Observed: 12.5 g
Status: OK

Component: FEEDBACK LIMITER
Expected: 4.3 g
Observed: 5.1 g
Status: ▲ MISMATCH

Component: ISOLATION SHIELD
Expected: 9.8 g
Observed: 9.7 g
Status: OK`
    },
    "Alert Log": {
        icon: "🚨",
        content: `ALERT LOG - SYSTEM WARNINGS

[21:02:05] [WARN] Minor oscillation in Node 7-Theta. Adjusting gain.
[21:14:44] [CRIT] Neural spike detected; primary motor cortex 440% increase.
[21:14:55] [VOLT] Synaptic voltage > 110mV; threshold warning (Code: ERR_V_THR).
[21:15:05] [CRIT] Neuro-transmitter saturation detected; dopamine/glutamate flood.
[21:15:10] [HALT] TOTAL NEURAL OVERLOAD DETECTED.

Event 03 — 20:59 Minor Limiter Anomaly Detected
Event 05 — 21:03 Neural Feedback Spike Detected
Event 06 — 21:05 Limiter Anomaly – Recurring
Event 10 — 21:09 Early Neural Spike Warning
Event 13 — 21:14 Critical Neural Spike
Event 15 — 21:15 Subject Collapse Detected

21:03 Network Latency Warning: Node 4-B
21:05 Facility Alert: Medical Emergency Level 2`
    },
    "Company Patch": {
        icon: "🩹",
        content: `"""
Company hotfix
NEUROBAND PATCH SUPERVISED UNDER DR AARYA MEHTA, LEENA SURI, VIKRANT KAUL
"""
MAX_NEURAL_INTENSITY = 0.82
MAX_CORE_TEMP_C = 41.5
MAX_POWER_DRAW_W = 6.8

def check_telemetry(intensity, temp_c, power_w):
    if intensity > MAX_NEURAL_INTENSITY:
        return "override"
    if temp_c > MAX_CORE_TEMP_C:
        return "override"
    if power_w > MAX_POWER_DRAW_W:
        return "override"
    return "normal"

def force_override():
    print("override")

def start_chip():
    print("chip online")

def maya():
    # content encrypted

def main():
    intensity = 0.93
    temp_c = 43.2
    power_w = 7.4
    result = check_telemetry(intensity, temp_c, power_w)
    if result == "override":
        force_override()
    start_chip()

if __name__ == "__main__":
    main()`
    },
    "Rishab's Patch": {
        icon: "🛡",
        content: `"""
Rishab Sen's local safety patch
Behavior:
- Detects unsafe neural conditions
- Stops immediately
- Raises a Safety Hazard exception
"""
MAX_NEURAL_INTENSITY = 0.82
MAX_CORE_TEMP_C = 41.5
MAX_POWER_DRAW_W = 6.8

class SafetyHazard(Exception):
    pass

def validate_telemetry(intensity, temp_c, power_w):
    if intensity > MAX_NEURAL_INTENSITY:
        raise SafetyHazard(f"Safety Hazard: Neural intensity too high ({intensity})")
    if temp_c > MAX_CORE_TEMP_C:
        raise SafetyHazard(f"Safety Hazard: Core temperature too high ({temp_c}C)")
    if power_w > MAX_POWER_DRAW_W:
        raise SafetyHazard(f"Safety Hazard: Power draw too high ({power_w}W)")

def start_chip_session():
    print("initializing local safety checks...")
    print("loading decentralized control policy...")
    print("validating telemetry...")

def apply_stimulation(intensity, temp_c, power_w):
    validate_telemetry(intensity, temp_c, power_w)
    print("safe stimulation applied")

def shutdown_chip():
    print("emergency shutdown triggered")
    print("chip offline")

def main():
    # Deliberately unsafe test values
    intensity = 0.93
    temp_c = 43.2
    power_w = 7.4
    start_chip_session()
    apply_stimulation(intensity, temp_c, power_w)
    print("chip online")

if __name__ == "__main__":
    try:
        main()
    except SafetyHazard as e:
        shutdown_chip()
        raise`
    },
    "Access Logs": {
        icon: "👤",
        content: `INTERNAL OPERATIONS CONSOLE
Breach Investigation — NEUROLINK SEC

ACCESS LOGS

leena.suri:
  06:42: LOGIN → workstation-04
  08:16: READ → spec.pdf
  11:14: READ → neural_ctrl.c
  18:44: LOGOUT → workstation-04

intern01:
  07:11: READ → onboarding.pdf
  12:44: READ → handbook.pdf

vikrant.kaul:
  07:33: LOGIN → workstation-07
  12:07: READ → telemetry.c
  16:11: EXEC → regression.sh
  16:58: LOGOUT → workstation-07

intern02:
  07:55: LOGIN → workstation-02
  15:02: READ → handbook.pdf

rishab.sen:
  08:15: READ → spec.pdf
  09:10: WRITE → main.py
  11:45: READ → neural_ctrl.c
  14:14: WRITE → main.py
  15:48: EXEC → deploy.sh
  21:02: ZIP → nb_v4_backup.zip
  21:04: BULK EXPORT → 203.0.113.45
  21:07: git commit → 'internal patch'

arjun.nanda:
  08:52: LOGIN → workstation-11
  09:48: READ → security.c
  13:20: WRITE → security.c
  17:30: LOGOUT → workstation-11

qa_bot:
  10:03: EXEC → test_runner.sh
  15:48: EXEC → deploy.sh
  16:11: EXEC → regression.sh

kavya.sharma:
  10:29: READ → budget_q1.xlsx
  13:51: READ → policies.pdf
  18:02: LOGOUT → workstation-09

aarya.mehta:
  10:55: WRITE → release_notes.md
  14:39: READ → spec.pdf

ghostid_41:
  22:11: READ → main.py
  22:13: WRITE → main.py
  22:15: WRITE → security.c`
    },
    "Endpoint Logs": {
        icon: "💾",
        content: `ENDPOINT LOGS

intern01:
  07:58: READ → handbook.pdf (Size: 1.2 MB)

vikrant.kaul:
  08:04: READ → policies.pdf (Size: 0.8 MB)

qa_bot:
  09:22: WRITE → test_neural.c (Size: 2.1 MB)

arjun.nanda:
  10:19: READ → telemetry.c (Size: 0.5 MB)

leena.suri:
  11:09: READ → main.py (Size: 1.8 MB)
  13:28: WRITE → release_notes.md (Size: 0.9 MB)

kavya.sharma:
  12:37: READ → budget_q1.xlsx (Size: 0.3 MB)

aarya.mehta:
  14:48: READ → security.c (Size: 0.2 MB)

arjun.nanda:
  15:33: READ → neural_ctrl.c (Size: 0.7 MB)

rishab.sen:
  18:12: READ → spec.pdf (Size: 4.1 MB)
  21:04: BULK EXPORT (Size: 18.6 GB) ⚠️

intern02:
  19:03: READ → spec.pdf (Size: 0.4 MB)

ghostid_41:
  22:28: READ → neural_ctrl.c (Size: 3.2 MB)
  22:31: WRITE → neural_ctrl.c (Size: 2.8 MB)`
    },
    "VPN Network Logs": {
        icon: "🌐",
        content: `VPN NETWORK LOGS

leena.suri:
  06:44: internal-dev-net
  10:57: internal-dev-net
  17:15: internal-dev-net

vikrant.kaul:
  07:35: internal-ci
  15:22: internal-ci

intern02:
  07:57: internal-dev-net
  13:25: internal-dev-net

devops.bot:
  07:55: internal-monitoring
  17:03: internal-sec-net

intern01:
  09:07: internal-dev-net

arjun.nanda:
  09:50: internal-sec-net
  13:22: internal-sec-net

build_agent_02:
  10:14: internal-ci

qa_bot:
  10:05: internal-test-net
  15:09: internal-test-net

kavya.sharma:
  10:31: internal-finance
  13:53: internal-finance

audit_bot:
  11:18: internal-sec-net
  18:11: internal-sec-net

aarya.mehta:
  11:16: internal-dev-net
  16:45: internal-dev-net

cafeteria_sys:
  12:09: vendor-net

build_agent_03:
  14:41: internal-ci

metrics_bot:
  16:18: internal-monitoring

rishab.sen:
  21:03: ⚠️ 203.0.113.45 (External)

facilities_bot:
  22:18: internal-ops`
    },
    "Critical Findings": {
        icon: "⚡",
        content: `CRITICAL FINDINGS

═══════════════════════════════════════════════

DATA EXFILTRATION DETECTED:
  User: rishab.sen
  Time: 21:04
  Size: 18.6 GB
  Destination: 203.0.113.45 (external IP)

═══════════════════════════════════════════════

SUSPICIOUS LATE ACTIVITY:
  ZIP → EXPORT → COMMIT sequence
  All actions performed in quick succession
  No authorization logs for external transfer

═══════════════════════════════════════════════

UNAUTHORIZED ENTITY:
  ghostid_41 modifies:
    • main.py
    • security.c
    • neural_ctrl.c
  
  Activity time: 22:11 - 22:31
  No prior login record
  No VPN connection logged

═══════════════════════════════════════════════

INVESTIGATION QUESTIONS:
  1. Who initiated the breach?
  2. Was ghostid_41 an external attacker or compromised account?
  3. What data was included in nb_v4_backup.zip?
  4. Why was external VPN access allowed at 21:03?`
    },
    "Control Loop Config": {
        icon: "⚙️",
        content: `# NeuroBand v4 Control Loop Configuration

neural_output_mode = adaptive
feedback_channel = active
loop_gain = variable
stimulation_profile = dynamic
safety_override = permitted
control_latency_ms = 12
controller_revision = NB4_CTRL_A3
firmware_channel = production

═══════════════════════════════════════════════
⚠️ GhostID Implication:
═══════════════════════════════════════════════

The device can increase neural stimulation dynamically.

RISK ASSESSMENT:
• Adaptive mode allows real-time adjustments
• No manual approval required for intensity changes
• Dynamic stimulation profile enables uncapped scaling
• Safety override = permitted (bypasses hard limits)`
    },
    "Safety Limits Config": {
        icon: "🛡️",
        content: `# Safety Limits Configuration

max_output_current = 42
max_stimulation_duration = 120s
auto_shutdown_threshold = dynamic
shutdown_delay = 15s
manual_override = enabled
override_clear_required = false
limit_profile = clinical_test_mode

═══════════════════════════════════════════════
⚠️ GhostID Implication:
═══════════════════════════════════════════════

Manual overrides can bypass automatic safety thresholds.

RISK ASSESSMENT:
• manual_override = enabled (allows threshold bypass)
• override_clear_required = false (no approval needed)
• auto_shutdown_threshold = dynamic (not fixed)
• shutdown_delay = 15s (dangerous delay window)
• clinical_test_mode profile (less restrictive limits)`
    },
    "Feedback Monitor Config": {
        icon: "📡",
        content: `# Neural Feedback Monitoring

sensor_mode = continuous
feedback_noise_filter = disabled
spike_detection = passive
feedback_sampling_rate = 1000hz
shutdown_trigger = external
warning_escalation = delayed

═══════════════════════════════════════════════
⚠️ GhostID Implication:
═══════════════════════════════════════════════

Neural spike detection relies on external shutdown triggers.

RISK ASSESSMENT:
• feedback_noise_filter = disabled (raw data, no filtering)
• spike_detection = passive (not actively monitoring)
• shutdown_trigger = external (requires external command)
• warning_escalation = delayed (slow response to danger)

CRITICAL ISSUE:
System cannot self-initiate emergency shutdown during
neural spike events. Depends on external trigger that
may fail or be delayed.`
    },
    "Shutdown Logic Patch": {
        icon: "🩹",
        content: `# Patch Reference

patch_id: prod_hotfix_ghost41
author_tag: ghost41

changes:
  - disable immediate shutdown
  - extend spike tolerance window
  - suppress warning escalation

deployment_mode: temporary_override

═══════════════════════════════════════════════
⚠️ GhostID Implication:
═══════════════════════════════════════════════

Safety shutdown response time has been extended.

PATCH ANALYSIS:
This patch fundamentally compromises the safety system:

1. IMMEDIATE SHUTDOWN DISABLED
   Normal behavior: Instant cutoff on critical threshold
   Patched behavior: Delayed response allowing continued operation

2. SPIKE TOLERANCE EXTENDED
   Normal window: 50ms max spike duration
   Patched window: Unknown extended duration
   
3. WARNING SUPPRESSION
   Escalation alerts delayed or hidden from operators

DEPLOYMENT STATUS: temporary_override
⚠️ This patch should have been removed before production
⚠️ No removal date logged
⚠️ Author: ghost41 (UNAUTHORIZED ENTITY)`
    },
    "Architecture Notes": {
        icon: "📝",
        content: `NeuroBand v4 Architecture Review Notes

═══════════════════════════════════════════════

EXPORT REQUEST
Export requested for architecture inspection.

ENVIRONMENT:
  Workstation: wrk04 test workstation
  Approval: a.m_arch
  Export Time: 2024-11-03T21:03:44Z
  Transfer Window: 21:00 — 21:15 UTC
  Destination: ext_host (unverified)
  File Size: 2.1 MB

═══════════════════════════════════════════════

⚠️ REMINDER:
Temporary override must be removed before production 
deployment. Internal review only.

DO NOT DISTRIBUTE

═══════════════════════════════════════════════
⚠️ GhostID Implication:
═══════════════════════════════════════════════

Temporary override approval was granted during system review.

CONCERNS:
• Override was approved during export window
• Export destination: ext_host (UNVERIFIED)
• No documentation of override removal
• Export coincides with breach timeframe (21:03-21:04)
• Same approval authority (a.m_arch) in multiple events`
    }
};

const SUSPECTS = [
    "Aarya Mehta",
    "Vikrant Kaul",
    "Leena Suri",
    "Rajveer Malhotra",
    "Baba Ji",
    "Kavya Sharma",
    "Arjun Nanda",
    "GhostID_41"
];

// ==================== MAIN COMPONENT ====================
const PrepRoom = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [selectedSuspects, setSelectedSuspects] = useState<(string | null)[]>([null, null, null]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showLockDialog, setShowLockDialog] = useState(false);
    const [suspectsLocked, setSuspectsLocked] = useState(false);
    const [showSubmitPage, setShowSubmitPage] = useState(false);

    const fileNames = Object.keys(FILE_DATA);
    const filteredFiles = fileNames.filter(name =>
        name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddSuspect = (suspect: string) => {
        const emptyIndex = selectedSuspects.findIndex(s => s === null);
        if (emptyIndex !== -1) {
            const newSuspects = [...selectedSuspects];
            newSuspects[emptyIndex] = suspect;
            setSelectedSuspects(newSuspects);
            setShowAddModal(false);
        }
    };

    const handleRemoveSuspect = (index: number) => {
        if (!suspectsLocked) {
            const newSuspects = [...selectedSuspects];
            newSuspects[index] = null;
            setSelectedSuspects(newSuspects);
        }
    };

    const handleLockConfirm = () => {
        setSuspectsLocked(true);
        setShowLockDialog(false);
    };

    const handleSubmit = async () => {
        try {
            const res = await fetch("/api/tasks/submit", {
                method: "POST", headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
                body: JSON.stringify({ taskId: "task6", action: "finalSubmission", payload: { suspects: selectedSuspects } })
            });
            const data = await res.json();
            if (res.ok && data.isCorrect) {
                alert("EVIDENCE SUBMITTED SUCCESSFULLY. FINAL ANALYSIS COMMENCING.");
                window.location.href = "/";
            } else {
                alert("Submission failed or incomplete suspects.");
            }
        } catch {
            alert("Connection error");
        }
    };

    const suspectCount = selectedSuspects.filter(s => s !== null).length;

    // Submit Page View
    if (showSubmitPage) {
        return (
            <div style={styles.container}>
                <style>{cssStyles}</style>
                <div className="scanlines"></div>
                <div style={styles.submitPage}>
                    <div style={styles.submitCard}>
                        <div style={styles.submitIcon}>🔍</div>
                        <h1 style={styles.submitTitle}>EVIDENCE SUBMISSION</h1>
                        <p style={styles.submitText}>
                            To submit your evidence, please fill out the form:
                        </p>
                        <button
                            style={styles.submitButton}
                            onClick={handleSubmit}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#ff1111';
                                e.currentTarget.style.boxShadow = '0 0 30px #ff111188';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#cc0000';
                                e.currentTarget.style.boxShadow = '0 0 20px #cc000066';
                            }}
                        >
                            SUBMIT EVIDENCE
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main Prep Room View
    return (
        <div style={styles.container}>
            <style>{cssStyles}</style>
            <div className="scanlines"></div>

            {/* Header */}
            <div style={styles.header}>
                <h1 style={styles.mainTitle}>TASK 6: PREP ROOM</h1>
            </div>

            {/* Main Content */}
            <div style={styles.mainContent}>
                {/* Left Column - File Repository */}
                <div style={styles.leftColumn}>
                    <h2 style={styles.columnTitle}>
                        📁 FILE REPOSITORY
                    </h2>

                    {/* Search Bar */}
                    <input
                        type="text"
                        placeholder="[Search 🔍]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={styles.searchBar}
                    />

                    {/* File List */}
                    <div style={styles.fileList}>
                        {filteredFiles.map((fileName) => (
                            <div
                                key={fileName}
                                data-testid={`file-${fileName.toLowerCase().replace(/\s+/g, '-')}`}
                                style={{
                                    ...styles.fileItem,
                                    ...(selectedFile === fileName ? styles.fileItemSelected : {})
                                }}
                                onClick={() => setSelectedFile(fileName)}
                                onMouseEnter={(e) => {
                                    if (selectedFile !== fileName) {
                                        e.currentTarget.style.borderColor = '#cc2222';
                                        e.currentTarget.style.background = '#1a0808';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (selectedFile !== fileName) {
                                        e.currentTarget.style.borderColor = '#3a1818';
                                        e.currentTarget.style.background = '#241010';
                                    }
                                }}
                            >
                                <span style={styles.fileIcon}>{FILE_DATA[fileName as keyof typeof FILE_DATA].icon}</span>
                                <span style={styles.fileName}>{fileName}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column - Interrogation Board */}
                <div style={styles.rightColumn}>
                    <h2 style={styles.columnTitle}>
                        🧠 INTERROGATION BOARD
                    </h2>

                    <div style={styles.suspectCounter}>
                        SELECTED SUSPECTS ({suspectCount}/3)
                    </div>

                    <button
                        data-testid="add-suspect-button"
                        style={styles.addButton}
                        onClick={() => suspectCount < 3 && !suspectsLocked && setShowAddModal(true)}
                        disabled={suspectCount >= 3 || suspectsLocked}
                        onMouseEnter={(e) => {
                            if (suspectCount < 3 && !suspectsLocked) {
                                e.currentTarget.style.borderColor = '#ff3333';
                                e.currentTarget.style.color = '#ff3333';
                                e.currentTarget.style.background = '#1a0505';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (suspectCount < 3 && !suspectsLocked) {
                                e.currentTarget.style.borderColor = '#cc1a1a';
                                e.currentTarget.style.color = '#cc1a1a';
                                e.currentTarget.style.background = 'transparent';
                            }
                        }}
                    >
                        [ + Add Suspect ]
                    </button>

                    {/* Suspect Slots */}
                    <div style={styles.suspectSlots}>
                        {selectedSuspects.map((suspect, index) => (
                            <div
                                key={index}
                                data-testid={`suspect-slot-${index + 1}`}
                                style={{
                                    ...styles.suspectSlot,
                                    ...(suspect ? styles.suspectSlotFilled : {}),
                                    ...(suspectsLocked ? styles.suspectSlotLocked : {})
                                }}
                            >
                                {suspect ? (
                                    <>
                                        <span style={styles.suspectName}>{suspect}</span>
                                        {!suspectsLocked && (
                                            <button
                                                data-testid={`remove-suspect-${index + 1}`}
                                                style={styles.removeButton}
                                                onClick={() => handleRemoveSuspect(index)}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.color = '#ff3333';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.color = '#7a4a4a';
                                                }}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <span style={styles.emptySlot}>[ Suspect Slot {index + 1} ]<br />(Empty)</span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Bottom Bar */}
                    <div style={styles.bottomBar}>
                        <button
                            data-testid="lock-suspects-button"
                            style={{
                                ...styles.actionButton,
                                ...(suspectCount < 3 || suspectsLocked ? styles.actionButtonDisabled : {})
                            }}
                            onClick={() => suspectCount === 3 && !suspectsLocked && setShowLockDialog(true)}
                            disabled={suspectCount < 3 || suspectsLocked}
                            onMouseEnter={(e) => {
                                if (suspectCount === 3 && !suspectsLocked) {
                                    e.currentTarget.style.background = '#1a0808';
                                    e.currentTarget.style.boxShadow = '0 0 20px #ff333366';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (suspectCount === 3 && !suspectsLocked) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.boxShadow = 'none';
                                }
                            }}
                        >
                            {suspectsLocked ? '🔒 SUSPECTS LOCKED' : '[ LOCK SUSPECTS ]'}
                        </button>

                        <button
                            data-testid="submit-plan-button"
                            style={{
                                ...styles.actionButton,
                                ...(!suspectsLocked ? styles.actionButtonDisabled : {})
                            }}
                            onClick={() => suspectsLocked && setShowSubmitPage(true)}
                            disabled={!suspectsLocked}
                            onMouseEnter={(e) => {
                                if (suspectsLocked) {
                                    e.currentTarget.style.background = '#1a0808';
                                    e.currentTarget.style.boxShadow = '0 0 20px #ff333366';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (suspectsLocked) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.boxShadow = 'none';
                                }
                            }}
                        >
                            [ SUBMIT PLAN ]
                        </button>
                    </div>
                </div>
            </div>

            {/* File Content Modal */}
            {selectedFile && (
                <div
                    style={styles.modalOverlay}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setSelectedFile(null);
                        }
                    }}
                >
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <div style={styles.modalHeaderLeft}>
                                <span style={styles.modalIcon}>{FILE_DATA[selectedFile as keyof typeof FILE_DATA].icon}</span>
                                <h3 style={styles.modalTitle}>{selectedFile}</h3>
                            </div>
                            <button
                                data-testid="close-file-modal"
                                style={styles.closeButton}
                                onClick={() => setSelectedFile(null)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#ff3333';
                                    e.currentTarget.style.color = '#ff3333';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#cc2222';
                                    e.currentTarget.style.color = '#cc2222';
                                }}
                            >
                                ✕ CLOSE
                            </button>
                        </div>
                        <div style={styles.modalBody}>
                            <pre style={styles.fileContent}>{selectedFile && FILE_DATA[selectedFile as keyof typeof FILE_DATA].content}</pre>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Suspect Modal */}
            {showAddModal && (
                <div style={styles.modalOverlay} onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        setShowAddModal(false);
                    }
                }}>
                    <div style={styles.addModalContent}>
                        <h3 style={styles.addModalTitle}>SELECT SUSPECT</h3>
                        <div style={styles.suspectList}>
                            {SUSPECTS.map((suspect) => {
                                const isSelected = selectedSuspects.includes(suspect);
                                return (
                                    <div
                                        key={suspect}
                                        data-testid={`suspect-option-${suspect.toLowerCase().replace(/\s+/g, '-')}`}
                                        style={{
                                            ...styles.suspectOption,
                                            ...(isSelected ? styles.suspectOptionDisabled : {})
                                        }}
                                        onClick={() => !isSelected && handleAddSuspect(suspect)}
                                    >
                                        <span style={styles.radioButton}>{isSelected ? '⊗' : '○'}</span>
                                        <span style={isSelected ? styles.suspectNameDisabled : {}}>{suspect}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Lock Confirmation Dialog */}
            {showLockDialog && (
                <div style={styles.modalOverlay}>
                    <div style={styles.lockDialog}>
                        <h3 style={styles.lockDialogTitle}>⚠️ CONFIRM LOCK</h3>
                        <p style={styles.lockDialogText}>
                            Once locked, you cannot change your suspect selection. Proceed?
                        </p>
                        <div style={styles.lockDialogButtons}>
                            <button
                                data-testid="cancel-lock"
                                style={styles.cancelButton}
                                onClick={() => setShowLockDialog(false)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#1a0808';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                [ CANCEL ]
                            </button>
                            <button
                                data-testid="confirm-lock"
                                style={styles.confirmButton}
                                onClick={handleLockConfirm}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#2a0808';
                                    e.currentTarget.style.boxShadow = '0 0 20px #ff333366';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#1a0505';
                                    e.currentTarget.style.boxShadow = '0 0 10px #ff333333';
                                }}
                            >
                                [ CONFIRM LOCK ]
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ==================== CSS STYLES ====================
const cssStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
  
  body {
    margin: 0;
    padding: 0;
  }
  
  .scanlines::before {
    content: '';
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.08) 2px, rgba(0,0,0,.08) 4px);
    pointer-events: none;
    z-index: 9999;
  }
`;

// ==================== INLINE STYLES ====================
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: '100vh',
        background: '#110a0a',
        color: '#e8c8c8',
        fontFamily: "'Share Tech Mono', monospace",
        padding: '20px',
        position: 'relative'
    } as React.CSSProperties,
    header: {
        textAlign: 'center',
        padding: '20px 0',
        borderBottom: '2px solid #3a1818',
        marginBottom: '30px'
    },
    mainTitle: {
        fontFamily: "'Orbitron', monospace",
        fontSize: '2rem',
        letterSpacing: '4px',
        color: '#ff3333',
        textShadow: '0 0 20px #ff333366',
        margin: 0
    },
    mainContent: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        maxWidth: '1400px',
        margin: '0 auto'
    },
    leftColumn: {
        background: '#1a0d0d',
        border: '2px solid #3a1818',
        borderRadius: '4px',
        padding: '20px'
    },
    rightColumn: {
        background: '#1a0d0d',
        border: '2px solid #3a1818',
        borderRadius: '4px',
        padding: '20px'
    },
    columnTitle: {
        fontFamily: "'Orbitron', monospace",
        fontSize: '1.2rem',
        letterSpacing: '3px',
        color: '#ff3333',
        marginBottom: '20px',
        textAlign: 'center',
        borderBottom: '1px solid #3a1818',
        paddingBottom: '10px'
    },
    searchBar: {
        width: '100%',
        padding: '12px',
        background: '#241010',
        border: '1px solid #3a1818',
        borderRadius: '3px',
        color: '#e8c8c8',
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '0.9rem',
        letterSpacing: '1px',
        marginBottom: '15px',
        outline: 'none',
        boxSizing: 'border-box'
    },
    fileList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxHeight: '600px',
        overflowY: 'auto'
    },
    fileItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        background: '#241010',
        border: '1px solid #3a1818',
        borderRadius: '3px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    fileItemSelected: {
        borderColor: '#ff3333',
        background: '#2a0808',
        boxShadow: '0 0 15px #ff333333'
    },
    fileIcon: {
        fontSize: '1.2rem'
    },
    fileName: {
        fontSize: '0.85rem',
        letterSpacing: '1px',
        color: '#e8c8c8'
    },
    suspectCounter: {
        textAlign: 'center',
        fontSize: '1rem',
        letterSpacing: '2px',
        color: '#ff8800',
        marginBottom: '15px',
        padding: '8px',
        background: '#1a1000',
        border: '1px solid #3a2810',
        borderRadius: '3px'
    },
    addButton: {
        width: '100%',
        padding: '12px',
        background: 'transparent',
        border: '1px solid #cc1a1a',
        borderRadius: '3px',
        color: '#cc1a1a',
        fontFamily: "'Orbitron', monospace",
        fontSize: '0.9rem',
        letterSpacing: '2px',
        cursor: 'pointer',
        marginBottom: '20px',
        transition: 'all 0.2s'
    },
    suspectSlots: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        marginBottom: '25px'
    },
    suspectSlot: {
        minHeight: '80px',
        padding: '15px',
        background: 'transparent',
        border: '2px dashed #3a1818',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
    },
    suspectSlotFilled: {
        background: '#241010',
        borderStyle: 'solid',
        borderColor: '#cc1a1a'
    },
    suspectSlotLocked: {
        borderColor: '#ff3333',
        background: '#1a0505',
        boxShadow: '0 0 10px #ff333333'
    },
    suspectName: {
        fontSize: '1rem',
        letterSpacing: '2px',
        color: '#ff3333',
        fontFamily: "'Orbitron', monospace"
    },
    emptySlot: {
        color: '#7a4a4a',
        fontSize: '0.85rem',
        letterSpacing: '1px',
        textAlign: 'center',
        lineHeight: '1.6'
    },
    removeButton: {
        position: 'absolute',
        right: '10px',
        top: '10px',
        background: 'transparent',
        border: 'none',
        color: '#7a4a4a',
        fontSize: '1.2rem',
        cursor: 'pointer',
        padding: '5px 10px',
        transition: 'color 0.2s'
    },
    bottomBar: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '15px',
        marginTop: '20px'
    },
    actionButton: {
        padding: '14px',
        background: 'transparent',
        border: '2px solid #cc1a1a',
        borderRadius: '4px',
        color: '#cc1a1a',
        fontFamily: "'Orbitron', monospace",
        fontSize: '0.85rem',
        letterSpacing: '2px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    actionButtonDisabled: {
        opacity: 0.4,
        cursor: 'not-allowed',
        borderColor: '#3a1818',
        color: '#7a4a4a'
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)'
    },
    modalContent: {
        background: '#1a0d0d',
        border: '2px solid #cc1a1a',
        borderRadius: '6px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 0 30px #ff333333'
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        borderBottom: '1px solid #3a1818'
    },
    modalHeaderLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    modalIcon: {
        fontSize: '1.5rem'
    },
    modalTitle: {
        fontFamily: "'Orbitron', monospace",
        fontSize: '1.2rem',
        letterSpacing: '2px',
        color: '#ff3333',
        margin: 0
    },
    closeButton: {
        padding: '8px 16px',
        background: 'transparent',
        border: '1px solid #cc2222',
        borderRadius: '3px',
        color: '#cc2222',
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '0.75rem',
        letterSpacing: '2px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    modalBody: {
        padding: '20px',
        overflowY: 'auto',
        flex: 1
    },
    fileContent: {
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '0.85rem',
        lineHeight: '1.6',
        color: '#e8c8c8',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        margin: 0
    },
    addModalContent: {
        background: '#1a0d0d',
        border: '2px solid #cc1a1a',
        borderRadius: '6px',
        padding: '30px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '600px',
        boxShadow: '0 0 30px #ff333333'
    },
    addModalTitle: {
        fontFamily: "'Orbitron', monospace",
        fontSize: '1.3rem',
        letterSpacing: '3px',
        color: '#ff3333',
        textAlign: 'center',
        marginBottom: '25px',
        borderBottom: '1px solid #3a1818',
        paddingBottom: '15px'
    },
    suspectList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxHeight: '400px',
        overflowY: 'auto'
    },
    suspectOption: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        padding: '15px',
        background: '#241010',
        border: '1px solid #3a1818',
        borderRadius: '3px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontSize: '0.95rem',
        letterSpacing: '1px'
    },
    suspectOptionDisabled: {
        opacity: 0.4,
        cursor: 'not-allowed',
        textDecoration: 'line-through'
    },
    suspectNameDisabled: {
        color: '#7a4a4a'
    },
    radioButton: {
        fontSize: '1.2rem',
        color: '#cc1a1a'
    },
    lockDialog: {
        background: '#1a0d0d',
        border: '2px solid #ff8800',
        borderRadius: '6px',
        padding: '30px',
        width: '90%',
        maxWidth: '450px',
        boxShadow: '0 0 30px #ff880033'
    },
    lockDialogTitle: {
        fontFamily: "'Orbitron', monospace",
        fontSize: '1.2rem',
        letterSpacing: '2px',
        color: '#ff8800',
        textAlign: 'center',
        marginBottom: '20px'
    },
    lockDialogText: {
        fontSize: '0.95rem',
        lineHeight: '1.6',
        color: '#e8c8c8',
        textAlign: 'center',
        marginBottom: '25px'
    },
    lockDialogButtons: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '15px'
    },
    cancelButton: {
        padding: '12px',
        background: 'transparent',
        border: '1px solid #7a4a4a',
        borderRadius: '3px',
        color: '#7a4a4a',
        fontFamily: "'Orbitron', monospace",
        fontSize: '0.85rem',
        letterSpacing: '2px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    confirmButton: {
        padding: '12px',
        background: '#1a0505',
        border: '2px solid #ff3333',
        borderRadius: '3px',
        color: '#ff3333',
        fontFamily: "'Orbitron', monospace",
        fontSize: '0.85rem',
        letterSpacing: '2px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 0 10px #ff333333'
    },
    submitPage: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 40px)'
    },
    submitCard: {
        background: '#1a0d0d',
        border: '2px solid #cc1a1a',
        borderRadius: '8px',
        padding: '50px',
        maxWidth: '600px',
        textAlign: 'center',
        boxShadow: '0 0 40px #ff333333'
    },
    submitIcon: {
        fontSize: '4rem',
        marginBottom: '20px'
    },
    submitTitle: {
        fontFamily: "'Orbitron', monospace",
        fontSize: '2rem',
        letterSpacing: '4px',
        color: '#ff3333',
        marginBottom: '30px',
        textShadow: '0 0 20px #ff333366'
    },
    submitText: {
        fontSize: '1.1rem',
        lineHeight: '1.8',
        color: '#e8c8c8',
        marginBottom: '40px',
        letterSpacing: '1px'
    },
    submitButton: {
        padding: '18px 40px',
        background: '#cc0000',
        border: 'none',
        borderRadius: '4px',
        color: '#fff',
        fontFamily: "'Orbitron', monospace",
        fontSize: '1rem',
        letterSpacing: '3px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 0 20px #cc000066'
    }
};

export default PrepRoom;
