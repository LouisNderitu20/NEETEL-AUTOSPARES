"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const activeTheme = (localStorage.getItem("theme") as "light" | "dark") || "light";
    document.documentElement.setAttribute("data-theme", activeTheme);
    setTheme(activeTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  if (!mounted) {
    return (
      <div className="notif-btn" style={{ opacity: 0.5 }}>
        <i className="bi bi-sun"></i>
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="notif-btn"
      title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
      id="theme-toggle-btn"
      style={{ border: "1px solid var(--border-color)" }}
    >
      <i className={`bi ${theme === "light" ? "bi-moon-stars-fill" : "bi-sun-fill"}`} style={{ color: theme === "light" ? "#f59e0b" : "#fbbf24" }}></i>
    </button>
  );
}
