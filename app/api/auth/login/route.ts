import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { signJwt } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { email, password } = await req.json();

        const sharedPass = process.env.SHARED_PASSWORD || "supari";

        if (password !== sharedPass) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        if (!email) {
            return NextResponse.json({ error: "Email/Agent ID required" }, { status: 400 });
        }

        // Try to find the user, if doesn't exist, create it (simplifying pre-population)
        let user = await User.findOne({ username: email });
        if (!user) {
            user = await User.create({ username: email, points: 0, currentTaskIndex: 0 });
        }

        const token = signJwt({ username: user.username, id: user._id });

        return NextResponse.json({ token, user: { username: user.username, points: user.points, currentTaskIndex: user.currentTaskIndex } });
    } catch (error) {
        console.error("Login route error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
