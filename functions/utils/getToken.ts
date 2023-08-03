import { TokenDocument } from '../../src/graphql/data/__generated__/types-and-hooks'
import { Chain } from '../../src/graphql/data/__generated__/types-and-hooks'
import client from '../client'

function formatTitleName(symbol: string, name: string) {
  if (symbol) {
    return 'Get ' + symbol + ' on Uniswap'
  }
  if (name) {
    return 'Get ' + name + ' on Uniswap'
  }
  return 'View Token on Uniswap'
}

const convertTokenAddress = (tokenAddress: string, networkName: string) => {
  if (tokenAddress === 'NATIVE') {
    switch (networkName) {
      case Chain.Celo:
        return '0x471EcE3750Da237f93B8E339c536989b8978a438'
      case Chain.Polygon:
        return '0x0000000000000000000000000000000000001010'
      default:
        return undefined
    }
  }
  return tokenAddress
}

export default async function getToken(networkName: string, tokenAddress: string, url: string) {
  const origin = new URL(url).origin
  const image = origin + '/api/image/tokens/' + networkName + '/' + tokenAddress
  const uppercaseNetworkName = networkName.toUpperCase()
  const convertedTokenAddress = convertTokenAddress(tokenAddress, uppercaseNetworkName)
  const { data } = await client.query({
    query: TokenDocument,
    variables: {
      chain: uppercaseNetworkName,
      address: convertedTokenAddress,
    },
  })
  const asset = data?.token
  if (!asset) {
    return undefined
  }
  const title = formatTitleName(asset.symbol, asset.name)
  const formattedAsset = {
    title,
    image,
    url,
    symbol: asset.symbol,
    ogImage: asset.project?.logoUrl,
    name: asset.name,
  }
  return formattedAsset
}
