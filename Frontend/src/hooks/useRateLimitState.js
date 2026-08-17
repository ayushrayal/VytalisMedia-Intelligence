import { useState, useEffect } from "react";

/**
 * Custom React hook for tracking API rate-limit state and managing live countdown timers.
 * Exposes remaining attempts, lock status, countdown string, and error handler.
 */
export const useRateLimitState = () => {
  const [rateLimit, setRateLimit] = useState(null); // { limit, remaining, reset, retryAfter }
  const [lockUntil, setLockUntil] = useState(null);
  const [countdownStr, setCountdownStr] = useState("");

  const isLocked = Boolean(lockUntil && lockUntil > Date.now());

  useEffect(() => {
    if (!lockUntil) {
      setCountdownStr("");
      return;
    }

    const updateCountdown = () => {
      const remainingMs = Math.max(0, lockUntil - Date.now());
      if (remainingMs <= 0) {
        setLockUntil(null);
        setRateLimit(null);
        setCountdownStr("");
        return;
      }

      const totalSeconds = Math.ceil(remainingMs / 1000);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      const formattedMins = String(mins).padStart(2, "0");
      const formattedSecs = String(secs).padStart(2, "0");

      setCountdownStr(`${formattedMins}:${formattedSecs}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [lockUntil]);

  /**
   * Processes API error to update rate-limit headers and trigger countdown lock if 429.
   *
   * @param {Error} err - Error object thrown by http client
   */
  const handleApiError = (err) => {
    if (err?.rateLimit) {
      setRateLimit(err.rateLimit);
    }

    if (err?.status === 429 || err?.rateLimit?.retryAfter) {
      const secondsToWait =
        err?.rateLimit?.retryAfter || err?.rateLimit?.reset || 900;
      setLockUntil(Date.now() + secondsToWait * 1000);
    }
  };

  return {
    rateLimit,
    isLocked,
    countdownStr,
    handleApiError,
    setRateLimit,
  };
};
