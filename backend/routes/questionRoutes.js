import express from "express";
import mongoose from "mongoose";
import Question from "../models/Question.js";
import protect from "../middleware/authMiddleware.js";
import { askGemini } from "../utils/geminiClient.js";

const router = express.Router();

// POST /api/questions/ask (protected) - ask a new question, get AI explanation
router.post("/ask", protect, async (req, res) => {
  try {
    const { subject, questionText } = req.body;

    if (!subject || !questionText) {
      return res.status(400).json({ message: "Subject and question are required" });
    }

    const answerText = await askGemini(subject, questionText);

    const question = await Question.create({
      student: req.userId,
      subject,
      questionText,
      answerText,
    });

    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/questions (protected) - history for logged-in student, optional ?subject=
router.get("/", protect, async (req, res) => {
  try {
    const filter = { student: req.userId };
    if (req.query.subject) filter.subject = req.query.subject;

    const questions = await Question.find(filter).sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/questions/progress (protected) - aggregated stats per subject
router.get("/progress", protect, async (req, res) => {
  try {
    const stats = await Question.aggregate([
      { $match: { student: new mongoose.Types.ObjectId(req.userId) } },
      {
        $group: {
          _id: "$subject",
          questionsAsked: { $sum: 1 },
          lastActivity: { $max: "$createdAt" },
        },
      },
      { $sort: { questionsAsked: -1 } },
    ]);

    const totalQuestions = stats.reduce((sum, s) => sum + s.questionsAsked, 0);

    res.json({
      totalQuestions,
      subjects: stats.map((s) => ({
        subject: s._id,
        questionsAsked: s.questionsAsked,
        lastActivity: s.lastActivity,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/questions/:id (protected) - remove a question from history
router.delete("/:id", protect, async (req, res) => {
  try {
    const question = await Question.findOne({ _id: req.params.id, student: req.userId });
    if (!question) return res.status(404).json({ message: "Question not found" });

    await question.deleteOne();
    res.json({ message: "Question deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
