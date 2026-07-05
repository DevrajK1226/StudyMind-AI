// Calls Google's Gemini API to get an explanation for a student's question.
// Uses the "gemini-2.5-flash" model (current stable model as of mid-2026).

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// Strips common Markdown symbols in case the model adds them despite instructions.
function stripMarkdown(text) {
  return text
    .replace(/^#{1,6}\s*/gm, "")       // headers (#, ##, ###...)
    .replace(/\*\*(.*?)\*\*/g, "$1")   // bold **text**
    .replace(/\*(.*?)\*/g, "$1")       // italics *text*
    .replace(/^[\s]*[-*+]\s+/gm, "")   // bullet points (-, *, +)
    .replace(/^\s*\d+\.\s+/gm, "")     // numbered list markers "1. "
    .replace(/`{1,3}([^`]*)`{1,3}/g, "$1") // inline/code blocks
    .replace(/-{3,}/g, "")             // horizontal rules ---
    .replace(/\n{3,}/g, "\n\n")        // collapse excess blank lines
    .trim();
}

// Detects whether a question is asking to SOLVE a problem (math/numeric/
// computational) rather than asking to understand a THEORY/concept.
// This keeps math answers short and step-based instead of long tutor essays.
function isProblemToSolve(questionText) {
  const patterns = [
    /\d+\s*[+\-*/^]\s*\d+/, // e.g. "2 + 5", "3*4"
    /\bsolve\b/i,
    /\bintegrate\b/i,
    /\bdifferentiate\b/i,
    /\bderivative\b/i,
    /\bfactorial\b/i,
    /\bsimplify\b/i,
    /\bevaluate\b/i,
    /\bequation\b/i,
    /\bcalculate\b/i,
    /find\s+(x|y|the value)/i,
    /=/,
    /\^/,
    /√/,
    /\b(sin|cos|tan|log|ln)\b/i,
  ];
  return patterns.some((pattern) => pattern.test(questionText));
}

function buildPrompt(subject, questionText) {
  if (isProblemToSolve(questionText)) {
    // Short, step-by-step, no long friendly preamble — plain text, no Markdown.
    return `You are StudyMind AI, solving a ${subject} problem for a student.

The user has given you a problem to SOLVE, not a concept to explain.
Do not write a long introduction or motivational opener.
Do not add unrelated background theory.

Respond in plain text (no Markdown symbols like #, *, -, or backticks)
using exactly this structure, with each step on its own line:

Step 1: <first step>
Step 2: <next step>
(continue with as many steps as needed)
Final Answer: <the final result>

Keep each step short and direct. If the answer can be sanity-checked
(e.g. by substituting back into the equation), do a brief check after
the Final Answer line, starting with "Check:".

Problem: ${questionText}`;
  }

  // Theory / concept question — friendly tutor style, still plain text.
  return `You are a patient, encouraging tutor helping a student with ${subject}.
Explain the answer to the following question clearly, step by step, in simple language.
Keep the explanation focused and easy to follow for a student learning this topic.

IMPORTANT FORMATTING RULE: Respond in plain conversational text only.
Do NOT use Markdown formatting of any kind — no asterisks for bold/italics,
no # headers, no bullet points with - or *, no numbered lists, no code
blocks with backticks, and no horizontal rule lines like ---.
If you need to list steps, write them as plain sentences like
"First, ... Next, ... Then, ..." instead of using list symbols.

Question: ${questionText}`;
}

// Small delay helper for retry backoff
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiWithRetry(url, body, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      return response.json();
    }

    const errorBody = await response.text();
    lastError = new Error(`Gemini API error (${response.status}): ${errorBody}`);

    // Only retry on transient errors: 503 (overloaded) or 429 (rate limited)
    const isRetryable = response.status === 503 || response.status === 429;
    const isLastAttempt = attempt === maxRetries;

    if (!isRetryable || isLastAttempt) {
      throw lastError;
    }

    // Exponential backoff: wait 1s, then 2s, then 4s before retrying
    const waitMs = 1000 * Math.pow(2, attempt - 1);
    await sleep(waitMs);
  }

  throw lastError;
}

export async function askGemini(subject, questionText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  const prompt = buildPrompt(subject, questionText);

  let data;
  try {
    data = await callGeminiWithRetry(`${GEMINI_URL}?key=${apiKey}`, {
      contents: [{ parts: [{ text: prompt }] }],
    });
  } catch (err) {
    // Give a clearer message for the common "server overloaded" case
    if (err.message.includes("503")) {
      throw new Error(
        "The AI service is currently overloaded and didn't respond after several retries. Please try again in a moment."
      );
    }
    throw err;
  }

  const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!answer) {
    throw new Error("Gemini API returned no answer text");
  }

  return stripMarkdown(answer);
}
