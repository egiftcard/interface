import { createContext, ReactNode, useContext } from 'react'

interface FeatureFlagsContextType {
  isLoaded: boolean
  flags: Record<string, string>
}

const FeatureFlagContext = createContext<FeatureFlagsContextType>({ isLoaded: false, flags: {} })

export function useFeatureFlagsContext(): FeatureFlagsContextType {
  const context = useContext(FeatureFlagContext)
  if (!context) {
    throw Error('Feature flag hooks can only be used by children of FeatureFlagProvider.')
  } else {
    return context
  }
}

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const value = {
    isLoaded: true,
    flags: {
      phase0: 'control',
    },
  }
  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>
}

export function useFeatureFlagsIsLoaded(): boolean {
  return useFeatureFlagsContext().isLoaded
}

// feature flag hooks

enum Phase0Variant {
  Control = 'Control',
  Enabled = 'Enabled',
}

export function usePhase0Flag(): Phase0Variant {
  const phase0Variant = useFeatureFlagsContext().flags['phase0']
  switch (phase0Variant) {
    case 'enabled':
      return Phase0Variant.Enabled
    default:
      return Phase0Variant.Control
  }
}

enum Phase1Variant {
  Control = 'Control',
  Enabled = 'Enabled',
}

export function usePhase1Flag(): Phase1Variant {
  const phase1Variant = useFeatureFlagsContext().flags['phase1']
  switch (phase1Variant) {
    case 'enabled':
      return Phase1Variant.Enabled
    default:
      return Phase1Variant.Control
  }
}
