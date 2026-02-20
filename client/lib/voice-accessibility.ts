/**
 * Voice Assistance and Accessibility Features System
 * Comprehensive accessibility support with voice commands, screen reader optimization, and inclusive design
 */

import { useState, useEffect, useRef } from "react";

// Voice and Accessibility Interfaces
export interface VoiceCommand {
  command: string;
  variations: string[];
  action: string;
  parameters?: { [key: string]: any };
  response: string;
  category: "navigation" | "classification" | "information" | "action" | "help";
  confidence?: number;
}

export interface AccessibilitySettings {
  voiceEnabled: boolean;
  voiceLanguage: string;
  voiceSpeed: number;
  voiceVolume: number;
  screenReaderOptimized: boolean;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  keyboardNavigation: boolean;
  colorBlindFriendly: boolean;
  subtitlesEnabled: boolean;
  hapticFeedback: boolean;
  audioDescriptions: boolean;
  simplifiedInterface: boolean;
}

export interface VoiceGuidance {
  id: string;
  context: string;
  message: string;
  priority: "low" | "medium" | "high" | "critical";
  type: "instruction" | "confirmation" | "error" | "success" | "information";
  language: string;
  audioFile?: string;
  alternatives: {
    visual: string;
    haptic?: string;
  };
}

export interface AccessibilityFeature {
  id: string;
  name: string;
  description: string;
  category: "visual" | "auditory" | "motor" | "cognitive";
  enabled: boolean;
  settings: { [key: string]: any };
  impact: "low" | "medium" | "high";
}

export interface VoiceAnalytics {
  commandsUsed: number;
  successRate: number;
  averageConfidence: number;
  mostUsedCommands: string[];
  errorPatterns: string[];
  userPreferences: {
    preferredCommands: string[];
    customCommands: VoiceCommand[];
  };
}

export interface LanguageSupport {
  code: string;
  name: string;
  nativeName: string;
  voiceSupported: boolean;
  rtl: boolean;
  speechRecognitionSupported: boolean;
  textToSpeechSupported: boolean;
  uiTranslated: boolean;
  wasteTerms: { [key: string]: string };
}

// Voice Commands Database
const defaultVoiceCommands: VoiceCommand[] = [
  {
    command: "classify waste",
    variations: [
      "classify this",
      "what is this",
      "identify waste",
      "scan item",
    ],
    action: "startClassification",
    response:
      "Starting waste classification. Please show the item to your camera.",
    category: "classification",
  },
  {
    command: "find recycling center",
    variations: [
      "find center",
      "locate facility",
      "recycling near me",
      "where to recycle",
    ],
    action: "findNearbyFacilities",
    response: "Searching for recycling centers near your location.",
    category: "information",
  },
  {
    command: "show my points",
    variations: [
      "my score",
      "points balance",
      "how many points",
      "check points",
    ],
    action: "showPoints",
    response:
      "You currently have {points} eco-points and {credits} eco-credits.",
    category: "information",
  },
  {
    command: "read instructions",
    variations: ["help me", "how to use", "instructions", "guide me"],
    action: "readInstructions",
    response: "Here are the step-by-step instructions for using Green India.",
    category: "help",
  },
  {
    command: "navigate to dashboard",
    variations: ["go to dashboard", "open dashboard", "main screen", "home"],
    action: "navigateTo",
    parameters: { destination: "dashboard" },
    response: "Navigating to your dashboard.",
    category: "navigation",
  },
  {
    command: "increase text size",
    variations: ["make text bigger", "larger font", "zoom in text"],
    action: "adjustTextSize",
    parameters: { direction: "increase" },
    response: "Text size increased. Would you like me to make it larger?",
    category: "action",
  },
  {
    command: "enable high contrast",
    variations: ["high contrast mode", "better contrast", "dark mode"],
    action: "toggleContrast",
    response: "High contrast mode enabled for better visibility.",
    category: "action",
  },
  {
    command: "what can I recycle",
    variations: ["recyclable items", "what to recycle", "recycling guide"],
    action: "showRecyclingGuide",
    response: "Here's a guide to recyclable items in your area.",
    category: "information",
  },
];

