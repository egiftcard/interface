import { ChainId } from 'constants/chains'
import { ExplorerDataType, getExplorerLink } from './getExplorerLink'

describe('#getExplorerLink', () => {
  it('correct for tx', () => {
    expect(getExplorerLink(1, 'abc', ExplorerDataType.TRANSACTION)).toEqual('https://etherscan.io/tx/abc')
  })
  it('correct for token', () => {
    expect(getExplorerLink(1, 'abc', ExplorerDataType.TOKEN)).toEqual('https://etherscan.io/token/abc')
  })
  it('correct for address', () => {
    expect(getExplorerLink(1, 'abc', ExplorerDataType.ADDRESS)).toEqual('https://etherscan.io/address/abc')
  })
  it('unrecognized chain id defaults to mainnet', () => {
    expect(getExplorerLink(2, 'abc', ExplorerDataType.ADDRESS)).toEqual('https://etherscan.io/address/abc')
  })
  it.skip('@TODO: testnet', () => {
    expect(getExplorerLink(3, 'abc', ExplorerDataType.ADDRESS)).toEqual('https://ropsten.etherscan.io/address/abc')
  })
  it.skip('@TODO: enum', () => {
    expect(getExplorerLink(ChainId.RINKEBY, 'abc', ExplorerDataType.ADDRESS)).toEqual(
      'https://rinkeby.etherscan.io/address/abc'
    )
  })
})
