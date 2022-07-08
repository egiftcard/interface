import { Connector } from '@web3-react/types'
import { fortmaticConnection } from 'connection'

import FORTMATIC_ICON_URL from '../assets/images/fortmaticIcon.png'
import Option from './Option'

const BASE_PROPS = {
  color: '#6748FF',
  icon: FORTMATIC_ICON_URL,
  id: 'fortmatic',
}

const FortmaticOption = ({ tryActivation }: { tryActivation: (connector: Connector) => void }) => {
  const isActive = fortmaticConnection.hooks.useIsActive()

  return (
    <Option
      {...BASE_PROPS}
      isActive={isActive}
      onClick={() => tryActivation(fortmaticConnection.connector)}
      header="Fortmatic"
      subheader="Login using Fortmatic hosted wallet"
    />
  )
}

export default FortmaticOption
