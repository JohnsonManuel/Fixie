import { useEffect, useState } from "react";

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // on mount, check saved theme or system preference
    if (
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  function toggleTheme() {
    console.log('toggle theem')
    const newDark = !isDark;
    setIsDark(newDark);

    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className="px-3 py-1 rounded-md text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
    >
      {isDark ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
