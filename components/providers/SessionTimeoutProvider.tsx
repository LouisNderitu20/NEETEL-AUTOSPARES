"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface SessionTimeoutProviderProps {
  children: React.ReactNode;
}

export default function SessionTimeoutProvider({ children }: SessionTimeoutProviderProps) {
  const router = useRouter();
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [countdown, setCountdown] = useState(0);

  
  const TIMEOUT_MINUTES = parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES || "15", 10);
  const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000;
  
  
  const WARNING_PERIOD_MS = Math.min(60 * 1000, Math.floor(TIMEOUT_MS / 3));
  
  
  const KEEP_ALIVE_INTERVAL_MS = Math.min(5 * 60 * 1000, Math.floor(TIMEOUT_MS / 3));

  
  const lastActivityRef = useRef<number>(Date.now());
  const lastKeepAliveRef = useRef<number>(Date.now());
  const isWarningOpenRef = useRef<boolean>(false);

  
  useEffect(() => {
    isWarningOpenRef.current = isWarningOpen;
  }, [isWarningOpen]);

  
  const handleLogout = useCallback(async () => {
    try {
      localStorage.setItem("session-logout-event", Date.now().toString());
      await signOut({ redirect: false });
    } catch (error) {
      console.error("Logout failed:", error);
    }
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login?reason=timeout";
  }, []);

  
  const handleKeepSessionActive = useCallback(async () => {
    try {
      
      await fetch("/api/auth/session");
      
      
      lastActivityRef.current = Date.now();
      lastKeepAliveRef.current = Date.now();
      setIsWarningOpen(false);
    } catch (error) {
      console.error("Failed to extend session:", error);
    }
  }, []);

  
  const handleActivity = useCallback(() => {
    
    
    if (!isWarningOpenRef.current) {
      lastActivityRef.current = Date.now();
    }
  }, []);

  
  useEffect(() => {
    
    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "session-logout-event") {
        
        router.push("/login?reason=timeout");
      }
    };
    window.addEventListener("storage", handleStorageChange);

    
    const interval = setInterval(async () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      const timeSinceLastKeepAlive = now - lastKeepAliveRef.current;

      
      if (timeSinceLastActivity >= TIMEOUT_MS) {
        clearInterval(interval);
        handleLogout();
        return;
      }

      
      if (timeSinceLastActivity >= TIMEOUT_MS - WARNING_PERIOD_MS) {
        if (!isWarningOpenRef.current) {
          setIsWarningOpen(true);
        }
        
        const secondsRemaining = Math.max(0, Math.ceil((TIMEOUT_MS - timeSinceLastActivity) / 1000));
        setCountdown(secondsRemaining);
      } else if (isWarningOpenRef.current) {
        
        setIsWarningOpen(false);
      }

      if (
        timeSinceLastKeepAlive >= KEEP_ALIVE_INTERVAL_MS &&
        timeSinceLastActivity < KEEP_ALIVE_INTERVAL_MS
      ) {
        try {
          await fetch("/api/auth/session");
          lastKeepAliveRef.current = now;
        } catch (error) {
          console.error("Keep alive failed:", error);
        }
      }
    }, 1000);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [TIMEOUT_MS, WARNING_PERIOD_MS, KEEP_ALIVE_INTERVAL_MS, handleActivity, handleLogout, router]);

  return (
    <>
      {children}

      {}
      {isWarningOpen && (
        <div className="inactivity-modal-overlay">
          <div className="inactivity-modal-card">
            <div className="inactivity-modal-header">
              <div className="security-icon-circle animate-pulse">
                <i className="bi bi-shield-lock-fill"></i>
              </div>
              <h3>Security Warning</h3>
            </div>
            
            <div className="inactivity-modal-body">
              <p>You have been inactive for a while. To protect your sensitive data, your session will expire automatically in:</p>
              
              <div className="countdown-timer">
                <span className="countdown-number">{countdown}</span>
                <span className="countdown-label">seconds</span>
              </div>
            </div>

            <div className="inactivity-modal-footer">
              <button 
                type="button" 
                className="btn btn-outline-secondary btn-sm"
                onClick={handleLogout}
              >
                Log Out Now
              </button>
              <button 
                type="button" 
                className="btn btn-primary btn-sm px-4"
                onClick={handleKeepSessionActive}
              >
                Keep Session Active
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
