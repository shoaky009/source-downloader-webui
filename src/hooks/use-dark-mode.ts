import { useTheme } from 'next-themes'

export function useDarkMode() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return {
    isDark,
    toggleDark: () => setTheme(isDark ? 'light' : 'dark'),
  }
}