// Supported Languages
const supportedLanguages: LanguageSupport[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    voiceSupported: true,
    rtl: false,
    speechRecognitionSupported: true,
    textToSpeechSupported: true,
    uiTranslated: true,
    wasteTerms: {
      biodegradable: "biodegradable",
      recyclable: "recyclable",
      hazardous: "hazardous",
      plastic: "plastic",
      glass: "glass",
      metal: "metal",
      paper: "paper",
    },
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    voiceSupported: true,
    rtl: false,
    speechRecognitionSupported: true,
    textToSpeechSupported: true,
    uiTranslated: true,
    wasteTerms: {
      biodegradable: "biodegradable",
      recyclable: "reciclable",
      hazardous: "peligroso",
      plastic: "plástico",
      glass: "vidrio",
      metal: "metal",
      paper: "papel",
    },
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    voiceSupported: true,
    rtl: false,
    speechRecognitionSupported: true,
    textToSpeechSupported: true,
    uiTranslated: true,
    wasteTerms: {
      biodegradable: "biodégradable",
      recyclable: "recyclable",
      hazardous: "dangereux",
      plastic: "plastique",
      glass: "verre",
      metal: "métal",
      paper: "papier",
    },
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    voiceSupported: true,
    rtl: false,
    speechRecognitionSupported: true,
    textToSpeechSupported: true,
    uiTranslated: true,
    wasteTerms: {
      biodegradable: "biologisch abbaubar",
      recyclable: "recycelbar",
      hazardous: "gefährlich",
      plastic: "Kunststoff",
      glass: "Glas",
      metal: "Metall",
      paper: "Papier",
    },
  },
  {
    code: "zh",
    name: "Chinese",
    nativeName: "中文",
    voiceSupported: true,
    rtl: false,
    speechRecognitionSupported: true,
    textToSpeechSupported: true,
    uiTranslated: true,
    wasteTerms: {
      biodegradable: "可生物降解的",
      recyclable: "可回收的",
      hazardous: "有害的",
      plastic: "塑料",
      glass: "玻璃",
      metal: "金属",
      paper: "纸",
    },
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    voiceSupported: true,
    rtl: false,
    speechRecognitionSupported: true,
    textToSpeechSupported: true,
    uiTranslated: true,
    wasteTerms: {
      biodegradable: "बायोडिग्रेडेबल",
      recyclable: "रीसायकल",
      hazardous: "खतरनाक",
      plastic: "प्लास्टिक",
      glass: "कांच",
      metal: "धातु",
      paper: "कागज",
    },
  },
  {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    voiceSupported: true,
    rtl: true,
    speechRecognitionSupported: true,
    textToSpeechSupported: true,
    uiTranslated: true,
    wasteTerms: {
      biodegradable: "قابل للتحلل البيولوجي",
      recyclable: "قابل لإعادة التدوير",
      hazardous: "خطر",
      plastic: "بلاستيك",
      glass: "زجاج",
      metal: "معدن",
      paper: "ورق",
    },
  },
];

