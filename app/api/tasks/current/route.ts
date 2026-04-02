import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { Task } from "@/models/Task";
import { verifyJwt } from "@/lib/auth";

// Simple hardcoded fallback mapping if DB tasks aren't pre-populated yet
const TASK_IDS = ["task1", "task3", "task5", "task6"];

export async function GET(req: Request) {
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

        const currentTaskId = TASK_IDS[user.currentTaskIndex] || null;

        if (!currentTaskId) {
            return NextResponse.json({ completed: true });
        }

        let task = await Task.findOne({ taskId: currentTaskId });

        return NextResponse.json({
            taskId: currentTaskId,
            orderIndex: user.currentTaskIndex,
            question: task ? task.question : "Challenge Details provided via UI",
            hints: task ? task.hints : []
        });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
