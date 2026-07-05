import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail, resendCode } = useAuth();

  const [email] = useState(location.state?.email || "");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  if (!email) {
    // Someone landed here directly without registering/logging in first
    return (
      <div className="auth-card">
        <h2>Verify Email</h2>
        <p>No email found to verify. Please register or log in first.</p>
        <Link to="/register">Go to Register</Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await verifyEmail(email, code);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    setResending(true);
    try {
      await resendCode(email);
      setInfo("A new code has been sent to your email.");
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>Verify Your Email</h2>
      <p>
        We sent a 6-digit code to <strong>{email}</strong>. Enter it below to
        activate your account.
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter 6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          maxLength={6}
          inputMode="numeric"
          required
        />
        {error && <p className="error-text">{error}</p>}
        {info && <p className="info-text">{info}</p>}
        <button type="submit" disabled={loading || code.length !== 6}>
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>
      <p>
        Didn't get a code?{" "}
        <button
          type="button"
          className="link-btn"
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? "Sending..." : "Resend code"}
        </button>
      </p>
    </div>
  );
}
