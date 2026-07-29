const { GoogleGenAI } = require("@google/genai");

// Set up connection to Gemini using our API key (from .env)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Instructions we send to Gemini every time — tells it exactly
// what to do and what shape of answer we expect back (strict JSON only)
const SYSTEM_PROMPT = `You are a roommate compatibility evaluator. Given two lifestyle habit
vectors (scale 1-5) for sleepSchedule, cleanliness, smoking, cooking, guests, noise, respond
ONLY with strict JSON, no markdown, in this exact shape:
{"compatibilityScore": number (0-100), "pros": string[], "cons": string[], "vibeSummary": string}`;

// Main function: takes 2 users, asks Gemini how compatible they are
async function evaluateCompatibility(userA, userB) {
  try {
    // Build the actual message we send — system prompt + both users' habit data
    const prompt = `${SYSTEM_PROMPT}\nUser A: ${JSON.stringify(
      userA.habitVector
    )}\nUser B: ${JSON.stringify(userB.habitVector)}`;

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

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