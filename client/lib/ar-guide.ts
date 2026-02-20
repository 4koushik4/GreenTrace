/**
 * Augmented Reality Waste Sorting Guide System
 * AR camera overlay for interactive waste sorting education and guidance
 */

import { useState, useEffect, useRef } from "react";

// AR Guide Interfaces
export interface ARSession {
  id: string;
  active: boolean;
  mode: "sorting" | "education" | "game" | "assessment";
  camera: {
    stream: MediaStream | null;
    resolution: { width: number; height: number };
    facing: "user" | "environment";
  };
  tracking: {
    objectsDetected: DetectedObject[];
    binsDetected: DetectedBin[];
    accuracy: number;
  };
  overlay: {
    elements: AROverlayElement[];
    animations: ARAnimation[];
  };
}

export interface DetectedObject {
  id: string;
  type: "waste_item" | "bin" | "hand" | "surface";
  wasteCategory?: "biodegradable" | "recyclable" | "hazardous";
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  classification?: {
    material: string;
    subtype: string;
    disposal_method: string;
  };
  suggestions: string[];
}

export interface DetectedBin {
  id: string;
  type: "biodegradable" | "recyclable" | "hazardous" | "general";
  color: string;
  position: { x: number; y: number; z: number };
  confidence: number;
  capacity: number;
  status: "available" | "full" | "contaminated";
}

export interface AROverlayElement {
  id: string;
  type: "arrow" | "label" | "animation" | "tutorial" | "feedback";
  position: { x: number; y: number };
  content: string;
  style: {
    color: string;
    size: number;
    opacity: number;
    animation?: string;
  };
  duration?: number;
  targetObject?: string;
}

export interface ARAnimation {
  id: string;
  type: "highlight" | "path" | "celebration" | "warning";
  target: string;
  keyframes: AnimationKeyframe[];
  duration: number;
  loop: boolean;
}

export interface AnimationKeyframe {
  time: number;
  properties: { [key: string]: any };
}

export interface AREducationContent {
  id: string;
  title: string;
  description: string;
  category: "basics" | "advanced" | "materials" | "tips";
  difficulty: "beginner" | "intermediate" | "expert";
  content: {
    steps: ARStep[];
    quizzes: ARQuiz[];
    demonstrations: ARDemo[];
  };
  prerequisites?: string[];
  estimatedTime: number;
  points: number;
}

export interface ARStep {
  id: string;
  instruction: string;
  visualCue: string;
  interactionRequired: boolean;
  validationCriteria: string[];
  hints: string[];
  voiceGuidance?: string;
}

export interface ARQuiz {
  id: string;
  question: string;
  type: "multiple_choice" | "drag_drop" | "object_identification";
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  arContext: boolean;
}

export interface ARDemo {
  id: string;
  title: string;
  animation: string;
  narration: string;
  duration: number;
  interactive: boolean;
}

export interface ARGameMode {
  id: string;
  name: string;
  description: string;
  type:
    | "speed_sorting"
    | "accuracy_challenge"
    | "memory_game"
    | "scavenger_hunt";
  difficulty: "easy" | "medium" | "hard";
  rules: string[];
  scoring: {
    basePoints: number;
    timeBonus: boolean;
    accuracyMultiplier: number;
    penaltyForErrors: number;
  };
  powerUps: ARPowerUp[];
  leaderboard: boolean;
}

export interface ARPowerUp {
  id: string;
  name: string;
  description: string;
  effect: string;
  duration: number;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

// AR Waste Sorting Hook
export const useARWasteSorting = () => {
  const [session, setSession] = useState<ARSession | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [educationContent, setEducationContent] = useState<
    AREducationContent[]
  >([]);
  const [gameModes, setGameModes] = useState<ARGameMode[]>([]);
  const [currentScore, setCurrentScore] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionWorkerRef = useRef<Worker | null>(null);

  useEffect(() => {
    checkARSupport();
    loadEducationContent();
    loadGameModes();

    return () => {
      stopARSession();
    };
  }, []);

  const checkARSupport = () => {
    const hasCamera =
      "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices;
    const hasWebGL = !!document.createElement("canvas").getContext("webgl");
    const hasWorkers = typeof Worker !== "undefined";

    setIsSupported(hasCamera && hasWebGL && hasWorkers);
  };

  const startARSession = async (mode: ARSession["mode"] = "sorting") => {
    if (!isSupported) {
      throw new Error("AR features not supported on this device");
    }

    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      // Initialize video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Create AR session
      const newSession: ARSession = {
        id: `ar-session-${Date.now()}`,
        active: true,
        mode,
        camera: {
          stream,
          resolution: { width: 1280, height: 720 },
          facing: "environment",
        },
        tracking: {
          objectsDetected: [],
          binsDetected: [],
          accuracy: 0,
        },
        overlay: {
          elements: [],
          animations: [],
        },
      };

      setSession(newSession);
      setIsInitialized(true);

      // Start object detection
      startObjectDetection();

      // Show initial guidance
      addOverlayElement({
        id: "welcome",
        type: "label",
        position: { x: 50, y: 10 },
        content: "Point your camera at waste items to get sorting guidance",
        style: { color: "#ffffff", size: 18, opacity: 0.9 },
      });
    } catch (error) {
      console.error("Failed to start AR session:", error);
      throw error;
    }
  };

