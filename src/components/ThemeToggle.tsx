import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
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
      {theme === "light" ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
      <span className="btn-label">{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
    </button>
  );
}