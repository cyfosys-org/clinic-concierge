// handlers/triage.js
// Keyword-based symptom classifier — demo level.
// In production, review and configure with a licensed clinician.
// Always err on the side of over-escalation rather than under-escalation.

const EMERGENCY_KEYWORDS = [
  "chest pain", "can't breathe", "cannot breathe", "difficulty breathing",
  "severe bleeding", "unconscious", "stroke", "heart attack",
  "severe allergic", "choking", "not breathing",
];

const URGENT_KEYWORDS = [
  "high fever", "severe pain", "severe headache", "swelling",
  "infection", "broken", "fracture", "vomiting blood",
  "persistent pain", "can't walk", "cannot walk",
];

function triageSymptoms({ symptoms }) {
  const text = (symptoms || "").toLowerCase();

  if (EMERGENCY_KEYWORDS.some((kw) => text.includes(kw))) {
    return {
      level: "emergency",
      message: "This sounds like it may be a medical emergency. Please hang up and dial 911 or go to the nearest emergency room immediately.",
    };
  }

  if (URGENT_KEYWORDS.some((kw) => text.includes(kw))) {
    return {
      level: "urgent",
      message: "This sounds like it needs prompt attention. I'd recommend booking the soonest available same-day or next-day slot.",
    };
  }

  return {
    level: "routine",
    message: "This sounds like a routine concern. I can book a regular appointment for you at a convenient time.",
  };
}

module.exports = { triageSymptoms };