  const stopARSession = () => {
    if (session?.camera.stream) {
      session.camera.stream.getTracks().forEach((track) => track.stop());
    }

    if (detectionWorkerRef.current) {
      detectionWorkerRef.current.terminate();
    }

    setSession(null);
    setIsInitialized(false);
  };

  const startObjectDetection = () => {
    // Initialize detection worker
    detectionWorkerRef.current = new Worker("/workers/waste-detection.js");

    detectionWorkerRef.current.onmessage = (event) => {
      const { type, data } = event.data;

      switch (type) {
        case "objects_detected":
          handleObjectsDetected(data.objects);
          break;
        case "bins_detected":
          handleBinsDetected(data.bins);
          break;
        default:
          break;
      }
    };

    // Start detection loop
    const detectFrame = () => {
      if (videoRef.current && canvasRef.current && session?.active) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          // Capture frame
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0);

          // Send to worker for analysis
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          detectionWorkerRef.current?.postMessage({
            type: "detect_frame",
            imageData,
            timestamp: Date.now(),
          });
        }

        requestAnimationFrame(detectFrame);
      }
    };

    detectFrame();
  };

  const handleObjectsDetected = (objects: DetectedObject[]) => {
    if (!session) return;

    setSession((prev) =>
      prev
        ? {
            ...prev,
            tracking: {
              ...prev.tracking,
              objectsDetected: objects,
            },
          }
        : null,
    );

    // Process detected objects
    objects.forEach((obj) => {
      if (obj.type === "waste_item" && obj.confidence > 0.7) {
        showWasteGuidance(obj);
      }
    });
  };

  const handleBinsDetected = (bins: DetectedBin[]) => {
    if (!session) return;

    setSession((prev) =>
      prev
        ? {
            ...prev,
            tracking: {
              ...prev.tracking,
              binsDetected: bins,
            },
          }
        : null,
    );

    // Show bin indicators
    bins.forEach((bin) => {
      addOverlayElement({
        id: `bin-${bin.id}`,
        type: "label",
        position: { x: bin.position.x, y: bin.position.y },
        content: `${bin.type.toUpperCase()} BIN`,
        style: {
          color: getBinColor(bin.type),
          size: 16,
          opacity: 0.8,
        },
      });
    });
  };

  const showWasteGuidance = (wasteObject: DetectedObject) => {
    if (!wasteObject.wasteCategory) return;

    // Find appropriate bin
    const appropriateBin = session?.tracking.binsDetected.find(
      (bin) => bin.type === wasteObject.wasteCategory,
    );

    if (appropriateBin) {
      // Show arrow pointing to correct bin
      addArrowOverlay(wasteObject, appropriateBin);

      // Show classification info
      addOverlayElement({
        id: `info-${wasteObject.id}`,
        type: "label",
        position: {
          x: wasteObject.boundingBox.x,
          y: wasteObject.boundingBox.y - 30,
        },
        content: `${wasteObject.classification?.material || "Item"} → ${wasteObject.wasteCategory}`,
        style: { color: "#00ff00", size: 14, opacity: 0.9 },
        duration: 3000,
      });

      // Provide suggestions
      if (wasteObject.suggestions.length > 0) {
        showSuggestionPopup(wasteObject.suggestions);
      }
    } else {
      // No appropriate bin found
      addOverlayElement({
        id: `warning-${wasteObject.id}`,
        type: "feedback",
        position: {
          x: wasteObject.boundingBox.x,
          y: wasteObject.boundingBox.y,
        },
        content: "No appropriate bin detected",
        style: { color: "#ff6600", size: 14, opacity: 0.9 },
        duration: 2000,
      });
    }
  };

  const addArrowOverlay = (fromObject: DetectedObject, toBin: DetectedBin) => {
    const arrow: AROverlayElement = {
      id: `arrow-${fromObject.id}-${toBin.id}`,
      type: "arrow",
      position: {
        x: fromObject.boundingBox.x + fromObject.boundingBox.width / 2,
        y: fromObject.boundingBox.y + fromObject.boundingBox.height / 2,
      },
      content: "→",
      style: {
        color: getBinColor(toBin.type),
        size: 24,
        opacity: 0.8,
        animation: "pulse",
      },
      duration: 3000,
      targetObject: toBin.id,
    };

    addOverlayElement(arrow);
  };

  const addOverlayElement = (element: AROverlayElement) => {
    setSession((prev) => {
      if (!prev) return null;

      const newElements = [...prev.overlay.elements, element];

      // Auto-remove elements with duration
      if (element.duration) {
        setTimeout(() => {
          removeOverlayElement(element.id);
        }, element.duration);
      }

      return {
        ...prev,
        overlay: {
          ...prev.overlay,
          elements: newElements,
        },
      };
    });
  };

  const removeOverlayElement = (elementId: string) => {
    setSession((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        overlay: {
          ...prev.overlay,
          elements: prev.overlay.elements.filter((el) => el.id !== elementId),
        },
      };
    });
  };

  const showSuggestionPopup = (suggestions: string[]) => {
    // Implementation for showing contextual suggestions
    console.log("Showing suggestions:", suggestions);
  };

  const getBinColor = (binType: string): string => {
    const colors = {
      biodegradable: "#4ade80",
      recyclable: "#3b82f6",
      hazardous: "#ef4444",
      general: "#6b7280",
    };
    return colors[binType as keyof typeof colors] || "#6b7280";
  };

  const startEducationMode = async (contentId: string) => {
    const content = educationContent.find((c) => c.id === contentId);
    if (!content) return;

    await startARSession("education");

    // Show education overlay
    addOverlayElement({
      id: "education-title",
      type: "label",
      position: { x: 50, y: 5 },
      content: content.title,
      style: { color: "#ffffff", size: 20, opacity: 0.9 },
    });

    // Start first step
    if (content.content.steps.length > 0) {
      showEducationStep(content.content.steps[0]);
    }
  };

  const showEducationStep = (step: ARStep) => {
    addOverlayElement({
      id: `step-${step.id}`,
      type: "tutorial",
      position: { x: 10, y: 80 },
      content: step.instruction,
      style: { color: "#ffffff", size: 16, opacity: 0.9 },
    });

    if (step.hints.length > 0) {
      step.hints.forEach((hint, index) => {
        addOverlayElement({
          id: `hint-${step.id}-${index}`,
          type: "label",
          position: { x: 10, y: 85 + index * 5 },
          content: `💡 ${hint}`,
          style: { color: "#fbbf24", size: 14, opacity: 0.8 },
        });
      });
    }
  };

  const startGameMode = async (gameId: string) => {
    const game = gameModes.find((g) => g.id === gameId);
    if (!game) return;

    await startARSession("game");
    setCurrentScore(0);

    // Show game UI
    addOverlayElement({
      id: "game-title",
      type: "label",
      position: { x: 50, y: 5 },
      content: game.name,
      style: { color: "#ffffff", size: 22, opacity: 0.9 },
    });

    addOverlayElement({
      id: "score",
      type: "label",
      position: { x: 85, y: 5 },
      content: `Score: ${currentScore}`,
      style: { color: "#fbbf24", size: 18, opacity: 0.9 },
    });

    // Start game logic based on type
    switch (game.type) {
      case "speed_sorting":
        startSpeedSortingGame(game);
        break;
      case "accuracy_challenge":
        startAccuracyChallenge(game);
        break;
      default:
        console.log("Game mode not implemented:", game.type);
    }
  };

  const startSpeedSortingGame = (game: ARGameMode) => {
    // Implementation for speed sorting game
    console.log("Starting speed sorting game:", game.name);
  };

  const startAccuracyChallenge = (game: ARGameMode) => {
    // Implementation for accuracy challenge
    console.log("Starting accuracy challenge:", game.name);
  };

  const loadEducationContent = () => {
    // Load AR education content
    setEducationContent(mockEducationContent);
  };

  const loadGameModes = () => {
    // Load AR game modes
    setGameModes(mockGameModes);
  };

  return {
    // Session management
    session,
    isSupported,
    isInitialized,
    startARSession,
    stopARSession,

    // Education
    educationContent,
    startEducationMode,

    // Games
    gameModes,
    startGameMode,
    currentScore,
    achievements,

    // Overlay management
    addOverlayElement,
    removeOverlayElement,

    // Refs for video and canvas
    videoRef,
    canvasRef,
  };
};

