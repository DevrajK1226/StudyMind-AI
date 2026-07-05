import React, { useEffect, useState, useCallback } from "react";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import AskQuestion from "./AskQuestion.jsx";
import QuestionHistory from "./QuestionHistory.jsx";
import ProgressDashboard from "./ProgressDashboard.jsx";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [progress, setProgress] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("all");

  const refresh = useCallback(async (subjectFilter) => {
    const activeFilter = subjectFilter ?? selectedSubject;
    const [historyData, progressData] = await Promise.all([
      api.getHistory(activeFilter === "all" ? undefined : activeFilter),
      api.getProgress(),
    ]);
    setQuestions(historyData);
    setProgress(progressData);
  }, [selectedSubject]);

  useEffect(() => {
    refresh(selectedSubject);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject]);

  const handleFilterChange = (subject) => {
    setSelectedSubject(subject);
  };

  const subjectOptions = progress?.subjects?.map((s) => s.subject) || [];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>AI Study Assistant</h1>
        <div>
          <span>Hi, {user?.name}</span>
          <button onClick={logout} className="logout-btn">
            Log Out
          </button>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <AskQuestion onNewAnswer={() => refresh()} />
          <QuestionHistory
            questions={questions}
            onDeleted={() => refresh()}
            subjects={subjectOptions}
            selectedSubject={selectedSubject}
            onFilterChange={handleFilterChange}
          />
        </div>
        <div className="dashboard-side">
          <ProgressDashboard progress={progress} />
        </div>
      </div>
    </div>
  );
}
