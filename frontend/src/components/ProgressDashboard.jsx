import React from "react";

export default function ProgressDashboard({ progress }) {
  if (!progress || progress.totalQuestions === 0) {
    return (
      <div className="card">
        <h3>Your Progress</h3>
        <p>Start asking questions to see your progress by subject.</p>
      </div>
    );
  }

  const maxCount = Math.max(...progress.subjects.map((s) => s.questionsAsked));

  return (
    <div className="card">
      <h3>Your Progress</h3>
      <p className="total-count">Total questions asked: {progress.totalQuestions}</p>
      <div className="progress-list">
        {progress.subjects.map((s) => (
          <div key={s.subject} className="progress-row">
            <div className="progress-label">
              <span>{s.subject}</span>
              <span>{s.questionsAsked}</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${(s.questionsAsked / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
