export type InterviewVoiceId = "male_soft" | "male_bold" | "female_soft" | "female_bold";

export interface InterviewVoiceConfig {
  id: InterviewVoiceId;
  name: string;
  role: string;
  gender: "male" | "female";
  tone: "soft" | "bold";
  tagline: string;
  badge: string;
  focus: string;
  pitch: number;
  rate: number;
  previewText: string;
  preferredVoices: string[];
}

export const INTERVIEW_VOICES: Record<InterviewVoiceId, InterviewVoiceConfig> = {
  male_soft: {
    id: "male_soft",
    name: "Alex",
    role: "Staff Software Engineer",
    gender: "male",
    tone: "soft",
    tagline: "Soft Male Voice · Calm & Patient",
    badge: "Soft & Socratic",
    focus: "Algorithmic correctness, Big-O trade-offs, and boundary edge cases.",
    pitch: 0.92,
    rate: 0.95,
    previewText: "Hello! I'm Alex. Let's take our time, think out loud, and build a clean solution together.",
    preferredVoices: [
      "Microsoft David",
      "Microsoft George",
      "Google UK English Male",
      "Google US English",
      "David",
      "George",
      "Male"
    ]
  },
  male_bold: {
    id: "male_bold",
    name: "Marcus",
    role: "Principal Systems Architect",
    gender: "male",
    tone: "bold",
    tagline: "Bold Male Voice · Deep & Authoritative",
    badge: "Bold & Rigorous",
    focus: "Production scalability, fault tolerance, and clean error handling.",
    pitch: 0.82,
    rate: 1.05,
    previewText: "Hello, I'm Marcus. Let's see how your architecture scales under real production load.",
    preferredVoices: [
      "Microsoft Mark",
      "Microsoft Guy",
      "Google US English",
      "Mark",
      "Guy",
      "Male"
    ]
  },
  female_soft: {
    id: "female_soft",
    name: "Sarah",
    role: "Engineering Team Lead",
    gender: "female",
    tone: "soft",
    tagline: "Soft Female Voice · Gentle & Encouraging",
    badge: "Soft & Supportive",
    focus: "Communication clarity, modular abstractions, and systematic decomposition.",
    pitch: 1.20,
    rate: 0.96,
    previewText: "Hi there, I'm Sarah! I'm excited to hear your thoughts and walk through your approach today.",
    preferredVoices: [
      "Microsoft Zira",
      "Microsoft Jenny",
      "Google UK English Female",
      "Zira",
      "Jenny",
      "Samantha",
      "Female"
    ]
  },
  female_bold: {
    id: "female_bold",
    name: "Elena",
    role: "Director of Engineering",
    gender: "female",
    tone: "bold",
    tagline: "Bold Female Voice · Crisp & Executive",
    badge: "Bold & Decisive",
    focus: "Executive architectural invariants, system bottlenecks, and decisive engineering trade-offs.",
    pitch: 1.02,
    rate: 1.08,
    previewText: "Welcome, I'm Elena. Focus on optimal invariants, clean modular boundaries, and solid trade-offs.",
    preferredVoices: [
      "Microsoft Aria",
      "Microsoft Susan",
      "Google US English Female",
      "Victoria",
      "Aria",
      "Susan",
      "Female"
    ]
  }
};

export const INTERVIEW_VOICE_LIST = Object.values(INTERVIEW_VOICES);

/**
 * Finds the most suitable SpeechSynthesisVoice for the target voice profile
 */
export function matchSpeechVoice(
  config: InterviewVoiceConfig,
  availableVoices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (!availableVoices || availableVoices.length === 0) return null;

  const englishVoices = availableVoices.filter((v) => v.lang.startsWith("en"));
  const pool = englishVoices.length > 0 ? englishVoices : availableVoices;

  // 1. Try exact preferred names
  for (const pref of config.preferredVoices) {
    const found = pool.find((v) => v.name.toLowerCase().includes(pref.toLowerCase()));
    if (found) return found;
  }

  // 2. Gender-based matching
  if (config.gender === "female") {
    const femaleVoice = pool.find((v) => {
      const n = v.name.toLowerCase();
      return (
        n.includes("female") ||
        n.includes("woman") ||
        n.includes("zira") ||
        n.includes("jenny") ||
        n.includes("aria") ||
        n.includes("susan") ||
        n.includes("samantha") ||
        n.includes("victoria")
      );
    });
    if (femaleVoice) return femaleVoice;
  } else {
    const maleVoice = pool.find((v) => {
      const n = v.name.toLowerCase();
      return (
        (n.includes("male") && !n.includes("female")) ||
        n.includes("david") ||
        n.includes("mark") ||
        n.includes("george") ||
        n.includes("guy")
      );
    });
    if (maleVoice) return maleVoice;
  }

  // 3. Fallback to any english voice
  return pool[0] || null;
}

/**
 * Synthesizes and speaks text aloud using the specified voice persona
 */
export function playInterviewVoice(params: {
  text: string;
  voiceId?: InterviewVoiceId;
  onStart?: () => void;
  onEnd?: () => void;
}): SpeechSynthesisUtterance | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }

  try {
    // Cancel any previous speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    window.speechSynthesis.resume();

    const voiceId = params.voiceId || "male_soft";
    const config = INTERVIEW_VOICES[voiceId] || INTERVIEW_VOICES.male_soft;

    // Clean markdown and code symbols
    const cleanText = params.text
      .replace(/```[\s\S]*?```/g, "Code block in editor.")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[*_#\[\]]/g, "")
      .trim();

    if (!cleanText) return null;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.pitch = config.pitch;
    utterance.rate = config.rate;

    const allVoices = window.speechSynthesis.getVoices();
    const matchedVoice = matchSpeechVoice(config, allVoices);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    let hasEnded = false;
    const finish = () => {
      if (!hasEnded) {
        hasEnded = true;
        if (params.onEnd) params.onEnd();
      }
    };

    // Watchdog timer: safety net so 'speaking' state never hangs
    const wordCount = cleanText.split(/\s+/).length;
    const estDurationMs = Math.max(3000, (wordCount / (2.2 * config.rate)) * 1000 + 1500);
    const watchdogTimer = setTimeout(() => {
      finish();
    }, estDurationMs);

    utterance.onstart = () => {
      if (params.onStart) params.onStart();
    };

    utterance.onend = () => {
      clearTimeout(watchdogTimer);
      finish();
    };

    utterance.onerror = (e) => {
      clearTimeout(watchdogTimer);
      finish();
    };

    // Chromium Garbage Collection Bug Guard
    (window as any).__activeUtterance = utterance;

    window.speechSynthesis.speak(utterance);
    return utterance;
  } catch (err) {
    console.warn("Speech synthesis notice:", err);
    if (params.onEnd) params.onEnd();
    return null;
  }
}
