import { useEffect, useRef, useState } from 'react';

export function useSimulationPlayer(totalWeeks: number, speed: number = 1) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const STEP_INTERVAL_MS = 600 / speed;

  const play = () => setPlaying(true);
  const pause = () => setPlaying(false);
  const reset = () => {
    setPlaying(false);
    setCurrentStep(-1);
  };

  useEffect(() => {
    if (!playing || totalWeeks <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= totalWeeks - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, STEP_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, speed, totalWeeks]);

  return { currentStep, playing, play, pause, reset };
}
