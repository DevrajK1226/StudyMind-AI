import React from "react";
import { api } from "../api.js";

export default function QuestionHistory({
  questions,
  onDeleted,
  subjects = [],
  selectedSubject = "all",
  onFilterChange,
}) {
  const handleDelete = async (id) => {
    try {
      await api.deleteQuestion(id);
      if (onDeleted) onDeleted();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="card">
      <div className="history-toolbar">
        <h3>Question History</h3>
        {subjects.length > 0 && (
          <select
            className="subject-filter"
            value={selectedSubject}
            onChange={(e) => onFilterChange && onFilterChange(e.target.value)}
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>

      {!questions.length ? (
        <p>
          {selectedSubject === "all"
            ? "No questions asked yet. Try asking your first doubt above."
            : `No questions found for "${selectedSubject}" yet.`}
        </p>
      ) : (
        <ul className="history-list">
          {questions.map((q) => (
            <li key={q._id} className="history-item">
              <div className="history-header">
                <span className="subject-tag">{q.subject}</span>
                <span className="history-date">
                  {new Date(q.createdAt).toLocaleDateString()}
                </span>
                <button className="delete-btn" onClick={() => handleDelete(q._id)}>
                  Delete
                </button>
              </div>
              <p className="history-question">Q: {q.questionText}</p>
              <p className="history-answer">A: {q.answerText}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
