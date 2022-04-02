import { useWeb3React } from '@web3-react/core';
import Badge, { BadgeVariant } from 'components/Badge';
import _ from 'lodash';
import moment from 'moment';
import { useKiba } from 'pages/Vote/VotePage';
import React from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Filter, Percent, X } from 'react-feather';
import { useBscTokenData, useBnbPrices, useBscTokenTransactions, fetchBscTokenData, fetchBscHolders, useBscPoocoinTransactions } from 'state/logs/bscUtils';
import { useTokenTransactions, useTokenData, useEthPrice, getTokenData, useTokenDataHook } from 'state/logs/utils';
import styled from 'styled-components/macro';
import { StyledInternalLink } from 'theme';
import { Dots } from './styleds';
import TradingViewWidget, { Themes } from 'react-tradingview-widget';
import useInterval from 'hooks/useInterval';
import Tooltip from 'components/Tooltip';

const StyledDiv = styled.div`
font-family: 'Bangers', cursive;
font-size:25px;
`

const StyledA = styled.a`
    font-family:'Inter var', sans-serif !important;
`
export const useTokenHolderCount = (address: string) => {
    const [data, setData] = React.useState<any | undefined>()
    function intervalCallback() {
        if (!address) return;
        fetch(`https://api.ethplorer.io/getTokenInfo/${address}?apiKey=EK-htz4u-dfTvjqu-7YmJq`, { method: 'get' })
            .then(res => res.json())
            .then(setData);
    }
    React.useEffect(() => {
        intervalCallback()
    }, [address])

    useInterval(intervalCallback, 30000)
    return data;
}


export const useHolderCount = (chainId: any) => {
    const [holdersCount, setHoldersCount] = React.useState<any | undefined>()
    function intervalCallback() {
        if (!chainId) return;
        if (chainId === 1)
            fetch('https://api.ethplorer.io/getTokenInfo/0x4b2c54b80b77580dc02a0f6734d3bad733f50900?apiKey=EK-htz4u-dfTvjqu-7YmJq', { method: 'get' })
                .then(res => res.json())
                .then(setHoldersCount);
        if (chainId === 56) fetchBscHolders().then((response: any) => {
            setHoldersCount({ holdersCount: response })
        })
    }
    React.useEffect(() => {
        intervalCallback()
    }, [chainId])

    useInterval(intervalCallback, 30000)
    return holdersCount;
}

