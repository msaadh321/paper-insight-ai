import { useState, useRef, useCallback, useEffect } from "react";
import { Volume2, VolumeX, Pause, Play, RotateCcw } from "lucide-react";

interface TextToSpeechProps {
  text: string;
  label?: string;
}

export function TextToSpeech({ text, label = "Listen" }: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      stopTracking();
    };
  }, [stopTracking]);

  const handlePlay = useCallback(() => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.lang = "en-US";

    // Try to pick a natural-sounding voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha")
    );
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => {
      setIsPlaying(true);
      setProgress(0);
    };
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
      stopTracking();
      setTimeout(() => setProgress(0), 1500);
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      stopTracking();
    };

    utteranceRef.current = utterance;

    // Approximate progress tracking
    const words = text.split(/\s+/).length;
    const estimatedDuration = (words / 2.5) * 1000; // ~150 wpm
    const startTime = Date.now();
    stopTracking();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / estimatedDuration) * 100, 95);
      setProgress(pct);
    }, 200);

    window.speechSynthesis.speak(utterance);
  }, [text, isPaused, stopTracking]);

  const handlePause = useCallback(() => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
    stopTracking();
  }, [stopTracking]);

  const handleStop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    stopTracking();
  }, [stopTracking]);

  return (
    <div className="flex items-center gap-2">
      {!isPlaying && !isPaused && (
        <button
          onClick={handlePlay}
          className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors group"
          title={label}
        >
          <Volume2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      )}

      {(isPlaying || isPaused) && (
        <div className="flex items-center gap-1.5">
          {isPlaying ? (
            <button onClick={handlePause} className="p-1 text-primary hover:text-primary/80 transition-colors" title="Pause">
              <Pause className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={handlePlay} className="p-1 text-primary hover:text-primary/80 transition-colors" title="Resume">
              <Play className="h-4 w-4" />
            </button>
          )}
          <button onClick={handleStop} className="p-1 text-muted-foreground hover:text-foreground transition-colors" title="Stop">
            <VolumeX className="h-4 w-4" />
          </button>

          {/* Progress bar */}
          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
