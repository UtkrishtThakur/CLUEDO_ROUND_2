import mongoose from "mongoose";

const SubmissionSchema = new mongoose.Schema({
    username: { type: String, required: true },
    taskId: { type: String, required: true },
    submittedAnswer: { type: mongoose.Schema.Types.Mixed, required: true },
    isCorrect: { type: Boolean, required: true },
    rawText: { type: String, default: "" },
    score: { type: Number, default: 0 },
}, { timestamps: true });

export const Submission = mongoose.models.Submission || mongoose.model("Submission", SubmissionSchema);