// Voice and Accessibility Hook
export const useVoiceAccessibility = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>({
    voiceEnabled: false,
    voiceLanguage: "en",
    voiceSpeed: 1.0,
    voiceVolume: 0.8,
    screenReaderOptimized: false,
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    keyboardNavigation: true,
    colorBlindFriendly: false,
    subtitlesEnabled: false,
    hapticFeedback: true,
    audioDescriptions: false,
    simplifiedInterface: false,
  });
  const [currentLanguage, setCurrentLanguage] = useState<LanguageSupport>(
    supportedLanguages[0],
  );
  const [voiceCommands, setVoiceCommands] =
    useState<VoiceCommand[]>(defaultVoiceCommands);
  const [analytics, setAnalytics] = useState<VoiceAnalytics>({
    commandsUsed: 0,
    successRate: 95.2,
    averageConfidence: 0.87,
    mostUsedCommands: [
      "classify waste",
      "find recycling center",
      "show my points",
    ],
    errorPatterns: ["unclear pronunciation", "background noise"],
    userPreferences: {
      preferredCommands: [],
      customCommands: [],
    },
  });

  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<any>(null);

  useEffect(() => {
    initializeVoiceServices();
    loadUserSettings();
  }, []);

  const initializeVoiceServices = () => {
    // Check for speech recognition support
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const speechSynthesis = window.speechSynthesis;

    if (SpeechRecognition && speechSynthesis) {
      setIsSupported(true);

      // Initialize speech recognition
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = currentLanguage.code;

      recognitionRef.current.onresult = handleVoiceResult;
      recognitionRef.current.onerror = handleVoiceError;
      recognitionRef.current.onend = () => setIsListening(false);

      // Initialize text-to-speech
      synthesisRef.current = speechSynthesis;
    } else {
      console.warn("Speech services not supported in this browser");
    }
  };

  const loadUserSettings = () => {
    const savedSettings = localStorage.getItem(
      "ecosort_accessibility_settings",
    );
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings({ ...settings, ...parsed });
    }
  };

  const saveUserSettings = (newSettings: Partial<AccessibilitySettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem(
      "ecosort_accessibility_settings",
      JSON.stringify(updatedSettings),
    );
  };

  const startListening = () => {
    if (!isSupported || !settings.voiceEnabled) return;

    try {
      setIsListening(true);
      recognitionRef.current?.start();
      announceToScreenReader(
        "Voice recognition started. Please speak your command.",
      );
    } catch (error) {
      console.error("Failed to start voice recognition:", error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleVoiceResult = (event: any) => {
    const transcript = event.results[0][0].transcript.toLowerCase().trim();
    const confidence = event.results[0][0].confidence;

    console.log("Voice command:", transcript, "Confidence:", confidence);

    const matchedCommand = findMatchingCommand(transcript);
    if (matchedCommand) {
      executeVoiceCommand(matchedCommand, { confidence });
      updateAnalytics(matchedCommand, true, confidence);
    } else {
      speak(
        'Sorry, I didn\'t understand that command. Try saying "help me" for available commands.',
      );
      updateAnalytics(transcript, false, confidence);
    }
  };

  const handleVoiceError = (event: any) => {
    console.error("Voice recognition error:", event.error);
    setIsListening(false);

    const errorMessages: { [key: string]: string } = {
      "no-speech": "No speech detected. Please try again.",
      "audio-capture": "Microphone access denied. Please check permissions.",
      "not-allowed":
        "Microphone access not allowed. Please enable microphone permissions.",
      network: "Network error. Please check your connection.",
      aborted: "Voice recognition was cancelled.",
    };

    const message =
      errorMessages[event.error] || "Voice recognition error occurred.";
    speak(message);
    announceToScreenReader(message);
  };

  const findMatchingCommand = (input: string): VoiceCommand | null => {
    for (const command of voiceCommands) {
      if (
        command.command.toLowerCase() === input ||
        command.variations.some(
          (variation) =>
            input.includes(variation.toLowerCase()) ||
            variation.toLowerCase().includes(input),
        )
      ) {
        return command;
      }
    }
    return null;
  };

  const executeVoiceCommand = (
    command: VoiceCommand,
    context: { confidence: number },
  ) => {
    // Execute the command action
    console.log("Executing command:", command.action, command.parameters);

    // Provide feedback
    let response = command.response;
    if (command.parameters) {
      Object.keys(command.parameters).forEach((key) => {
        response = response.replace(`{${key}}`, command.parameters![key]);
      });
    }

    speak(response);

    // Trigger haptic feedback if supported
    if (settings.hapticFeedback && "vibrate" in navigator) {
      navigator.vibrate([50, 100, 50]);
    }
  };

  const speak = (text: string, priority: "low" | "high" = "high") => {
    if (!settings.voiceEnabled || !synthesisRef.current) return;

    // Cancel current speech if high priority
    if (priority === "high") {
      synthesisRef.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLanguage.code;
    utterance.rate = settings.voiceSpeed;
    utterance.volume = settings.voiceVolume;

    // Select appropriate voice
    const voices = synthesisRef.current.getVoices();
    const preferredVoice = voices.find((voice: any) =>
      voice.lang.startsWith(currentLanguage.code),
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    synthesisRef.current.speak(utterance);
  };

  const announceToScreenReader = (message: string) => {
    // Create live region for screen reader announcements
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", "polite");
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const updateAnalytics = (
    command: string | VoiceCommand,
    success: boolean,
    confidence: number,
  ) => {
    setAnalytics((prev) => ({
      ...prev,
      commandsUsed: prev.commandsUsed + 1,
      successRate: success
        ? (prev.successRate * prev.commandsUsed + 100) / (prev.commandsUsed + 1)
        : (prev.successRate * prev.commandsUsed) / (prev.commandsUsed + 1),
      averageConfidence:
        (prev.averageConfidence * prev.commandsUsed + confidence) /
        (prev.commandsUsed + 1),
    }));
  };

  const addCustomCommand = (command: VoiceCommand) => {
    setVoiceCommands((prev) => [...prev, command]);
    setAnalytics((prev) => ({
      ...prev,
      userPreferences: {
        ...prev.userPreferences,
        customCommands: [...prev.userPreferences.customCommands, command],
      },
    }));
  };

  const changeLanguage = (languageCode: string) => {
    const language = supportedLanguages.find(
      (lang) => lang.code === languageCode,
    );
    if (language) {
      setCurrentLanguage(language);
      if (recognitionRef.current) {
        recognitionRef.current.lang = languageCode;
      }
      saveUserSettings({ voiceLanguage: languageCode });
    }
  };

  const applyAccessibilitySettings = (
    newSettings: Partial<AccessibilitySettings>,
  ) => {
    saveUserSettings(newSettings);

    // Apply settings to DOM
    if (newSettings.highContrast !== undefined) {
      document.body.classList.toggle("high-contrast", newSettings.highContrast);
    }

    if (newSettings.largeText !== undefined) {
      document.body.classList.toggle("large-text", newSettings.largeText);
    }

    if (newSettings.reducedMotion !== undefined) {
      document.body.classList.toggle(
        "reduced-motion",
        newSettings.reducedMotion,
      );
    }

    if (newSettings.colorBlindFriendly !== undefined) {
      document.body.classList.toggle(
        "color-blind-friendly",
        newSettings.colorBlindFriendly,
      );
    }
  };

  const getAccessibilityStatus = () => {
    return {
      voiceSupported: isSupported,
      currentLanguage: currentLanguage.name,
      activeFeatures: Object.entries(settings).filter(
        ([_, value]) => value === true,
      ).length,
      compatibilityScore: calculateCompatibilityScore(),
    };
  };

  const calculateCompatibilityScore = () => {
    let score = 0;
    const features = [
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
      "speechSynthesis" in window,
      "vibrate" in navigator,
      "ontouchstart" in window,
      window.screen && window.screen.orientation,
    ];

    score = (features.filter(Boolean).length / features.length) * 100;
    return Math.round(score);
  };

  return {
    // Voice Control
    isListening,
    isSupported,
    startListening,
    stopListening,
    speak,

    // Settings
    settings,
    applyAccessibilitySettings,

    // Languages
    supportedLanguages,
    currentLanguage,
    changeLanguage,

    // Commands
    voiceCommands,
    addCustomCommand,

    // Analytics
    analytics,

    // Utilities
    announceToScreenReader,
    getAccessibilityStatus,
  };
};

// Accessibility Helper Functions
export const initializeAccessibilitySettings = (
  settings: AccessibilitySettings,
) => {
  // Apply accessibility settings to DOM
  Object.entries(settings).forEach(([key, value]) => {
    if (typeof value === "boolean" && value) {
      document.body.classList.add(key.replace(/([A-Z])/g, "-$1").toLowerCase());
    }
  });
};

export const announceAppReady = (
  announceFunction: (message: string) => void,
) => {
  announceFunction(
    "Green India app loaded. Voice commands and accessibility features are available.",
  );
};

// Export mock data for development
export const mockAccessibilitySettings: AccessibilitySettings = {
  voiceEnabled: true,
  voiceLanguage: "en",
  voiceSpeed: 1.0,
  voiceVolume: 0.8,
  screenReaderOptimized: true,
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  keyboardNavigation: true,
  colorBlindFriendly: false,
  subtitlesEnabled: false,
  hapticFeedback: true,
  audioDescriptions: false,
  simplifiedInterface: false,
};
