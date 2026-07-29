const User = require("../models/User");
const Match = require("../models/Match");
const { evaluateCompatibility } = require("./geminiService");

// ---- Backup plan if Gemini API fails ----
// Calculates a rough compatibility score just by comparing numbers,
// no AI involved. Closer habit values = higher score.
function heuristicFallbackScore(userA, userB) {
  const keys = Object.keys(userA.habitVector || {});
  if (!keys.length) return 50; // no data at all -> just assume 50%

  // Add up how different each habit is between the two users
  const diffSum = keys.reduce(
    (sum, k) =>
      sum + Math.abs((userA.habitVector[k] || 3) - (userB.habitVector[k] || 3)),
    0
  );
  

  const maxDiff = keys.length * 4; // worst possible mismatch
  return Math.round(100 - (diffSum / maxDiff) * 100); // convert to a 0-100 score
}

// ---- Step 1: Find possible roommate candidates for a user ----
async function findCandidates(user) {
  // If user is searching for a room, we want people who HAVE a room, and vice versa
  const oppositeRole =
    user.role === "SEARCHING_ROOM" ? "HAS_ROOM" : "SEARCHING_ROOM";

  return User.find({
    _id: { $ne: user._id }, // exclude the user themself
    role: oppositeRole,
    onboardingComplete: true, // only fully-set-up profiles
    location: {
      $near: {
        $geometry: user.location,
        $maxDistance: 15000, // within 15km
      },
    },
  }).limit(20); // don't fetch too many at once
}

// ---- Step 2: Get a match's compatibility, using cache first ----
async function getOrEvaluateMatch(userA, userB) {
  // Always store the pair in the same order (sorted IDs), so
  // (A,B) and (B,A) are treated as the same match, not two different ones
  const [first, second] = [userA._id, userB._id].sort();

  // Check if we've already evaluated this pair before (cache hit)
  let match = await Match.findOne({ userA: first, userB: second });
  if (match) return match;

  try {
    // No cache -> ask Gemini for a fresh evaluation
    const result = await evaluateCompatibility(userA, userB);
    match = await Match.create({ userA: first, userB: second, ...result });
  } catch (err) {
    // Gemini failed -> fall back to the heuristic score instead
    const fallbackScore = heuristicFallbackScore(userA, userB);
    match = await Match.create({
      userA: first,
      userB: second,
      compatibilityScore: fallbackScore,
      pros: [],
      cons: [],
      vibeSummary: "AI evaluation unavailable; using heuristic score.",
      isFallback: true,
    });
  }

  return match;
}

// ---- Step 3: Full pipeline — find candidates, match each, sort by score ----
async function runMatchingPipeline(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found for matching.");

  const candidates = await findCandidates(user);

  const matches = [];
  for (const candidate of candidates) {
    const match = await getOrEvaluateMatch(user, candidate);
    matches.push({ candidate, match });
  }

  // Best matches (highest score) first
  return matches.sort(
    (a, b) => b.match.compatibilityScore - a.match.compatibilityScore
  );
}

module.exports = { runMatchingPipeline, getOrEvaluateMatch };