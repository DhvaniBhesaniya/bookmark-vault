import { createContext, useContext, useEffect, useState } from "react"

const ACCENT_STORAGE_KEY = "bookmarkvault-accent"

const initialState = {
  theme: "system",
  setTheme: () => null,
  accent: "teal",
  setAccent: () => null,
}

const ThemeProviderContext = createContext(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}) {
  const [theme, setTheme] = useState(
    () => (localStorage.getItem(storageKey)) || defaultTheme
  )

  const [accent, setAccentState] = useState(
    () => localStorage.getItem(ACCENT_STORAGE_KEY) || "teal"
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  useEffect(() => {
    const root = window.document.documentElement
    if (accent === "purple") {
      root.removeAttribute("data-accent")
    } else {
      root.setAttribute("data-accent", accent)
    }
  }, [accent])

  const setAccent = (newAccent) => {
    localStorage.setItem(ACCENT_STORAGE_KEY, newAccent)
    setAccentState(newAccent)
  }

  const value = {
    theme,
    setTheme: (theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
    accent,
    setAccent,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
