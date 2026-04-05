'use client'
import React, { useState } from 'react';
import { StaticImageData } from 'next/image';
import systemInspection1 from './system_inspection_1.jpg';
import systemInspection2 from './system_inspection_2.jpg';

// ==================== FILE SECTIONS ====================
const FILE_SECTIONS: { title: string; icon: string; files: string[] }[] = [
    {
        title: "Interrogation Records",
        icon: "🎙️",
        files: [
            "Interrogation: Vikrant Kaul",
            "Interrogation: Dr. Aarya Mehta",
            "Interrogation: Leena Suri",
            "Interrogation: Baba",
            "Interrogation: Rajveer Malhotra",
            "Interrogation: Kavya Sharma",
            "Interrogation: Arjun Nanda"
        ]
    },
    {
        title: "Hardware Tampering",
        icon: "🔩",
        files: [
            "Signal Flow", "Maintenance Log", "Bill of Materials", "Built Configuration Card",
            "Observed vs Expected",
            "Access Ledger", "System Inspection Snapshot"
        ]
    },
    {
        title: "Collected Evidence",
        icon: "📂",
        files: [
            "Autopsy Report", "Neural Activity Log", "Override Approval", "Shutdown Suppressed",
            "Firmware Change", "Security Log", "Export Log", "Chat Logs", "Testing Timeline",
            "Alert Log", "Access Logs", "Endpoint Logs", "VPN Network Logs", "Critical Findings",
            "Architecture Notes", "Badge & Door Logs", "Cold Storage Environment",
            "Company Patch", "Rishab's Patch",
            "Control Loop Config", "Safety Limits Config", "Feedback Monitor Config", "Shutdown Logic Patch"
        ]
    }
];

