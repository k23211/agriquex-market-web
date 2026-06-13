import { useColorScheme } from 'react-native'

export const lightTheme = {
  dark: false,
  background: '#ffffff',
  surface: '#f3f4f6',
  text: '#0f172a',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  accent: '#16a34a', // green
  accent2: '#f59e0b', // amber
  tabBarBg: '#ffffff',
  tabBarActiveTint: '#16a34a',
  tabBarInactiveTint: '#6b7280',
  navOverlay: 'rgba(255,255,255,0.06)',
  overlay: 'rgba(0,0,0,0.06)',
}

export const darkTheme = {
  dark: true,
  background: '#070707',
  surface: '#0b1220',
  text: '#ffffff',
  textSecondary: '#9ca3af',
  border: '#1f2937',
  accent: '#a3e635',
  accent2: '#f59e0b',
  tabBarBg: '#070707',
  tabBarActiveTint: '#a3e635',
  tabBarInactiveTint: '#ffffff',
  navOverlay: 'rgba(0,0,0,0.45)',
  overlay: 'rgba(0,0,0,0.45)',
}

export function useAppTheme() {
  const scheme = useColorScheme()
  if (scheme === 'light') return lightTheme
  return darkTheme
}

export type AppTheme = typeof darkTheme
