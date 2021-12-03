import merge from 'lodash/merge'
import { mix } from 'polished'
import { createContext, ReactNode, useContext, useMemo } from 'react'

import styled, { ThemedProvider } from './styled'
import { Colors, Theme } from './theme'

export type { Color, Colors, Theme } from './theme'

export default styled
export * from './dynamic'
export * from './icon'
export * from './layer'
export * from './scrollable'
export * from './styled'
export * as ThemedText from './type'

type ColorsAndHover = Colors & { onHover: Theme['onHover'] }

const light: ColorsAndHover = {
  // surface
  accent: '#FF007A',
  container: '#F7F8FA',
  module: '#E2E3E9',
  interactive: '#CED0D9',
  outline: '#C3C5CB',
  dialog: '#FFFFFF',

  // text
  primary: '#000000',
  secondary: '#565A69',
  hint: '#888D9B',
  onInteractive: '#000000',

  // state
  active: '#2172E5',
  success: '#27AE60',
  warning: '#F3B71E',
  error: '#FD4040',

  onHover: mix(0.24, '#000000'), // hovered elements get a 24% primary text overlay
}

const dark: ColorsAndHover = {
  // surface
  accent: '#2172E5',
  container: '#191B1F',
  module: '#2C2F36',
  interactive: '#40444F',
  outline: '#565A69',
  dialog: '#000000',

  // text
  primary: '#FFFFFF',
  secondary: '#888D9B',
  hint: '#6C7284',
  onInteractive: '#FFFFFF',

  // state
  active: '#2172E5',
  success: '#27AE60',
  warning: '#F3B71E',
  error: '#FD4040',

  onHover: mix(0.24, '#FFFFFF'), // hovered elements get a 24% primary text overlay
}

export const defaultTheme: Theme = {
  darkMode: true,
  fontFamily: '"Inter var", sans-serif',
  borderRadius: 1,
  ...dark,
  light,
  dark,
}

const ThemeContext = createContext<Theme>(defaultTheme)

interface ThemeProviderProps {
  theme?: Partial<Theme>
  children: ReactNode
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const contextTheme = useContext(ThemeContext)
  const value: Theme = useMemo(() => {
    const value = merge({}, contextTheme, theme)
    const colors: Colors = value.darkMode ? value.dark : value.light
    return merge({}, colors, value)
  }, [contextTheme, theme])
  return (
    <ThemeContext.Provider value={value}>
      <ThemedProvider theme={value}>{children}</ThemedProvider>
    </ThemeContext.Provider>
  )
}
