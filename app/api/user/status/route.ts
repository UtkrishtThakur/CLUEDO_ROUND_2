import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { verifyJwt } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        await dbConnect();
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const TASK_OPTS = ["task1", "task3", "task5", "task6"];
        const token = authHeader.split(" ")[1];
        const decoded = verifyJwt(token);
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const user = await User.findOne({ username: decoded.username });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            username: user.username,
            points: user.points,
            currentTaskIndex: user.currentTaskIndex,
            completedTasks: user.completedTasks
        });
    } catch (error) {
        console.error("User status route error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
