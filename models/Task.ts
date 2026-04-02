import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
    taskId: { type: String, required: true, unique: true },
    orderIndex: { type: Number, required: true },
    question: { type: String },
    answer: { type: mongoose.Schema.Types.Mixed },
    hints: { type: [String], default: [] },
    points: { type: Number, default: 0 },
}, { timestamps: true });

export const Task = mongoose.models.Task || mongoose.model("Task", TaskSchema);