// Mock data for development
const mockEducationContent: AREducationContent[] = [
  {
    id: "basics-1",
    title: "Waste Sorting Basics",
    description: "Learn the fundamentals of proper waste sorting",
    category: "basics",
    difficulty: "beginner",
    content: {
      steps: [
        {
          id: "step-1",
          instruction: "Point your camera at a plastic bottle",
          visualCue: "Look for plastic recycling symbol",
          interactionRequired: true,
          validationCriteria: ["plastic object detected"],
          hints: [
            "Look for the recycling symbol",
            "Check the bottom of the bottle",
          ],
        },
      ],
      quizzes: [],
      demonstrations: [],
    },
    estimatedTime: 300,
    points: 50,
  },
];

const mockGameModes: ARGameMode[] = [
  {
    id: "speed-sort-1",
    name: "Speed Sorting Challenge",
    description: "Sort as many items as possible in 60 seconds",
    type: "speed_sorting",
    difficulty: "medium",
    rules: ["Sort items quickly and accurately", "Wrong sorts lose points"],
    scoring: {
      basePoints: 10,
      timeBonus: true,
      accuracyMultiplier: 1.5,
      penaltyForErrors: 5,
    },
    powerUps: [],
    leaderboard: true,
  },
];

export { mockEducationContent, mockGameModes };
