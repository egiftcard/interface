import { t } from '@lingui/macro'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

import { SettingsToggle } from './SettingsToggle'

export const showTestnetsAtom = atomWithStorage<boolean>('showTestnets', false)

export function TestnetsToggle() {
  const [showTestnets, updateShowTestnets] = useAtom(showTestnetsAtom)

  return (
    <SettingsToggle
      title={t`Show testnets`}
      isActive={showTestnets}
      toggle={() => {
        updateShowTestnets(!showTestnets)
      }}
    />
  )
}
