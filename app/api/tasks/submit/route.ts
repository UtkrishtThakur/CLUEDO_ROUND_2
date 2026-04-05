import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { Submission } from "@/models/Submission";
import { Task } from "@/models/Task";
import { verifyJwt } from "@/lib/auth";

const TASK_OPTS = ["task1", "task3", "task5", "task6"];

export async function POST(req: Request) {
    try {
        await dbConnect();
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = verifyJwt(authHeader.split(" ")[1]);
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const user = await User.findOne({ username: decoded.username });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const { taskId, action, payload } = await req.json();

        // Anti-cheat checklist tracking
        let isCorrect = false;
        let score = 0;

        // Task Evaluations
        if (taskId === "task1") {
            if (action === "validateQ1Q2") {
                const { q1, q2 } = payload;
                isCorrect = q1 === "Neural overload" && q2 === "Safety dampening / shutdown system";
            } else if (action === "validateQ3") {
                const { text } = payload;
                const keys = ["neural", "overload", "earlier", "temperature", "cooling", "contradict", "report", "cortical", "dampening", "safety"];
                const low = text.toLowerCase();
                const matches = keys.filter(k => low.includes(k)).length;
                isCorrect = true; // Any valid inference allows the game to end and logs points
                if (matches >= 4) score = 40;
                else if (matches === 3) score = 30;
                else if (matches === 2) score = 20;
                else score = 10;
            }
        } else if (taskId === "task3") {
            if (action === "ghostQuery") {
                const { qIdx, answer } = payload;
                const Q_ANS = [
                    ["adaptive"],
                    ["manual", "override", "manual_override", "manual override"],
                    ["patch", "shutdown_logic", "shutdown logic", "tolerance"]
                ];
                const ok = qIdx === 2 ? !!answer?.trim() : Q_ANS[qIdx]?.some((k) => answer.toLowerCase().includes(k));
                isCorrect = !!ok;
                score = isCorrect && qIdx < 2 ? 30 : 0;
            } else if (action === "puzzleCrack") {
                const type = payload?.type;
                if (type === "codeAssembly") {
                    const correctOrder = [
                        'import transfer_module as tm',
                        'session = tm.Session(host="ext_host", port=9091)',
                        'session.auth(token="0x99F_AUT")',
                        'session.execute_transfer(payload="neuro_dump_v2", dest="ghost_node_x")'
                    ];
                    isCorrect = JSON.stringify(payload?.order) === JSON.stringify(correctOrder);
                } else {
                    // Default success for pure UI puzzles without textual hardcoded answers
                    // To ensure the game can be played if they solve it on client
                    isCorrect = payload?.passed === true;
                }
            } else {
                // Default success for pure UI puzzles without textual hardcoded answers
                // To ensure the game can be played if they solve it on client
                isCorrect = payload?.passed === true;
            }
        } else if (taskId === "task5") {
            if (action === "ghostQuery") {
                const { qIdx, answer } = payload;
                if (qIdx === 0) isCorrect = answer?.toLowerCase().includes("temporary safety override");
                else if (qIdx === 1) isCorrect = answer?.toLowerCase().includes("a.m_arch") || answer?.toLowerCase().includes("am_arch");
                else if (qIdx === 2) {
                    isCorrect = !!answer?.trim(); // Q3 is paragraph
                    score = isCorrect ? 50 : 0;
                }
            }
        } else if (taskId === "task6") {
            if (action === "finalSubmission") {
                const counts = payload?.suspects?.filter(Boolean).length;
                isCorrect = counts === 3;
            }
        }

        // Determine if this is the final step of the current task to trigger promotion
        const tIndex = TASK_OPTS.indexOf(taskId);
        const isFinalStep =
            (taskId === "task1" && action === "validateQ3") ||
            (taskId === "task3" && action === "ghostQuery" && payload?.qIdx === 2) ||
            (taskId === "task5" && action === "ghostQuery" && payload?.qIdx === 2) ||
            (taskId === "task6" && action === "finalSubmission");

        if (tIndex >= 0 && isCorrect && isFinalStep) {
            // Promotion logic: increment index only if this is the current task
            if (user.currentTaskIndex === tIndex) {
                user.currentTaskIndex += 1;
            }
        }

        user.points += score;
        await user.save();

        await Submission.create({
            username: user.username,
            taskId,
            submittedAnswer: payload,
            isCorrect,
            rawText: JSON.stringify(payload),
            score
        });

        return NextResponse.json({
            isCorrect,
            score,
            currentPoints: user.points
        });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
