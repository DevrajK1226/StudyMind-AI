const BASE_URL = import.meta.env.VITE_API_URL || "/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.message || "Request failed");
    Object.assign(err, data);
    throw err;
  }

  return data;
}

export const api = {
  register: (name, email, password) =>
    request("/auth/register", { method: "POST", body: { name, email, password } }),
  verifyEmail: (email, code) =>
    request("/auth/verify-email", { method: "POST", body: { email, code } }),
  resendCode: (email) =>
    request("/auth/resend-code", { method: "POST", body: { email } }),
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),
  me: () => request("/auth/me", { auth: true }),

  askQuestion: (subject, questionText) =>
    request("/questions/ask", { method: "POST", body: { subject, questionText }, auth: true }),
  getHistory: (subject) =>
    request(`/questions${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`, {
      auth: true,
    }),
  getProgress: () => request("/questions/progress", { auth: true }),
  deleteQuestion: (id) => request(`/questions/${id}`, { method: "DELETE", auth: true }),
};