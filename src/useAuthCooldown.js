import { useEffect, useRef, useState } from 'react';

const MIN_REQUEST_INTERVAL_MS = 1200;
const FAILURE_LIMIT = 3;
const FAILURE_COOLDOWN_SECONDS = 30;

export default function useAuthCooldown() {
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [pending, setPending] = useState(false);
  const failures = useRef(0);
  const lastAttemptAt = useRef(0);
  const blockedUntil = useRef(0);
  const pendingRef = useRef(false);
  const cooldownActive = secondsRemaining > 0;

  useEffect(() => {
    if (!cooldownActive) return undefined;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((blockedUntil.current - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining === 0) window.clearInterval(timer);
    }, 250);
    return () => window.clearInterval(timer);
  }, [cooldownActive]);

  function beginAttempt() {
    const now = Date.now();
    if (pendingRef.current) return false;
    if (now < blockedUntil.current) return false;

    const nextAllowedAt = lastAttemptAt.current + MIN_REQUEST_INTERVAL_MS;
    if (lastAttemptAt.current > 0 && now < nextAllowedAt) {
      blockedUntil.current = nextAllowedAt;
      setSecondsRemaining(Math.ceil((nextAllowedAt - now) / 1000));
      return false;
    }

    lastAttemptAt.current = now;
    pendingRef.current = true;
    setPending(true);
    return true;
  }

  function recordFailure() {
    pendingRef.current = false;
    setPending(false);
    failures.current += 1;
    if (failures.current >= FAILURE_LIMIT) {
      blockedUntil.current = Date.now() + FAILURE_COOLDOWN_SECONDS * 1000;
      setSecondsRemaining(FAILURE_COOLDOWN_SECONDS);
      failures.current = 0;
    }
  }

  function recordSuccess() {
    pendingRef.current = false;
    setPending(false);
    failures.current = 0;
  }

  return { secondsRemaining, pending, beginAttempt, recordFailure, recordSuccess };
}