// ==================== FILE DATA ====================
const FILE_DATA: { [key: string]: { icon: string; content: string; images?: StaticImageData[] } } = {
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
    },
    "Badge & Door Logs": {
        icon: "🚪",
        content: `BADGE & DOOR LOGS — LAB 7 ACCESS RECORDS
TIMESTAMP	EMPLOYEE ID	NAME	LOCATION	STATUS
20:12:04	EMP-034	Vikrant Kaul	Lab 7	ENTRY
20:44:18	EMP-034	Vikrant Kaul	Lab 7	EXIT
21:18:42	SEC-02	Sec_Officer_02	Lab 7	ENTRY
21:22:10	SEC-02	Sec_Officer_02	Lab 7	EXIT
21:31:07	EMP-034	Vikrant Kaul	Lab 6	ENTRY
21:36:22	EMP-034	Vikrant Kaul	Lab 6	EXIT
21:44:58	EMP-019	Rishab Sen	Lab 7	ENTRY
21:51:30	SEC-02	Sec_Officer_02	Main Gate	EXIT
22:03:14	EMP-034	Vikrant Kaul	Lab 5	ENTRY
22:09:02	EMP-034	Vikrant Kaul	Lab 5	EXIT`
    },
    "Cold Storage Environment": {
        icon: "❄️",
        content: `COLD STORAGE ENVIRONMENT
B3 ENVIRONMENTAL CONTROL LOG
21:48–22:03
TIMESTAMP	EVENT TYPE	DETAIL
21:48:11	SYS_INIT	Cold Storage B3 environmental controller online
21:48:18	TEMP_READ	Chamber temperature: 5.6°C
21:48:25	TEMP_CONTROL	Cooling cycle active
21:49:03	ACCESS_IDLE	Door sealed
21:49:44	SENSOR_STATUS	Internal humidity stable
21:50:12	INVENTORY_SCAN	Rack occupancy unchanged
21:50:55	POWER_MONITOR	Auxiliary backup active
21:51:27	TEMP_READ	Chamber temperature: 5.1°C
21:52:04	ACCESS_IDLE	No authorized entry
21:52:48	TEMP_CONTROL	Cooling maintained
21:53:12	SENSOR_STATUS	Intake zone clear
21:54:09	ELEVATOR_LINK	Elevator B inbound event registered
21:54:33	PREP_MODE	Intake channel activated
21:55:02	ACCESS_PENDING	Awaiting transfer authorization
21:55:31	DOOR_UNLOCK	Internal transfer clearance accepted
21:56:04	DOOR_OPEN	Cold Storage B3 access event
21:56:19	TEMP_DROP	Chamber fluctuation detected: 4.8°C
21:56:42	INTAKE_EVENT	New intake registered
21:57:03	DOOR_CLOSE	Chamber sealed
21:57:26	TEMP_CONTROL	Rapid stabilization initiated
21:58:11	TEMP_READ	Chamber temperature: 4.3°C
21:58:47	SENSOR_STATUS	Internal load changed
21:59:15	STORAGE_VERIFY	Rack occupancy updated
21:59:48	TEMP_CONTROL	Stable hold mode active
22:00:11	CHAMBER_STATUS	4.0°C hold achieved
22:00:33	ACCESS_LOCK	Manual entry disabled
22:01:06	SYSTEM_NOTE	Preserve environmental stability
22:01:44	INVENTORY_SYNC	Restricted item record updated
22:02:15	AUDIT_FLAG	Internal visibility limited
22:03:02	STATUS_LOCK	Modification requires clearance`
    },
    "Interrogation: Vikrant Kaul": {
        icon: "🎙️",
        content: `SUSPECT 1: VIKRANT KAUL
Director of Security & Compliance
Behavior: Defensive, aggressive

INTERROGATION RECORD

Q: What was your relationship with Rishab Sen?
A: Relationship? Haan tha… kaam ka. Previous firm mein junior tha mera. But he started poking his nose where it didn't belong. Bohot sawal karta tha… unnecessarily.

Q: Did you have any conflict with him recently?
A: Conflict? Dekho… argument hua tha. He accused me of something from past… jo prove nahi kar paya. And I don't like being questioned like that.

Q: Did you physically assault him?
A: Main haath utha sakta hoon… par reason hona chahiye. Us din bas warning di thi. Maar deta toh yeh interrogation hota hi nahi.

Q: What unethical thing did Rishab know about you?
A: Sab log thoda bahut compromise karte hain. Industry clean nahi hai. But jo bhi tha… irrelevant hai iss case mein.

Q: Where were you during the incident?
A: Security logs check kar lo. Main building mein tha… par crime scene pe nahi.

Q: What do you think about NeuroBand issues?
A: Product unstable hai… aur log chupana chahte hain. Bas.

Q: Do you believe in spirituality?
A: Seriously? Yeh poochne aaye ho?`
    },
    "Interrogation: Dr. Aarya Mehta": {
        icon: "🎙️",
        content: `SUSPECT 2: DR. AARYA MEHTA
Chief Neuro-Architect / Design Lead
Behavior: Controlled, calculated

INTERROGATION RECORD

Q: What did Rishab discover about NeuroBand?
A: Rishab raised concerns, not discoveries. Preliminary observations… nothing validated.

Q: What is the 'bias layer'?
A: Bias layer is a calibration module. It aligns neural outputs. It is not harmful per se.

Q: Did Rishab threaten your career?
A: I wouldn't call it a threat. But premature disclosures could damage the company… and yes, reputations.

Q: Did you contact anyone after speaking to Rishab?
A: I may have consulted… external advisors. That is standard protocol.

Q: Who are these advisors?
A: I'm not obligated to disclose personal consultations.

Q: What is your relation with Baba?
A: He is a spiritual guide. My family respects him.

Q: Are you hiding something?
A: I've answered within legal and ethical limits.`
    },
    "Interrogation: Leena Suri": {
        icon: "🎙️",
        content: `SUSPECT 3: LEENA SURI
Firmware Engineer
Behavior: Nervous, emotional

INTERROGATION RECORD

Q: What was your relationship with Rishab?
A: We were… close. Matlab… we worked together a lot.

Q: Did he share anything with you?
A: Haan… he said something was wrong with firmware… like… something was influencing outputs.

Q: Were you scared for your job?
A: Of course! Agar yeh sab leak hota toh… sab khatam.

Q: Did Aarya pressure you?
A: No… no… she just said… 'handle it carefully'.

Q: Did Rishab seem afraid?
A: Yes… he said someone else was involved… not just internal.

Q: Who else?
A: He mentioned… something like… an ID? ghost… something… I don't remember fully.

Q: Did you love him?
A: This is not relevant…`
    },
    "Interrogation: Baba": {
        icon: "🎙️",
        content: `SUSPECT 4: BABA
Spiritual Guide (Tech-aware)
Behavior: Cryptic, philosophical

INTERROGATION RECORD

Q: Did Aarya consult you?
A: मनुष्य जब संशय में डूबता है, तब वह ज्ञान नहीं… सहारा खोजता है। आर्या ने भी वही किया।

Q: What advice did you give her?
A: मैंने कहा था… जो अशांति का कारण बने, उसका समाधान आवश्यक है। अब समाधान कैसे हो… यह बुद्धि का विषय है।

Q: Do you know about NeuroBand issues?
A: यंत्र तभी खतरनाक होता है जब उसके भीतर अदृश्य हस्तक्षेप हो। और यहाँ… हस्तक्षेप है।

Q: Who is responsible?
A: नाम में नहीं… संकेत में खोजो। भूत नहीं… पहचान है। एक संख्या… एक परत… एक छाया। '४१'… केवल अंक नहीं है।

Q: What do you mean by '41'?
A: जब भाव परत बन जाए… और पहचान संख्या बन जाए… तब मनुष्य नहीं… छाया कार्य करती है।

Q: Is someone controlling the system?
A: जो लिखता है वह संचालक नहीं होता। संचालक वह है… जो लिखता ही नहीं।

Q: Are you involved?
A: संत पर नहीं… विश्वास किया जाता है। परंतु अंधविश्वास… विनाश का कारण होता है।`
    },
    "Interrogation: Rajveer Malhotra": {
        icon: "🎙️",
        content: `SUSPECT 5: RAJVEER MALHOTRA
VP Strategy / Investor Liaison
Behavior: Polished, composed, controlled

INTERROGATION RECORD

Q: What was your interaction with Rishab Sen?
A: Limited. He wasn't part of my reporting chain. But I knew he had concerns about timelines and release schedules.

Q: Were you aware of any issues with the NeuroBand system?
A: I was aware of disagreements between teams. That's expected in any complex product. Nothing was formally escalated to my level as a critical failure.

Q: Did you push for the product release despite internal concerns?
A: I pushed for clarity and adherence to timelines. Investors expect predictability. Final technical decisions are not made by me.`
    },
    "Interrogation: Kavya Sharma": {
        icon: "🎙️",
        content: `SUSPECT 6: KAVYA SHARMA
Head of Public Relations
Behavior: Calm, professional, media-trained

INTERROGATION RECORD

Q: Who prepared the official statement regarding Rishab Sen?
A: My team drafted it based on inputs from internal departments, primarily security and compliance.

Q: Did you personally verify the claims made in the statement?
A: PR does not independently verify technical data. We rely on information that has been internally approved and cleared.

Q: Why was the narrative focused on data theft so quickly?
A: In crisis situations, clarity is important. A structured narrative prevents speculation and maintains stakeholder confidence.`
    },
    "Interrogation: Arjun Nanda": {
        icon: "🎙️",
        content: `SUSPECT 7: ARJUN NANDA
Junior Security Analyst
Behavior: Hesitant, nervous, cooperative

INTERROGATION RECORD

Q: What was your role on the night of the incident?
A: I was monitoring system activity and access logs. It was mostly routine until I noticed some irregular patterns.

Q: What kind of irregularities did you observe?
A: Some log sequences didn't align properly… like timestamps and system events didn't fully match expected behavior.

Q: Did you report these inconsistencies?
A: Yes… I flagged it internally. But I was told it was already being handled and that I didn't need to escalate it further.`
    },
    "Access Ledger": {
        icon: "🔑",
        content: `ACCESS LEDGER
LAB ACCESS LOG — SECURE ZONE (LAB 7)
System: NeuroBand Test Facility

20:32 — Entry Logged — LS (Leena Suri - Firmware)
20:41 — Exit Logged — LS
20:52 — Entry Logged — RS (Rishab Sen)
20:58 — Entry Logged — FT (Facilities Tech)
21:00 — Entry Logged — TECH-A (Maintenance)
21:02 — Entry Logged — AN (Arjun Nanda)
21:05 — System Access Triggered (Design Console)
21:07 — Exit Logged — FT
21:09 — Internal File Access Recorded
        /designs/NeuroBand/v4/core
21:10 — Test Cycle Initiated
21:12 — System Override Flag Raised (auto-log)
21:14 — Telemetry Spike Detected
21:15 — [CRITICAL SYSTEM EVENT — NO ACCESS LOGGED]

21:18 — Exit Logged — AN (Arjun Nanda)
21:22 — System Idle State Detected
21:31 — Entry Logged — LS (Leena Suri)
21:36 — Exit Logged — LS

═══════════════════════════════════════════════
Security Log Entries
═══════════════════════════════════════════════

21:48 — Entry Logged — VK (Vikrant Kaul - Security)
21:50 — Security Override Access Granted
21:54 — Restricted Movement Authorized
21:56 — Exit Logged — VK
22:05 — Entry Logged — FT (Facilities Tech)
22:12 — Maintenance Check (Post-event cleanup)
22:18 — Exit Logged — FT

Note:
- All entries require valid authorization
- System-triggered logs may not record physical access
- Override actions are logged separately`
    },
    "System Inspection Snapshot": {
        icon: "🔬",
        content: `SYSTEM INSPECTION SNAPSHOT
NEUROBAND RIG — PHYSICAL COMPONENT INSPECTION

═══════════════════════════════════════════════
COMPONENT A: REGULATOR
═══════════════════════════════════════════════
Model: REG-UPC-17
Serial: SN-78-17-A
Label: NEURAL OUTPUT REGULATOR
Revision: A1 | Calibration: 04/25
Status: MATCHED

═══════════════════════════════════════════════
COMPONENT C: ISOLATION SHIELD
═══════════════════════════════════════════════
Model: SHIELD-EMI-03
ID: SH-22-C
Label: ISOLATION SHIELD PLATE
Note: DO NOT MODIFY / SEALED UNIT
Status: MATCHED

═══════════════════════════════════════════════
COMPONENT B: FEEDBACK LIMITER (⚠️ MISMATCH)
═══════════════════════════════════════════════
Expected Model: FB-LIM REV-A
Observed Model: FB-LIM REV-B
Serial Mismatch: Expected 001-A / Found 001-B

Resistor Values:
  R1: 103
  R2: 103
  R3: Present
  C2: Present
  Q1: Present

INPUT+- → OUTPUT

⚠️ INSPECTION NOTE:
Visual inspection suggests unit differs from recorded BOM.
Limiter module appears to have been replaced with a
different revision (REV-B instead of REV-A).
This substitution was NOT documented in maintenance logs.`,
        images: [systemInspection1, systemInspection2]
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
    const [showWelcomePopup, setShowWelcomePopup] = useState(true);
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
        "Collected Evidence": true,
        "Hardware Tampering": true,
        "Interrogation Records": true
    });

    const toggleSection = (title: string) => {
        setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
    };

    const filteredSections = FILE_SECTIONS.map(section => ({
        ...section,
        files: section.files.filter(name =>
            name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(section => section.files.length > 0 || searchQuery === '');

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

    const handleSubmit = () => {
        window.open("https://forms.gle/VPNuSJUaaoPWoqJp7", "_blank");
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
                {/* Left Column - Evidence Panel */}
                <div style={styles.leftColumn}>
                    {/* Evidence Rule Banner */}
                    <div style={styles.evidenceRule}>
                        <div style={styles.evidenceRuleHeader}>📌 EVIDENCE RULE</div>
                        <div style={styles.evidenceRuleText}>
                            While preparing your interrogation plan,{'\n'}
                            you must refer to evidence using its exact file name.{'\n\n'}
                            Example:{'\n'}
                            "Override_Approval_Log.txt"{'\n'}
                            "Autopsy_Temperature_Report.pdf"{'\n\n'}
                            This will be required during interrogation.
                        </div>
                    </div>

                    <h2 style={styles.columnTitle}>
                        🗂️ EVIDENCE PANEL
                    </h2>

                    {/* Search Bar */}
                    <input
                        type="text"
                        placeholder="[Search 🔍]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={styles.searchBar}
                    />

                    {/* File List with Sections */}
                    <div style={styles.fileList}>
                        {filteredSections.map((section) => (
                            <div key={section.title}>
                                <div
                                    style={styles.sectionHeader}
                                    onClick={() => toggleSection(section.title)}
                                >
                                    <span>{section.icon} {section.title.toUpperCase()}</span>
                                    <span style={{ color: '#7a4a4a', fontSize: '0.8rem' }}>
                                        {expandedSections[section.title] ? '▼' : '▶'} ({section.files.length})
                                    </span>
                                </div>
                                {expandedSections[section.title] && section.files.map((fileName) => (
                                    <div
                                        key={fileName}
                                        data-testid={`file-${fileName.toLowerCase().replace(/\s+/g, '-')}`}
                                        style={{
                                            ...styles.fileItem,
                                            ...(selectedFile === fileName ? styles.fileItemSelected : {}),
                                            marginLeft: '12px'
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
                                        <span style={styles.fileIcon}>{FILE_DATA[fileName as keyof typeof FILE_DATA]?.icon}</span>
                                        <span style={styles.fileName}>{fileName}</span>
                                    </div>
                                ))}
                                {expandedSections[section.title] && section.files.length === 0 && (
                                    <div style={{ padding: '12px 12px 12px 24px', color: '#7a4a4a', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                        [ No files yet ]
                                    </div>
                                )}
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
                            {selectedFile && FILE_DATA[selectedFile as keyof typeof FILE_DATA].images && (
                                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {FILE_DATA[selectedFile as keyof typeof FILE_DATA].images!.map((img, i) => (
                                        <img key={i} src={img.src} alt={`${selectedFile} - Image ${i + 1}`} style={{ width: '100%', borderRadius: '4px', border: '1px solid #3a1818' }} />
                                    ))}
                                </div>
                            )}
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

            {/* Welcome Popup */}
            {showWelcomePopup && (
                <div style={styles.modalOverlay}>
                    <div style={styles.welcomePopup}>
                        <div style={styles.welcomeHeader}>⚠ FINAL TASK ALERT</div>
                        <div style={styles.welcomeBody}>
                            <p>You have reached the final stage of the investigation.</p>
                            <p>All previous findings must now be used carefully.</p>
                            <p>New evidence related to hardware tampering has been added to the repository. Review it thoroughly.</p>
                            <p>You will now prepare for interrogation.</p>
                            <p>Based on your understanding of the case:</p>
                            <ul style={styles.welcomeList}>
                                <li>Identify the individuals you suspect</li>
                                <li>Support your suspicion with correct evidence files</li>
                                <li>Use this to question them during interrogation</li>
                            </ul>
                            <p>Your conclusions will directly affect your performance in the next round.</p>
                            <p style={{ color: '#ff8800', marginTop: '16px' }}>
                                <strong>Note:</strong><br />
                                You must reference evidence using exact file names.
                            </p>
                            <p style={{ color: '#7a4a4a', fontStyle: 'italic' }}>
                                There is no correct or incorrect answer here — only how well you can justify your reasoning.
                            </p>
                            <p style={{ textAlign: 'center', color: '#ff3333', letterSpacing: '2px', marginTop: '12px' }}>
                                Proceed carefully.
                            </p>
                        </div>
                        <div style={{ textAlign: 'center', borderTop: '1px solid #3a1818', paddingTop: '20px' }}>
                            <button
                                style={styles.welcomeButton}
                                onClick={() => setShowWelcomePopup(false)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#2a0808';
                                    e.currentTarget.style.boxShadow = '0 0 25px #ff333366';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#1a0505';
                                    e.currentTarget.style.boxShadow = '0 0 15px #ff333333';
                                }}
                            >
                                [ BEGIN PREPARATION ]
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
    },
    evidenceRule: {
        background: '#1a1000',
        border: '1px solid #ff880066',
        borderRadius: '4px',
        padding: '14px',
        marginBottom: '16px'
    },
    evidenceRuleHeader: {
        fontFamily: "'Orbitron', monospace",
        fontSize: '0.85rem',
        letterSpacing: '2px',
        color: '#ff8800',
        marginBottom: '8px',
        fontWeight: 'bold'
    },
    evidenceRuleText: {
        fontSize: '0.75rem',
        lineHeight: '1.6',
        color: '#e8c8c8',
        whiteSpace: 'pre-line'
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 12px',
        background: '#2a1010',
        border: '1px solid #4a1818',
        borderRadius: '3px',
        cursor: 'pointer',
        marginBottom: '6px',
        marginTop: '10px',
        fontFamily: "'Orbitron', monospace",
        fontSize: '0.8rem',
        letterSpacing: '2px',
        color: '#ff5555',
        transition: 'all 0.2s'
    },
    welcomePopup: {
        background: '#1a0d0d',
        border: '2px solid #ff8800',
        borderRadius: '8px',
        padding: '30px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '85vh',
        overflowY: 'auto',
        boxShadow: '0 0 40px #ff880033'
    },
    welcomeHeader: {
        fontFamily: "'Orbitron', monospace",
        fontSize: '1.4rem',
        letterSpacing: '3px',
        color: '#ff8800',
        textAlign: 'center',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '1px solid #3a2810',
        textShadow: '0 0 15px #ff880044'
    },
    welcomeBody: {
        fontSize: '0.9rem',
        lineHeight: '1.7',
        color: '#e8c8c8',
        marginBottom: '20px'
    },
    welcomeList: {
        listStyleType: 'disc',
        paddingLeft: '24px',
        margin: '10px 0',
        color: '#ff5555'
    },
    welcomeButton: {
        padding: '14px 30px',
        background: '#1a0505',
        border: '2px solid #ff3333',
        borderRadius: '4px',
        color: '#ff3333',
        fontFamily: "'Orbitron', monospace",
        fontSize: '0.95rem',
        letterSpacing: '3px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 0 15px #ff333333'
    }
};

export default PrepRoom;