const TransactionList = ({ lastFetched, transactions, tokenData, chainId }: { lastFetched: any, transactions: any, tokenData: any, chainId?: number }) => {
    console.log(tokenData)
    const [filterAddress, setFilterAddress] = React.useState<string | undefined>()
    const chainLabel = React.useMemo(() => chainId && chainId === 1 ? `ETH` : chainId && chainId === 56 ? 'BNB' : '', [chainId])
    const lastUpdated = React.useMemo(() => moment(lastFetched).fromNow(), [moment(lastFetched).fromNow()])
    const formattedTransactions = React.useMemo(() => transactions?.swaps?.map((swap: any) => {
        const netToken0 = swap.amount0In - swap.amount0Out
        const netToken1 = swap.amount1In - swap.amount1Out
        const newTxn: Record<string, any> = {}
        if (netToken0 < 0) {
            newTxn.token0Symbol = (swap.pair).token0.symbol
            newTxn.token1Symbol = (swap.pair).token1.symbol
            newTxn.token0Amount = Math.abs(netToken0)
            newTxn.token1Amount = Math.abs(netToken1)
        } else if (netToken1 < 0) {
            newTxn.token0Symbol = (swap.pair).token1.symbol
            newTxn.token1Symbol = (swap.pair).token0.symbol
            newTxn.token0Amount = Math.abs(netToken1)
            newTxn.token1Amount = Math.abs(netToken0)
        }
        newTxn.transaction = swap.transaction;
        newTxn.hash = swap.transaction.id
        newTxn.timestamp = swap?.timestamp ? swap?.timestamp : swap.transaction.timestamp
        newTxn.type = 'swap'
        newTxn.amountUSD = swap.amountUSD;
        newTxn.account = swap.to === "0x7a250d5630b4cf539739df2c5dacb4c659f2488d" ? swap.from : swap.to
        newTxn.count = transactions?.swaps?.filter((x: any) => (x.to === "0x7a250d5630b4cf539739df2c5dacb4c659f2488d" ? x.from : x.to) === newTxn.account).length;
        return newTxn;
    }).filter((newTxn: any) => !filterAddress ? true : newTxn.account === filterAddress), [transactions, filterAddress])

    const tooltipContent = React.useMemo(() => {
        return (item: any) => {
            const isSell = ({ token0Symbol }: any) => token0Symbol === `W${chainLabel}`
            const sellCount = formattedTransactions?.filter((t: any) => t.account === item.account && isSell(t))?.length;
            const amountSold = _.sumBy(formattedTransactions?.filter((t: any) => t.account === item.account && isSell(t)), (i: any) => parseFloat(i.amountUSD))
            const amountBought = _.sumBy(formattedTransactions?.filter((t: any) => t.account === item.account && !isSell(t)), (i: any) => parseFloat(i.amountUSD))
            const buyCount = formattedTransactions?.filter((t: any) => t.account === item.account && !isSell(t))?.length;
            return (
                <div style={{ width: 'auto', display: 'flex', flexFlow: 'column wrap', alignItems: 'center', justifyContent: 'start', gap: '1.5px 3px' }}>
                    <small style={{ color: "#fff", marginBottom: 2 }}>Total tx:  <Badge variant={BadgeVariant.DEFAULT}>{buyCount + sellCount}</Badge></small>
                    <small style={{ color: '#fff', marginBottom: 2 }}>Buys: <Badge variant={BadgeVariant.POSITIVE_OUTLINE}>{buyCount} / ${Number(amountBought).toLocaleString()}</Badge></small>
                    <small style={{ color: '#fff' }}>Sells: <Badge variant={BadgeVariant.NEGATIVE_OUTLINE}>{sellCount} / ${Number(amountSold).toLocaleString()}</Badge></small>
                </div>
            ) as any
        }
    }, [formattedTransactions])
    const holdersCount = useHolderCount(chainId)
    const price = React.useMemo(() => tokenData?.priceUSD ?
        parseFloat(tokenData?.priceUSD) : holdersCount && holdersCount?.price?.rate ?
            parseFloat(holdersCount?.price?.rate) : NaN
        , [tokenData, holdersCount])

    const CIRCULATING_SUPPLY = 1000000000000;
    const marketCap = React.useMemo(() => {
        if (!tokenData?.priceUSD) return;
        return Number((parseFloat(tokenData.priceUSD) * CIRCULATING_SUPPLY).toFixed(0)).toLocaleString()
    }, [tokenData])
    const fromNow = React.useMemo(() => {
        return (transaction: any) =>
            moment(+transaction.timestamp * 1000).fromNow()

    }, [formattedTransactions])
    const [tooltipShown, setTooltipShown] = React.useState<any>()
    const [showRemoveFilter, setShowRemoveFilter] = React.useState<any>()
    return (
        <>
            <StyledDiv
                style={{
                    alignItems: 'center',
                    width: '100%',
                    display: 'flex',
                    flexFlow: 'row wrap',
                    justifyContent: 'stretch',
                    gap: '1.5px 10.5px',
                    flex: '1 1',
                    flexGrow: 1
                }}>
                {
                    <>

                        {!isNaN(price) && +price >= 0 && <>
                            <small>
                                <small style={{ display: 'block' }}>Price</small>
                                <Badge variant={tokenData?.priceChangeUSD <= 0 ? BadgeVariant.NEGATIVE_OUTLINE : BadgeVariant.POSITIVE_OUTLINE}>{(+price?.toFixed(18))}</Badge>
                            </small>
                            <small >
                                <small style={{ display: 'block', textAlign: 'left' }}>24hr %</small>
                                <Badge variant={tokenData?.priceChangeUSD <= 0 ? BadgeVariant.NEGATIVE_OUTLINE : BadgeVariant.POSITIVE_OUTLINE} style={{ width: 'fit-content', display: 'flex', justifyContent: 'flex-end' }}>
                                    {tokenData?.priceChangeUSD && tokenData?.priceChangeUSD <= 0 ? <ChevronDown /> : <ChevronUp />}
                                    {tokenData?.priceChangeUSD?.toFixed(2)}  <Percent />
                                </Badge>
                            </small>
                        </>}
                        {holdersCount && holdersCount?.holdersCount && (
                            <small>
                                <small style={{ display: 'block' }}>Holders</small>
                                <Badge variant={BadgeVariant.WARNING_OUTLINE}>{holdersCount.holdersCount}</Badge>
                            </small>
                        )}
                        {marketCap && (
                            <small>
                                <small style={{ display: 'block' }}>Market Cap</small>
                                <Badge variant={BadgeVariant.WARNING_OUTLINE}>${marketCap}</Badge>
                            </small>
                        )}

                        {tokenData?.oneDayVolumeUSD && (
                            <small>
                                <small style={{ display: 'block' }}>Daily Volume</small>
                                <Badge variant={BadgeVariant.WARNING_OUTLINE}>${Number(parseFloat(tokenData?.oneDayVolumeUSD)?.toFixed(0)).toLocaleString()}</Badge>
                            </small>
                        )}
                        {tokenData?.totalLiquidityUSD && <small>
                            <small style={{ display: 'block' }}>Total Liquidity</small>
                            <Badge variant={BadgeVariant.WARNING_OUTLINE}>
                                ${Number((tokenData?.totalLiquidityUSD * 2).toFixed(0)).toLocaleString()}
                            </Badge></small>}
                    </>
                }
            </StyledDiv>
            {lastUpdated && (
                <span style={{ display: 'flex', marginTop: 3, justifyContent: 'space-between', textAlign: 'right' }}>
                    {filterAddress !== undefined && <small>Filtering transactions by <Badge><small>{filterAddress.slice(0, 6) + '...' + filterAddress.slice(38, 42)}</small></Badge> &nbsp;</small>}
                    <small>{`Last updated ${lastUpdated}`} {chainId && chainId === 56 && <><br /><small></small></>}</small>
                </span>
            )}
            <div style={{
                display: 'block',
                width: '100%',
                overflowY: 'auto',
                maxHeight: 500
            }}>
                <table style={{ width: '100%' }}>
                    <thead style={{
                        textAlign: 'left',
                        position: 'sticky',
                        top: 0,
                        background: '#222',
                        fontWeight: 200
                    }}>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Amt {chainLabel}</th>
                            <th>Amt USD</th>
                            <th>Amt Tokens</th>
                            <th>Tx</th>
                            <th>Maker</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {!formattedTransactions?.length && <tr><td colSpan={5}>Loading transaction data <Dots></Dots></td></tr>}
                        {formattedTransactions && formattedTransactions?.map((item: any, index: number) => (
                            <tr key={`_${item.timestamp * 1000}_${item.hash}_${index}`}>
                                <td style={{ fontSize: 12 }}>{fromNow(item)}</td>
                                <td style={{ color: item.token0Symbol === `W${chainLabel}` ? 'red' : 'green' }}>{item.token0Symbol === `W${chainLabel}` ? 'SELL' : 'BUY'}</td>
                                <td>{item.token0Symbol === `W${chainLabel}` && <>{Number(+item.token0Amount?.toFixed(2))?.toLocaleString()} {item.token0Symbol}</>}
                                    {item.token1Symbol === `W${chainLabel}` && <>{Number(+item.token1Amount?.toFixed(2))?.toLocaleString()} {item.token1Symbol}</>}
                                </td>
                                <td>${Number(parseFloat(item.amountUSD).toFixed(2)).toLocaleString()}</td>
                                <td>{item.token0Symbol !== `W${chainLabel}` && <>{Number(+item.token0Amount?.toFixed(2))?.toLocaleString()} {item.token0Symbol}</>}
                                    {item.token1Symbol !== `W${chainLabel}` && <>{Number(+item.token1Amount?.toFixed(2))?.toLocaleString()} {item.token1Symbol}</>}
                                </td>
                                <td>
                                    <StyledA href={`https://${chainId === 1 ? 'etherscan.io' : 'bscscan.com'}/tx/${item?.hash}`}>
                                        {item?.hash && item?.transaction?.id.slice(0, 6) + '...' + item?.transaction?.id.slice(38, 42)}
                                    </StyledA>
                                </td>
                                <td>
                                    <StyledA href={`https://${chainId === 1 ? 'etherscan.io' : 'bscscan.com'}/address/${item.account}`}>
                                        {item.account && item.account.slice(0, 6) + '...' + item.account.slice(38, 42)}
                                    </StyledA>
                                </td>
                                <td >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ cursor: 'pointer' }} title={`Filter transactions by ${item.account}`}>
                                            {!filterAddress && <Filter fill={filterAddress ? 'purple' : 'gray'} onClick={() => {
                                                setFilterAddress(item.account)
                                            }} />}

                                            {!!filterAddress && (
                                            <Tooltip show={showRemoveFilter && 
                                                        showRemoveFilter?.amountUSD === item?.amountUSD && 
                                                        showRemoveFilter?.transaction?.id === item?.transaction?.id
                                                    } 
                                                    text={`Remove filter for ${filterAddress}`}> 
                                                    <X fill={'red'} 
                                                        style={{ cursor: 'pointer' }} 
                                                        onClick={() => setFilterAddress(undefined)} 
                                                        onMouseEnter={() => setShowRemoveFilter(item)} 
                                                        onMouseLeave={() => setShowRemoveFilter(undefined)} /> 
                                            </Tooltip>)}
                                        </span>
                                        {item.count > 1 && (<Tooltip placement={'auto-end'} text={tooltipContent(item)} show={tooltipShown && tooltipShown?.amountUSD === item?.amountUSD && tooltipShown?.transaction?.id === item?.transaction?.id}>
                                            <Badge style={{ cursor: 'pointer' }} onMouseEnter={() => setTooltipShown(item)} onMouseLeave={() => setTooltipShown(undefined)} variant={BadgeVariant.PRIMARY}>
                                                {item.count}
                                            </Badge>
                                        </Tooltip>)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}


const FrameWrapper = styled.div`
width:100%;
display:flex;
flex-flow:column wrap;
max-width:1000px;
overflow-y:auto;
`

export const Chart = () => {
    const { chainId, account } = useWeb3React();
    const kibaBalance = useKiba(account)
    const [ethPrice, ethPriceOld] = useEthPrice()
    const [symbol, setSymbol] = React.useState('')
    const transactionData = useTokenTransactions('0x4b2c54b80b77580dc02a0f6734d3bad733f50900', 60000)
    const isBinance = React.useMemo(() => chainId && chainId === 56, [chainId])
    const binanceTransactionData = useBscTokenTransactions('0x31d3778a7ac0d98c4aaa347d8b6eaf7977448341', 60000)
    const prices = useBnbPrices()
    const accessDenied = React.useMemo(() => !account || (!kibaBalance) || (+kibaBalance?.toFixed(0) <= 0), [account, kibaBalance])
    const [view, setView] = React.useState<'chart' | 'market'>('chart')
    const frameURL = React.useMemo(() => {
        return chainId === 56 ?
            `https://www.defined.fi/bsc/0x89e8c0ead11b783055282c9acebbaf2fe95d1180` :
            `https://www.tradingview.com/widgetembed/?symbol=UNISWAP:KIBAWETH&interval=4H&hidesidetoolbar=0&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en`
    }, [symbol, chainId])
    const tokenData = useTokenDataHook('0x4b2c54b80b77580dc02a0f6734d3bad733f50900', ethPrice, ethPriceOld)

    return (
        <FrameWrapper style={{
            background: 'radial-gradient(#f5b642, rgba(129,3,3,.95))'
        }} >
            <div style={{
                display: 'block',
                marginBottom: 5,
                width: '100%',
                padding: "9px 14px"
            }}>
                <div style={{ display: 'flex', marginBottom: 5, alignItems: 'center', flexFlow: "row wrap" }}>
                    <a style={{ marginRight: 15 }} href="https://www.dextools.io/app/ether/pair-explorer/0xac6776d1c8d455ad282c76eb4c2ade2b07170104">
                        <img src={'https://miro.medium.com/max/663/1*eV5_P4s2WQkgzVM_XdgWSw.png'}
                            style={{ maxWidth: 100 }} />
                    </a>
                    <a href={'https://app.moontools.io/pairs/uniswap/0xac6776d1c8d455ad282c76eb4c2ade2b07170104'} style={{ marginRight: 15 }}>
                        <img src={'https://miro.medium.com/max/440/1*rtdc0fgltZdBep3miLuSuQ.png'}
                            style={{ maxWidth: 100 }} />
                    </a>
                    <a href={'https://coingecko.com/en/coins/kiba-inu'} style={{ marginRight: 15 }}>
                        <img src={'https://cdn.filestackcontent.com/MKnOxRS8QjaB2bNYyfou'}
                            style={{ maxWidth: 30 }} />
                    </a>
                    <a href={'https://coinmarketcap.com/en/currencies/kiba-inu'} style={{ marginRight: 15 }}>
                        <img src={'https://doostoken.com/assets/images/site/brand/new/png/coinmarketcap.png'}
                            style={{ maxWidth: 30 }} />
                    </a>
                    {!isBinance && <Badge style={{ color: "#fff", textDecoration: 'none' }}>ETH: ${ethPrice && (+ethPrice)?.toFixed(2)}</Badge>}
                    {!!isBinance && <Badge style={{ color: "#fff", textDecoration: 'none' }}>BNB: ${prices && (+prices?.current)?.toFixed(2)}</Badge>}
                </div>
                {accessDenied && <div style={{ width: '100%', padding: '9px 14px', height: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><StyledDiv style={{ color: "#222" }}>You must own Kiba Inu tokens to use this feature.</StyledDiv></div>}
                {accessDenied === false &&
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, flexFlow: 'row wrap' }}>
                            <div style={{ alignItems: 'center', flexFlow: 'row wrap', display: 'flex' }}>
                                <StyledDiv onClick={() => setView('chart')} style={{
                                    cursor: 'pointer',
                                    marginRight: 10,
                                    textDecoration: view === 'chart' ? 'underline' : ''
                                }}>KibaCharts</StyledDiv>
                                <StyledDiv style={{
                                    cursor: 'pointer',
                                    marginRight: 10,
                                    textDecoration: view === 'market' ? 'underline' : ''
                                }} onClick={() => setView('market')}>MarketView</StyledDiv>
                            </div>
                            {isBinance && <StyledDiv>Binance</StyledDiv>}

                            {!isBinance && <StyledDiv style={{ alignItems: 'center', display: 'flex', color: "#FFF" }}>
                                <StyledInternalLink style={{ fontSize: 25, color: "#FFF" }} to="/selective-charts">View Charts for Other Tokens </StyledInternalLink><ChevronRight /> <Badge>Beta</Badge>
                            </StyledDiv>}
                        </div>
                        {view === 'chart' && <>
                            <div style={{ width: '100%', marginTop: '0.5rem', marginBottom: '0.25rem' }}>
                                <iframe src={frameURL} style={{
                                    height: chainId === 1 ? 471 : `100vh`,
                                    width: '100%',
                                    border: '1px solid #222'
                                }} />
                            </div>
                            {!isBinance && transactionData?.data?.swaps?.length &&
                                tokenData && tokenData?.priceUSD &&
                                <div style={{
                                    width: '100%',
                                    overflowY: 'auto',
                                    padding: '9px 14px',
                                    background: 'rgb(22, 22, 22)',
                                    color: '#fff',
                                    borderRadius: 6,
                                    flexFlow: 'column wrap',
                                }}>
                                    <TransactionList chainId={chainId} lastFetched={transactionData.lastFetched} transactions={transactionData.data} tokenData={tokenData} />
                                </div>}
                            {!isBinance && transactionData?.data?.swaps?.length === 0 && <Dots>Loading transactions..</Dots>}
                            {isBinance && binanceTransactionData?.data?.swaps?.length === 0 && <Dots>Loading transactions..</Dots>}
                            {isBinance && binanceTransactionData?.data?.swaps?.length > 0 && <div style={{ width: '100%', overflowY: 'auto', padding: '9px 14px', background: 'rgb(22, 22, 22)', color: '#fff', borderRadius: 6, flexFlow: 'column wrap', gridColumnGap: 50 }}>
                                <TransactionList chainId={chainId} lastFetched={binanceTransactionData.lastFetched} transactions={binanceTransactionData.data} tokenData={tokenData} />
                            </div>}
                        </>}
                    </>}
                {accessDenied === false && view === 'market' &&
                    <div style={{ display: 'flex', flexFlow: 'column wrap', alignItems: 'center' }}>
                        <iframe src="https://www.tradingview.com/mediumwidgetembed/?symbols=BTC,COINBASE%3AETHUSD%7C12M,BINANCEUS%3ABNBUSD%7C12M&BTC=COINBASE%3ABTCUSD%7C12M&fontFamily=Trebuchet%20MS%2C%20sans-serif&bottomColor=rgba(41%2C%2098%2C%20255%2C%200)&topColor=rgba(41%2C%2098%2C%20255%2C%200.3)&lineColor=%232962FF&chartType=area&scaleMode=Normal&scalePosition=no&locale=en&fontColor=%23787B86&gridLineColor=rgba(240%2C%20243%2C%20250%2C%200)&width=1000px&height=calc(400px%20-%2032px)&colorTheme=dark&utm_source=www.tradingview.com&utm_medium=widget_new&utm_campaign=symbol-overview&showFloatingTooltip=1" style={{ border: '1px solid #222', borderRadius: 6, width: '100%', height: 500 }} />
                        <iframe src='https://www.tradingview-widget.com/embed-widget/crypto-mkt-screener/?locale=en#%7B%22width%22%3A1000%2C%22height%22%3A490%2C%22defaultColumn%22%3A%22overview%22%2C%22screener_type%22%3A%22crypto_mkt%22%2C%22displayCurrency%22%3A%22USD%22%2C%22colorTheme%22%3A%22dark%22%2C%22market%22%3A%22crypto%22%2C%22enableScrolling%22%3Atrue%2C%22utm_source%22%3A%22www.tradingview.com%22%2C%22utm_medium%22%3A%22widget_new%22%2C%22utm_campaign%22%3A%22cryptomktscreener%22%7D' style={{ border: '1px solid #222', marginTop: 10, borderRadius: 30, height: 500, width: '100%' }} />
                    </div>
                }
            </div>

        </FrameWrapper>
    )
}

export const ChartPage = Chart;