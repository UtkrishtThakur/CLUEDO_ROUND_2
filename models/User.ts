import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    points: { type: Number, default: 0 },
    currentTaskIndex: { type: Number, default: 0 },
    completedTasks: { type: [String], default: [] },
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
