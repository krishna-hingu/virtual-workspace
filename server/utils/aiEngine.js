// AI Engine - Rule-based logic for smart suggestions

const analyzeMessage = (message) => {
  const content = message.toLowerCase();

  // Urgency detection
  const urgentWords = ["urgent", "asap", "now", "immediately", "emergency"];
  const hasUrgency = urgentWords.some((word) => content.includes(word));

  // Politeness suggestions
  let suggestion = null;

  if (content.includes("come now") || content.includes("come here")) {
    suggestion = "Consider: 'Are you available for a quick chat?'";
  } else if (content.includes("do this") || content.includes("do that")) {
    suggestion = "Consider: 'Could you please help with this?'";
  } else if (content.includes("stupid") || content.includes("dumb")) {
    suggestion = "Consider using more constructive language";
  }

  return {
    hasUrgency,
    suggestion,
    sentiment: hasUrgency ? "urgent" : "normal",
  };
};

const generateWorkPressureAlert = (score, factors) => {
  if (score > 70) {
    return {
      type: "high_pressure",
      message: "High work pressure detected. Consider taking a break.",
      actions: ["Take 5-minute break", "Enable focus mode", "Delegate tasks"],
    };
  } else if (score > 40) {
    return {
      type: "moderate_pressure",
      message: "Moderate work pressure. Stay focused.",
      actions: ["Continue current task", "Check task priorities"],
    };
  }

  return null;
};

const suggestFocusMode = (interactions, currentFocus) => {
  if (currentFocus) return null;

  const recentInteractions = interactions.filter(
    (i) => Date.now() - i.createdAt < 30 * 60 * 1000, // last 30 minutes
  );

  if (recentInteractions.length > 5) {
    return {
      type: "focus_suggestion",
      message: "You've been interrupted frequently. Enable focus mode?",
      reason: `${recentInteractions.length} interactions in last 30 minutes`,
    };
  }

  return null;
};

const suggestBreak = (sessionDuration, interruptions) => {
  const hours = sessionDuration / (1000 * 60 * 60);

  if (hours > 4 && interruptions > 3) {
    return {
      type: "break_suggestion",
      message: "You've been working intensely. Consider a short break.",
      reason: `${Math.round(hours)} hours worked with ${interruptions} interruptions`,
    };
  }

  return null;
};

module.exports = {
  analyzeMessage,
  generateWorkPressureAlert,
  suggestFocusMode,
  suggestBreak,
};
