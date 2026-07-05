import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true, trim: true },
    questionText: { type: String, required: true },
    answerText: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Question", questionSchema);
