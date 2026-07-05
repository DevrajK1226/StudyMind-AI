import React, { useState } from "react";
import { api } from "../api.js";

export default function AskQuestion({ onNewAnswer }) {
  const [subject, setSubject] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setAnswer(null);
    setLoading(true);
    try {
      const result = await api.askQuestion(subject, questionText);
      setAnswer(result.answerText);
      setQuestionText("");
      if (onNewAnswer) onNewAnswer();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3>Ask a Doubt</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Subject (e.g. Data Structures, Physics)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
        <textarea
          placeholder="Type your question here..."
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          rows={4}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Thinking..." : "Ask AI Tutor"}
        </button>
      </form>
      {error && <p className="error-text">{error}</p>}
      {answer && (
        <div className="answer-box">
          <strong>Answer:</strong>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}
