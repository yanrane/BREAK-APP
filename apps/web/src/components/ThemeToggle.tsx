import { useState } from "react";

/** Toggle dark/light — class .dark di <html>, persist di localStorage 'break-theme'. */
export default function ThemeToggle({
  className = "",
}: {
  className?: string;
}) {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("break-theme", next ? "dark" : "light");
    setDark(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Ganti ke light mode" : "Ganti ke dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={`w-8 h-8 flex items-center justify-center border-2 border-ink text-base hover:bg-cream-2 transition-colors ${className}`}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
