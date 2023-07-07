/* eslint-disable import/no-unused-modules */
import getToken from '../utils/getToken'
import { MetaTagInjector } from '../components/tokenInjector'

export const onRequest: PagesFunction<{}> = async ({ params, request, env, next }) => {
  try {
    const { index } = params
    const networkName = String(index[0]).toUpperCase()
    let tokenAddress = String(index[1])
    tokenAddress =
      tokenAddress !== 'undefined' && tokenAddress === 'NATIVE'
        ? '0x0000000000000000000000000000000000000000'
        : tokenAddress
    const data = await getToken(networkName, tokenAddress, request.url)
    if (!data) {
      return await next()
    }
    return new HTMLRewriter().on('head', new MetaTagInjector(data)).transform(await next())
  } catch (e) {
    console.log(e)
    return await next()
  }
}