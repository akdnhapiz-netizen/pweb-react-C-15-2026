import { useEffect } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

export type ThemeMode = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<ThemeMode>(
    "aku-mw-magang-theme",
    "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <button
      type="button"
      className="btn btn-theme-toggle"
      onClick={toggleTheme}
      aria-label={`Ganti ke mode ${theme === "light" ? "gelap" : "terang"}`}
      title={`Tema saat ini: ${theme === "light" ? "Light Mode" : "Dark Mode"}`}
    >
      {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
    </button>
  );
}