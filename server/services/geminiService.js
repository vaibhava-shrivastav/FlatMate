const { GoogleGenAI } = require("@google/genai");

// Set up connection to Gemini using our API key (from .env)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Instructions we send to Gemini every time — tells it exactly
// what to do and what shape of answer we expect back (strict JSON only)
const SYSTEM_PROMPT = `You are an expert roommate compatibility evaluator.
Compare two users based only on their lifestyle habit vectors:
sleepSchedule, cleanliness, smoking, cooking, guests, and noise.

Evaluate how well their lifestyles align.
Identify realistic strengths and potential conflicts.
Do not invent personal information.

Return ONLY valid JSON with no markdown or extra text, using exactly this structure:
{
  "compatibilityScore": 75,
  "pros": ["A specific compatibility strength"],
  "cons": ["A potential lifestyle conflict"],
  "vibeSummary": "A short, balanced summary of their compatibility."
}

Rules:
- compatibilityScore must be an integer between 0 and 100.
- pros and cons must be arrays of concise strings.
- vibeSummary must be a short string.
- Base your evaluation only on the provided habit data.`;
// Main function: takes 2 users, asks Gemini how compatible they are
async function evaluateCompatibility(userA, userB) {
  try {
    // Build the actual message we send — system prompt + both users' habit data
    const prompt = `${SYSTEM_PROMPT}\nUser A: ${JSON.stringify(
      userA.habitVector
    )}\nUser B: ${JSON.stringify(userB.habitVector)}`;

    // Call Gemini API
const GEMINI_TIMEOUT_MS = 6000;
    const response = await Promise.race([
      ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini API timeout after 6s")), GEMINI_TIMEOUT_MS)
      ),
    ]);

    // Gemini sometimes wraps JSON in ```json ``` code fences — strip those off
    const raw = response.text.replace(/```json|```/g, "").trim();

    // Convert the cleaned text into a real JS object
    const parsed = JSON.parse(raw);

    // Safety check: make sure Gemini actually gave us the shape we asked for
    if (
      typeof parsed.compatibilityScore !== "number" ||
      !Array.isArray(parsed.pros) ||
      !Array.isArray(parsed.cons)
    ) {
      throw new Error("Malformed Gemini response shape.");
    }

    // Success — return the result, marked as NOT a fallback
    return { ...parsed, isFallback: false };
  } catch (err) {
    // Something went wrong (API down, bad key, bad JSON, etc.)
    const status = err?.status || err?.response?.status;
    console.error("Gemini evaluation failed:", status || err.message);

    // Re-throw so the calling code (matchingEngine.js) knows to use
    // the heuristic fallback score instead
    throw err;
  }
}

module.exports = { evaluateCompatibility };