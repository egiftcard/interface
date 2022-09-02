import {
    ArrowDownRight,
    ArrowUpRight,
    ChevronLeft,
    Globe,
    TrendingDown,
    TrendingUp,
    Twitter
} from "react-feather";
import { Currency, Token } from "@uniswap/sdk-core";
import { DarkCard, LightCard } from "components/Card";
import { Dots, LoadingSkeleton } from "pages/Pool/styleds";
import { MenuItem, SidebarHeader } from "react-pro-sidebar";
import { RowBetween, RowFixed } from "components/Row";
import { StyledInternalLink, TYPE } from "theme";
import styled, { AnyStyledComponent } from "styled-components/macro";
import {
    toChecksum,
    usePairs,
    useTokenData,
    useTokenTransactions,
} from "state/logs/utils";
import { useCurrency, useToken } from "hooks/Tokens";
import { useDexscreenerToken, useTokenInfo } from "components/swap/ChartPage";

import Badge from "components/Badge";
import { ButtonSecondary } from "components/Button";
import { CTooltip } from "@coreui/react";
import { CardSection } from "components/earn/styled";
import { ChartSearchModal } from "pages/Charts/ChartSearchModal";
import { ChartSidebar } from "components/ChartSidebar";
import CurrencyInputPanel from "components/CurrencyInputPanel";
import CurrencyLogo from "components/CurrencyLogo";
import DoubleCurrencyLogo from "components/DoubleLogo";
import Moment from "./Moment";
import QuestionHelper from "components/QuestionHelper";
import React from "react";
import ReactGA from 'react-ga'
import Toggle from "components/Toggle";
import { TopTokenHolders } from "components/TopTokenHolders/TopTokenHolders";
import TradingViewWidget from "react-tradingview-widget";
import _ from "lodash";
import { abbreviateNumber } from "components/BurntKiba";
import { darken } from "polished";
import { isAddress } from "utils";
import { isMobile } from "react-device-detect";
import { useBscTokenTransactions } from "state/logs/bscUtils";
import { useConvertTokenAmountToUsdString } from "pages/Vote/VotePage";
import { useHistory } from "react-router-dom";
import { useParams } from "react-router";
import { useTokenBalance } from "state/wallet/hooks";
import { useUserChartHistoryManager } from "state/user/hooks";
import { useWeb3React } from "@web3-react/core";

const StyledDiv = styled.div`
    font-family: "Open Sans";
    font-size: 14px;
    display: flex;
    gap: 20px;
    align-items: ${isMobile ? "stretch" : "center"};
    padding: 3px 8px;
    flex-flow: ${() => (isMobile ? "column wrap" : "row wrap")};
  `;
  
  const BackLink = styled(StyledDiv)`
    &:hover {
      color: lightgreen !important;
    }
  `;
  
  const RecentCard = styled(LightCard)`
    background: ${(props) => props.theme.bg5};
    border: 1px solid #eee;
    border: none;
    &:hover {
      background: ${(props) => darken(0.1, props.theme.bg5)};
      > * {
        text-decoration: none;
      }
      transition: all ease 0.1s;
    }
  `;
  
  const StyledGlobe = styled(Globe)<{ disabled?: boolean }>`
    font-size: 12px;
    color: #fff;
    margin-top: 2px;
    cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
    opacity: ${(props) => (props.disabled ? 0.5 : 1)};
    &:hover {
      color: #eee;
      transition: ease all 0.1s;
      cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
    }
  `;
  
  const StyledTwitter = styled(Twitter)<{ disabled?: boolean }>`
    font-size: 12px;
    color: #fff;
    margin-top: 2px;
    cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
    opacity: ${(props) => (props.disabled ? 0.5 : 1)};
    &:hover {
      color: #eee !important;
  
      transition: ease all 0.1s;
      cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
    }
  `;
  
  export const SelectiveChart = () => {
    const ref = React.useRef<any>();
    const { account, chainId } = useWeb3React();
    const history = useHistory();
    const params = useParams<{
      tokenAddress?: string;
      tokenSymbol?: string;
      name?: string;
      decimals?: string;
    }>();
    const mainnetCurrency = useCurrency(
      !chainId || chainId === 1 ? params?.tokenAddress : undefined
    );
    const prebuilt = React.useMemo(
      () =>
        ({
          address: params?.tokenAddress,
          chainId,
          name: "",
          symbol: params?.tokenSymbol,
          isNative: false,
          isToken: true,
        } as Currency),
      [params]
    );
    const prebuiltCurrency = React.useMemo(
      () => (!chainId || chainId === 1 ? mainnetCurrency : prebuilt),
      [mainnetCurrency, chainId, prebuilt]
    );
    const tokenAddressSupplied = React.useMemo(
      () => ref?.current?.address && isAddress(ref?.current?.address) &&
            ref.current?.address != params?.tokenAddress ? 
            toChecksum(ref.current?.address) :
            toChecksum(params?.tokenAddress),
      [params, ref.current]
    );
    const [address, setAddress] = React.useState(
      tokenAddressSupplied ? tokenAddressSupplied : ""
    );
    const tokenInfo = useTokenInfo(chainId ?? 1, address);
  
    const hasSocials = React.useMemo(
      () =>
        tokenInfo &&
        (tokenInfo?.twitter || tokenInfo?.coingecko || tokenInfo?.website),
      [tokenInfo]
    );
  
    const token = useToken(address);
    const tokenBalance = useTokenBalance(account ?? undefined, token as any);
    const pairs: Array<any> = usePairs(address?.toLowerCase());
    const screenerToken = useDexscreenerToken(address);
    const transactionData = useTokenTransactions(address?.toLowerCase(), 30000);
    const LastFetchedNode = React.useMemo(
      () =>
        transactionData?.lastFetched ? (
          <Moment date={transactionData.lastFetched} liveUpdate>
            {(moment: any) => (
              <span style={{ fontSize: 12 }}>
                Last updated {moment.fromNow()}
              </span>
            )}
          </Moment>
        ) : null,
      [transactionData.lastFetched]
    );
    const [selectedCurrency, setSelectedCurrency] = React.useReducer(
      function (
        state: { selectedCurrency: Currency | null | undefined },
        action: { type: "update"; payload: Currency | null | undefined }
      ) {
        switch (action.type) {
          case "update":
            return {
              ...state,
              selectedCurrency: action.payload,
            };
          default:
            return state;
        }
      },
      {
        selectedCurrency: prebuiltCurrency,
      }
    );
    const hasSelectedData = Boolean(params?.tokenAddress && selectedCurrency);
  
    const [loadingNewData, setLoadingNewData] = React.useState(false);
    const bscTransactionData = useBscTokenTransactions(
      chainId && chainId == 56 ? address?.toLowerCase() : "",
      60000
    );
    //const [tokenData, setTokenData] = React.useState<any>({})
    const tokenData = useTokenData(address?.toLowerCase(), 60000);
    React.useEffect(() => {
      return history.listen((location: any) => {
        const newAddress = location.pathname.split("/")[2]?.toLowerCase();
        const newSymbol = location.pathname.split("/")[3];
        const newName = location.pathname.split("/")[4];
        const newDecimals = location.pathname.split("/")[5];
        if (newAddress && newSymbol) {
          setLoadingNewData(true);
          const checksummed = toChecksum(newAddress);
          setAddress(checksummed);
          const newToken = new Token(
            chainId ?? 1,
            newAddress,
            parseInt(newDecimals) ?? 18,
            newSymbol,
            newName ?? ""
          );
          if (ref.current) {
            ref.current = newToken;
          } else {
            ref.current = {
              ...mainnetCurrency,
              address: checksummed,
              symbol: newSymbol,
            };
            if (newName) {
              ref.current.name = newName;
            }
            if (newDecimals) {
              ref.current.decimals = +newDecimals;
            }
          }
  
          setSelectedCurrency({ type: "update", payload: ref.current });
          updateUserChartHistory([
            {
              time: new Date().getTime(),
              data: [],
              token: { ...ref.current, wrapped: undefined },
              summary: `Viewing ${ref.current.name} token chart`,
            },
          ]);
          
          ReactGA.event({
              category: "Charts",
              action: `View`,
              label: `${ref.current.name}:${ref.current.symbol}`
          })

          setTimeout(() => {
            setLoadingNewData(false);
            window.scrollTo({ top: 0 });
          }, 1200);
        } else {
          setSelectedCurrency({ payload: undefined, type: "update" });
          ref.current = undefined;
        }
      });
    }, [history, mainnetCurrency]);
  
    const [userChartHistory, updateUserChartHistory] =
      useUserChartHistoryManager();
  
    React.useEffect(() => {
      if (Object.keys(params).every((key) => !Boolean((params as any)[key]))) {
        setSelectedCurrency({ payload: undefined, type: "update" });
        ref.current = undefined;
      } else if (
        params.tokenAddress &&
        params.name &&
        params.tokenSymbol &&
        params.decimals
      ) {
        updateUserChartHistory([
          {
            time: new Date().getTime(),
            data: [],
            token: { ...prebuilt, wrapped: undefined },
            summary: `Viewing ${prebuilt.name} token chart`,
          },
        ]);
      }
    }, []);
  
    const formattedTransactions = React.useMemo(() => {
      let retVal: any;
      if ((chainId && chainId === 1) || !chainId) retVal = transactionData;
      if (chainId && chainId === 56) retVal = bscTransactionData;
      return retVal?.data?.swaps?.map((swap: any) => {
        const netToken0 = swap.amount0In - swap.amount0Out;
        const netToken1 = swap.amount1In - swap.amount1Out;
        const newTxn: Record<string, any> = {};
        if (netToken0 < 0) {
          newTxn.token0Symbol = swap.pair.token0.symbol;
          newTxn.token1Symbol = swap.pair.token1.symbol;
          newTxn.token0Amount = Math.abs(netToken0);
          newTxn.token1Amount = Math.abs(netToken1);
        } else if (netToken1 < 0) {
          newTxn.token0Symbol = swap.pair.token1.symbol;
          newTxn.token1Symbol = swap.pair.token0.symbol;
          newTxn.token0Amount = Math.abs(netToken1);
          newTxn.token1Amount = Math.abs(netToken0);
        }
        newTxn.transaction = swap.transaction;
        newTxn.hash = swap.transaction.id;
        newTxn.timestamp = swap.transaction.timestamp;
        newTxn.type = "swap";
        newTxn.amountUSD = swap.amountUSD;
        newTxn.account =
          swap.to === "0x7a250d5630b4cf539739df2c5dacb4c659f2488d"
            ? swap.from
            : swap.to;
        return newTxn;
      });
    }, [transactionData, bscTransactionData, chainId]);
  
    const usdcAndEthFormatted = useConvertTokenAmountToUsdString(
      token as Token,
      parseFloat(tokenBalance?.toFixed(2) as string),
      pairs?.[0],
      transactionData?.data?.swaps?.map((swap: any) => ({
        ...swap,
        timestamp: swap.transaction.timestamp,
      }))
    );
  
    const pair = React.useMemo(
      function () {
        if (!Boolean(Array.isArray(pairs) && pairs.length)) return undefined;
        return `${
          pairs[0].token0.symbol?.toLowerCase() === token?.symbol?.toLowerCase()
            ? pairs[0].token1?.id
            : pairs[0].token0?.id
        }`;
      },
      [pairs.length, token]
    );
  
    const pairCurrency = useCurrency(pair ?? undefined);
  
    const holdings = {
      token,
      tokenBalance: tokenBalance || 0,
      tokenValue: 0,
      formattedUsdString: usdcAndEthFormatted?.value,
      refetchUsdValue: usdcAndEthFormatted?.refetch,
      pair,
    };
  
    const backClick = () => {
      ref.current = {
        equals: () => false,
        address: undefined,
        decimals: undefined,
        symbol: undefined,
        name: undefined,
        isToken: false,
        isNative: false,
      };
      setSelectedCurrency({ type: "update", payload: ref.current });
      history.goBack();
    };
    const formatPriceLabel = (key: string) => {
      switch (key) {
        case "h24":
          return "Price 24hr";
        case "h6":
          return "Price 6hr";
        case "h1":
          return "Price 1hr";
        case "m5":
          return "Price 5min";
        default:
          return key;
      }
    };
  
    const [showSearch, setShowSearch] = React.useState(false);
    const toggleShowSearchOn = () => setShowSearch(true);
    const toggleShowSearchOff = () => setShowSearch(false);
    const onCurrencySelect = (currency: any) => {
        if (!currency) return;
        ref.current = currency;
        setSelectedCurrency({ type: "update", payload: currency });
        const currencyAddress =
          currency?.address || currency?.wrapped?.address;
        history.push(
          `/selective-charts/${currencyAddress}/${currency?.symbol}/${currency.name}/${currency.decimals}`
        );
        setAddress(currencyAddress);
      }
    const PanelMemo = React.useMemo(() => {
      return !Boolean(chainId) || Boolean(chainId && chainId === 1) ? (
        <>
          <div
            style={{
              paddingTop: hasSelectedData ? "" : 20,
              width: "100%",
              gap: 20,
              display: "flex",
              flexFlow: isMobile ? "column wrap" : "row nowrap",
              alignItems: "center",
            }}
          >
            {!hasSelectedData ? (
              <>
                <ButtonSecondary onClick={toggleShowSearchOn}>
                  <TYPE.black style={{ cursor: "pointer" }}>
                    Search for a token to view <ArrowUpRight />
                  </TYPE.black>
                </ButtonSecondary>
              </>
            ) : null}
            <CurrencyInputPanel
              label={"gains"}
              showMaxButton={false}
              value={``}
              showCurrencyAmount={false}
              hideBalance={true}
              hideInput={true}
              currency={!hasSelectedData ? undefined : mainnetCurrency}
              onUserInput={_.noop}
              onMax={undefined}
              fiatValue={undefined}
              onCurrencySelect={onCurrencySelect}
              otherCurrency={undefined}
              showCommonBases={false}
              id="chart-currency-input"
            />
          </div>
        </>
      ) : Boolean(chainId) ? (
        <TYPE.small>
          {chainId && chainId == 56 ? "BSC" : `${chainId}`} support coming soon
        </TYPE.small>
      ) : null;
    }, [
      (selectedCurrency.selectedCurrency as any)?.address,
      hasSelectedData,
      isMobile,
      chainId,
    ]);
  
    const getRetVal = React.useMemo(
      function () {
        let retVal = "";
        const { selectedCurrency: currency } = selectedCurrency;
        if (chainId === 1 || !chainId) {
          retVal = "UNISWAP:";
          if (pairs && pairs.length) {
            const pairSymbol = `${
              pairs[0].token0.symbol?.toLowerCase() ===
              currency?.symbol?.toLowerCase()
                ? pairs[0].token1.symbol
                : pairs[0].token0.symbol
            }`;
            if (pairSymbol === "DAI")
              return `DOLLAR${currency?.symbol?.replace("$", "")}DAI`;
            retVal += `${currency?.symbol}${
              pairs[0].token0.symbol === currency?.symbol
                ? pairs[0].token1.symbol
                : pairs[0].token0.symbol
            }`;
          } else {
            if (
              params.tokenAddress &&
              params.tokenSymbol &&
              params.tokenSymbol !== "WETH"
            )
              retVal = `${retVal}${params.tokenSymbol}WETH`;
            else if (currency && currency.symbol && currency.symbol !== "WETH")
              retVal = `UNISWAP:${currency.symbol}WETH`;
            else if (currency && currency.symbol && currency.symbol === "WETH")
              retVal = "UNISWAP:WETHUSDT";
  
            if (
              (retVal == "UNISWAP:" && params?.tokenSymbol) ||
              prebuilt?.symbol
            ) {
              retVal = `UNISWAP:${
                params?.tokenSymbol ? params?.tokenSymbol : prebuilt?.symbol
              }WETH`;
            }
          }
        } else if (chainId && chainId === 56) {
          retVal = "PANCAKESWAP:" + params?.tokenSymbol + "WBNB";
        }
        return retVal;
      },
      [
        params?.tokenSymbol,
        pairs,
        selectedCurrency.selectedCurrency,
        params?.tokenAddress,
        selectedCurrency,
        prebuilt,
      ]
    );
    // this page will not use access denied, all users can view top token charts
    const accessDenied = false;
    const [horizontal, setHorizontal] = React.useState(false);
    const deps = [
      selectedCurrency,
      pairs,
      getRetVal,
      params?.tokenSymbol,
      prebuilt?.symbol,
      chainId,
    ];
    const tokenSymbolForChart = React.useMemo(() => getRetVal, deps);
    const chainLabel = React.useMemo(
      () => (!chainId || chainId === 1 ? `WETH` : chainId === 56 ? "WBNB" : ""),
      [chainId]
    );
    const [collapsed, setCollapsed] = React.useState(false);
    const gridTemplateColumns = React.useMemo(
      function () {
        if (!selectedCurrency || !params?.tokenAddress) return `100%`;
        return isMobile ? "100%" : collapsed ? "5.5% 95.5%" : "25% 75%";
      },
      [selectedCurrency, isMobile, params.tokenAddress, collapsed]
    );
  
    const SocialsMemo = React.useMemo(
      function () {
        if (tokenInfo) {
          let twitter = tokenInfo?.twitter
          let coingecko = tokenInfo?.coingecko
          let website = tokenInfo?.website
          if (params?.tokenSymbol?.toLowerCase() == "kiba") {
            twitter = "KibaInuWorld";
            website = "https://kibainu.org";
            coingecko = "kiba-inu";
          }
          return (
            <React.Fragment>
              <SidebarHeader>
                <TYPE.small
                  style={{
                    marginBottom: 3,
                    borderBottom: `1px solid #444`,
                  }}
                >
                  {" "}
                  {tokenInfo?.symbol} Socials
                </TYPE.small>
              </SidebarHeader>
              <MenuItem
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", columnGap: 10 }}
                >
                  {twitter ? (
                    <CTooltip
                      placement="bottom"
                      content={`${tokenInfo?.name} Twitter`}
                    >
                      <a
                        style={{ display: "inline-block" }}
                        href={`https://twitter.com/${twitter}`}
                      >
                        <StyledTwitter />
                      </a>
                    </CTooltip>
                  ) : (
                    <CTooltip
                      placement="bottom"
                      content={`Unable to find ${tokenInfo?.name} twitter`}
                    >
                      <span style={{ display: "inline-block" }}>
                        <StyledTwitter disabled />
                      </span>
                    </CTooltip>
                  )}
                  {website ? (
                    <CTooltip
                      placement="bottom"
                      content={`${tokenInfo?.name} Website`}
                    >
                      <a style={{ display: "inline-block" }} href={website}>
                        <StyledGlobe />
                      </a>
                    </CTooltip>
                  ) : (
                    <CTooltip
                      placement="bottom"
                      content={`Unable to find ${tokenInfo?.name} website`}
                    >
                      <span style={{ display: "inline-block" }}>
                        <StyledGlobe disabled />
                      </span>
                    </CTooltip>
                  )}
                  {coingecko && (
                    <CTooltip
                      placement="bottom"
                      content={`${tokenInfo?.name} Coin Gecko Listing`}
                    >
                      <a
                        style={{ display: "inline-block" }}
                        href={`https://coingecko.com/en/coins/${coingecko}`}
                      >
                        <img
                          src="https://cdn.filestackcontent.com/MKnOxRS8QjaB2bNYyfou"
                          style={{ height: 25, width: 25 }}
                        />
                      </a>
                    </CTooltip>
                  )}
                </div>
              </MenuItem>
            </React.Fragment>
          );
        }
        return null
      },
      [hasSocials, tokenInfo, params.tokenSymbol]
    );
  
    return (
      <>
        <ChartSearchModal isOpen={showSearch} onDismiss={toggleShowSearchOff} />
        <DarkCard
          style={{
            maxWidth: "100%",
            display: "grid",
            background: "#252632",
            gridTemplateColumns: gridTemplateColumns,
            borderRadius: 30,
          }}
        >
          {hasSelectedData && (
            <div>
              <ChartSidebar
                tokenCurrency={mainnetCurrency}
                holdings={holdings}
                loading={loadingNewData}
                collapsed={collapsed}
                tokenInfo={tokenInfo}
                onCollapse={setCollapsed}
                token={{
                  name:
                    params?.name ??
                    (((selectedCurrency.selectedCurrency as Currency)
                      ? (selectedCurrency.selectedCurrency as Currency)
                      : (ref.current as Currency)
                    )?.name as string),
                  symbol:
                    params?.tokenSymbol ??
                    (((selectedCurrency.selectedCurrency as Currency)
                      ? (selectedCurrency.selectedCurrency as Currency)
                      : (ref.current as Currency)
                    )?.symbol as string),
                  decimals:
                    params?.decimals ??
                    ((selectedCurrency.selectedCurrency as Currency)
                      ? (selectedCurrency.selectedCurrency as Currency)
                      : (ref.current as Currency)
                    )?.decimals?.toString(),
                  address:
                    params?.tokenAddress ??
                    ((selectedCurrency.selectedCurrency as Currency)
                      ? (selectedCurrency.selectedCurrency as Currency)
                      : (ref.current as Currency)
                    )?.wrapped?.address,
                }}
                tokenData={tokenData}
                screenerToken={screenerToken}
                chainId={chainId}
              />
            </div>
          )}
          <div
            style={{
              marginLeft: isMobile ? 0 : 10,
              borderLeft: isMobile
                ? "none"
                : Boolean(
                    params?.tokenAddress &&
                      (selectedCurrency || !!prebuilt?.symbol)
                  )
                ? "1px solid #444"
                : "none",
            }}
          >
            <CardSection style={{ padding: isMobile ? 0 : "" }}>
              <StyledDiv
                style={{
                  justifyContent: !hasSelectedData
                    ? ""
                    : !isMobile
                    ? "space-between"
                    : "",
                  paddingBottom: 2,
                  marginTop: 10,
                  marginBottom: 5,
                }}
              >
                <span
                  style={{
                    paddingRight: isMobile ? 0 : 15,
                    borderRight: `${!isMobile ? "1px solid #444" : "none"}`,
                  }}
                >
                  {!loadingNewData && (
                    <>
                      <BackLink style={{ cursor: "pointer" }} onClick={backClick}>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <ChevronLeft /> Go Back
                        </span>
                      </BackLink>
                    </>
                  )}
                </span>
  
                {!!hasSelectedData && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      paddingRight: isMobile ? 0 : 15,
                      borderRight: `${!isMobile ? "1px solid #444" : "none"}`,
                    }}
                  >
                    Viewing
                    <DoubleCurrencyLogo
                      style={{
                        marginRight: 3,
                      }}
                      size={30}
                      margin
                      currency0={mainnetCurrency as any}
                      currency1={pairCurrency as any}
                    />
                    on KibaCharts
                  </span>
                )}
  
                {!hasSelectedData ? (
                  <Badge>Select a token to get started</Badge>
                ) : isMobile ? null : (
                  <span style={{ margin: 0 }}>{SocialsMemo}</span>
                )}
  
                {loadingNewData && <LoadingSkeleton count={1} />}
  
                {!hasSelectedData || loadingNewData
                  ? null
                  : Boolean(
                      screenerToken &&
                        (screenerToken?.priceChange || screenerToken.volume)
                    ) && (
                      <div style={{ paddingLeft: 0 }}>
                        <div
                          style={{
                            paddingLeft: 0,
                            justifyContent: "space-between",
                            display: "flex",
                            flexFlow: isMobile ? "row" : "row wrap",
                            alignItems: "center",
                            gap: 15,
                          }}
                        >
                          {Object.keys(screenerToken.priceChange).map((key) => (
                            <div
                              key={key}
                              style={{
                                paddingRight:
                                  _.last(
                                    Object.keys(screenerToken.priceChange)
                                  ) == key
                                    ? 0
                                    : 10,
                                borderRight:
                                  _.last(
                                    Object.keys(screenerToken.priceChange)
                                  ) == key
                                    ? "none"
                                    : "1px solid #444",
                              }}
                            >
                              <TYPE.small textAlign="center">
                                {formatPriceLabel(key)}
                              </TYPE.small>
                              <TYPE.black>
                                {screenerToken?.priceChange?.[key] < 0 ? (
                                  <TrendingDown style={{ color: "red" }} />
                                ) : (
                                  <TrendingUp style={{ color: "green" }} />
                                )}
                                {screenerToken?.priceChange?.[key]}%
                              </TYPE.black>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
  
                {PanelMemo}
  
                {Boolean(!hasSelectedData && userChartHistory.length) && (
                  <div
                    style={{
                      width: "100%",
                      padding: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        width: "100%",
                        alignItems: "center",
                        marginBottom: 5,
                      }}
                    >
                      <TYPE.black alignItems="center" display="flex">
                        Recently Viewed Charts <ArrowDownRight />
                      </TYPE.black>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        padding: 20,
                        display: "grid",
                        alignItems: "center",
                        gridTemplateColumns: isMobile
                          ? "100%"
                          : "auto auto auto auto",
                        gap: 20,
                      }}
                    >
                      {_.orderBy(
                        _.uniqBy(userChartHistory, (a) =>
                          a?.token?.address?.toLowerCase()
                        ),
                        (a) => a.time
                      )
                        .reverse()
                        .map((item: any) => (
                          <StyledInternalLink
                            key={item?.token?.address}
                            color={"#fff"}
                            to={`/selective-charts/${item?.token?.address}/${
                              item?.token?.symbol
                            }/${
                              item?.token?.name
                                ? item?.token?.name
                                : item?.token?.symbol
                            }/${
                              item?.token?.decimals ? item?.token?.decimals : 18
                            }`}
                          >
                            <RecentCard>
                              <div
                                style={{
                                  color: "#fff",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    flexFlow: "row wrap",
                                    gap: 5,
                                    alignItems: "center",
                                  }}
                                >
                                  <CurrencyLogo currency={item?.token} />
                                  <TYPE.small>
                                    <span>{item?.token?.symbol} </span>
                                    <br />
                                    <span> {item?.token?.name}</span>
                                  </TYPE.small>
                                </div>
                                <TYPE.black alignItems="center">
                                  <div
                                    style={{
                                      cursor: "pointer",
                                      display: "flex",
                                      flexFlow: "column wrap",
                                      alignItems: "center",
                                    }}
                                  >
                                    <span>
                                      View Chart <ArrowUpRight />
                                    </span>
                                  </div>
                                </TYPE.black>
                              </div>
                            </RecentCard>
                          </StyledInternalLink>
                        ))}
                    </div>
                  </div>
                )}
              </StyledDiv>
  
              {!accessDenied &&
                (loadingNewData ? (
                  <LoadingSkeleton count={15} borderRadius={20} />
                ) : (
                  <React.Fragment>
                    {hasSelectedData && <TokenStats tokenData={screenerToken} />}
                    {hasSelectedData ? (
                      <TopTokenHolders address={address ?? params?.tokenAddress} chainId={chainId} />
                    ) : null}
  
                    <div
                      style={{ marginTop: "0.25rem", marginBottom: "0.25rem" }}
                    ></div>
                    {Boolean(
                      params?.tokenAddress &&
                        (selectedCurrency || !!prebuilt?.symbol)
                    ) ? (
                      <>
                        <ChartComponent
                          pairData={pairs}
                          symbol={
                            params?.tokenSymbol ||
                            selectedCurrency?.selectedCurrency?.symbol ||
                            ("" as string)
                          }
                          address={address as string}
                          tokenSymbolForChart={tokenSymbolForChart}
                        />
                        <div
                          style={{
                            display: "block",
                            width: "100%",
                            overflowY: "auto",
                            maxHeight: 500,
                          }}
                        >
                          {LastFetchedNode}
                          <table
                            style={{
                              background:
                                "linear-gradient(rgb(21, 25, 36), rgb(17 19 32))",
                              width: "100%",
                              borderRadius: 20,
                            }}
                          >
                            <thead
                              style={{
                                textAlign: "left",
                                position: "sticky",
                                top: 0,
                                background: "#131722",
                                width: "100%",
                              }}
                            >
                              <tr style={{ borderBottom: "1px solid #444" }}>
                                <th>Date</th>
                                <th>Type</th>
                                <th>
                                  Amt{" "}
                                  {!chainId || chainId === 1
                                    ? pairs && pairs?.length
                                      ? pairs[0]?.token0?.symbol ===
                                        params?.tokenSymbol
                                        ? pairs[0]?.token1?.symbol
                                        : pairs[0]?.token0?.symbol
                                      : "WETH"
                                    : "BNB"}
                                </th>
                                <th>Amt USD</th>
                                <th>Amt Tokens</th>
                                <th>Maker</th>
                                <th>Tx</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(!formattedTransactions?.length ||
                                !formattedTransactions) && (
                                <tr>
                                  <td colSpan={5}>
                                    <Dots> Loading transaction data</Dots>
                                  </td>
                                </tr>
                              )}
                              {formattedTransactions &&
                                formattedTransactions?.map(
                                  (item: any, index: number) => (
                                    <tr
                                      style={{
                                        background:
                                          item.account?.toLowerCase() ==
                                          account?.toLowerCase()
                                            ? "#444"
                                            : "",
                                        paddingBottom: 5,
                                      }}
                                      key={`${item.token0Symbol}_${
                                        item.timestamp * 1000
                                      }_${item.hash}_${index}`}
                                    >
                                      <td style={{ fontSize: 12 }}>
                                        {new Date(
                                          item.timestamp * 1000
                                        ).toLocaleString()}
                                      </td>
                                      {[
                                        item.token0Symbol,
                                        item.token1Symbol,
                                      ].includes(chainLabel) && (
                                        <td
                                          style={{
                                            color:
                                              item.token0Symbol !==
                                              `${
                                                params?.tokenSymbol == "ETH"
                                                  ? "WETH"
                                                  : params?.tokenSymbol
                                              }`
                                                ? "#971B1C"
                                                : "#779681",
                                          }}
                                        >
                                          {item.token0Symbol !==
                                          `${
                                            params?.tokenSymbol == "ETH"
                                              ? "WETH"
                                              : params?.tokenSymbol
                                          }`
                                            ? "SELL"
                                            : "BUY"}
                                        </td>
                                      )}
                                      {![
                                        item.token0Symbol,
                                        item.token1Symbol,
                                      ].includes(chainLabel) && (
                                        <td
                                          style={{
                                            color:
                                              item.token1Symbol ===
                                              `${
                                                params?.tokenSymbol == "ETH"
                                                  ? "WETH"
                                                  : params?.tokenSymbol
                                              }`
                                                ? "#971B1C"
                                                : "#779681",
                                          }}
                                        >
                                          {item.token1Symbol ===
                                          `${
                                            params?.tokenSymbol == "ETH"
                                              ? "WETH"
                                              : params?.tokenSymbol
                                          }`
                                            ? "SELL"
                                            : "BUY"}
                                        </td>
                                      )}
                                      {[
                                        item.token0Symbol,
                                        item.token1Symbol,
                                      ].includes(chainLabel) && (
                                        <>
                                          <td>
                                            {item.token0Symbol === chainLabel && (
                                              <>
                                                {Number(
                                                  +item.token0Amount?.toFixed(2)
                                                )?.toLocaleString()}{" "}
                                                {item.token0Symbol}
                                              </>
                                            )}
                                            {item.token1Symbol === chainLabel && (
                                              <>
                                                {Number(
                                                  +item.token1Amount?.toFixed(2)
                                                )?.toLocaleString()}{" "}
                                                {item.token1Symbol}
                                              </>
                                            )}
                                          </td>
                                          <td>
                                            $
                                            {Number(
                                              (+item?.amountUSD)?.toFixed(2)
                                            ).toLocaleString()}
                                          </td>
                                          <td>
                                            {item.token0Symbol !== chainLabel && (
                                              <>
                                                {Number(
                                                  +item.token0Amount?.toFixed(2)
                                                )?.toLocaleString()}{" "}
                                                {item.token0Symbol}
                                              </>
                                            )}
                                            {item.token1Symbol !== chainLabel && (
                                              <>
                                                {Number(
                                                  +item.token1Amount?.toFixed(2)
                                                )?.toLocaleString()}{" "}
                                                {item.token1Symbol}
                                              </>
                                            )}
                                          </td>
                                        </>
                                      )}
                                      {![
                                        item.token0Symbol,
                                        item.token1Symbol,
                                      ].includes(chainLabel) && (
                                        <>
                                          <td>
                                            {item.token0Symbol !==
                                              `${
                                                params?.tokenSymbol == "ETH"
                                                  ? "WETH"
                                                  : params?.tokenSymbol
                                              }` && (
                                              <>
                                                {Number(
                                                  +item.token0Amount?.toFixed(2)
                                                )?.toLocaleString()}{" "}
                                                {item.token0Symbol}
                                              </>
                                            )}
                                            {item.token1Symbol !==
                                              `${
                                                params?.tokenSymbol == "ETH"
                                                  ? "WETH"
                                                  : params?.tokenSymbol
                                              }` && (
                                              <>
                                                {Number(
                                                  +item.token1Amount?.toFixed(2)
                                                )?.toLocaleString()}{" "}
                                                {item.token1Symbol}
                                              </>
                                            )}
                                          </td>
                                          <td>
                                            $
                                            {Number(
                                              (+item?.amountUSD)?.toFixed(2)
                                            ).toLocaleString()}
                                          </td>
                                          <td>
                                            {item.token0Symbol ===
                                              `${
                                                params?.tokenSymbol == "ETH"
                                                  ? "WETH"
                                                  : params?.tokenSymbol
                                              }` && (
                                              <>
                                                {Number(
                                                  +item.token0Amount?.toFixed(2)
                                                )?.toLocaleString()}{" "}
                                                {item.token0Symbol}
                                              </>
                                            )}
                                            {item.token1Symbol ===
                                              `${
                                                params?.tokenSymbol == "ETH"
                                                  ? "WETH"
                                                  : params?.tokenSymbol
                                              }` && (
                                              <>
                                                {Number(
                                                  +item.token1Amount?.toFixed(2)
                                                )?.toLocaleString()}{" "}
                                                {item.token1Symbol}
                                              </>
                                            )}
                                          </td>
                                        </>
                                      )}
                                      <td>
                                        <a
                                          style={{ color: "#D57A47" }}
                                          href={
                                            "https://etherscan.io/address/" +
                                            item.account
                                          }
                                        >
                                          {item.account &&
                                            item.account.slice(0, 6) +
                                              "..." +
                                              item.account.slice(38, 42)}
                                        </a>
                                      </td>
                                      <td>
                                        <a
                                          style={{ color: "#D57A47" }}
                                          href={
                                            "https://etherscan.io/tx/" +
                                            item?.hash
                                          }
                                        >
                                          {item?.hash &&
                                            item?.transaction?.id.slice(0, 6) +
                                              "..." +
                                              item?.transaction?.id.slice(38, 42)}
                                        </a>
                                      </td>
                                    </tr>
                                  )
                                )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : null}
                  </React.Fragment>
                ))}
            </CardSection>
  
            {!!accessDenied && (
              <CardSection>
                <p
                  style={{
                    height: 400,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  You must own Kiba Inu tokens to use this feature.
                </p>
              </CardSection>
            )}
          </div>
        </DarkCard>
      </>
    );
  };
  
  const VolumeContainer = styled.div`
    display: flex;
    align-items: center;
    justfy-content: stretch;
    gap: 20px;
  `;
  
  const VolumePanelWrapper = styled.div`
    display: flex;
    align-items: start;
    flex-flow: column wrap;
    justify-content: start;
    gap: 15px;
    border-left: ${() => (isMobile ? 0 : 1)}px solid #444;
    padding-left: ${() => (isMobile ? 0 : 25)}px;
  `;

  const StatsWrapper = styled.div`
  display: flex;
  background: #161a26;
  box-shadow: 0px 0px 1px 0px;
  padding: 9px 14px;
  flex-flow: row wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
  border-radius:14px;
  `
  
  const TokenStats = ({ tokenData }: { tokenData?: any }) => {
    const getLabel = (key: string, label = "txns") => {
      switch (key) {
        case "h24":
          return "24 Hour " + label;
        case "h6":
          return "6 Hour " + label;
        case "h1":
          return "1 Hour " + label;
        case "m5":
          return "5 Min " + label;
        default:
          return key;
      }
    };
    const [showStats, setShowStats] = React.useState(false);
    const toggleStats = () => setShowStats(!showStats);
    const hasStats = Boolean(tokenData && Object.keys(tokenData)?.length > 0);
    const ToggleElm = hasStats ? (
      <TYPE.small style={{ marginBottom: 5, marginTop: 5 }}>
        <RowBetween>
          <RowFixed>
            <TYPE.black fontWeight={400} fontSize={14} color={"#fff"}>
              Toggle Advanced Stats
            </TYPE.black>
            <QuestionHelper
              text={
                <>
                  Shows advanced stats regarding transactions including detailed
                  buy / sell counts and volume for different time ranges over the
                  past 24hrs.
                </>
              }
            />
          </RowFixed>
          <Toggle
            id="toggle-advanced-stats-button"
            isActive={showStats}
            toggle={toggleStats}
          />
        </RowBetween>
      </TYPE.small>
    ) : null;
    return showStats ? (
      tokenData && tokenData?.txns ? (
        <div>
          {ToggleElm}
          <StatsWrapper>
            {Object.keys(tokenData?.txns)
              .reverse()
              .map((key) => (
                <div
                  key={key}
                  style={{
                    paddingRight:
                      key == _.last(Object.keys(tokenData?.txns).reverse())
                        ? 0
                        : 5,
                    paddingBottom: 5,
                    borderRight:
                      key == _.last(Object.keys(tokenData?.txns).reverse())
                        ? "none"
                        : "1px solid #444",
                  }}
                >
                  <StyledDiv style={{ fontSize: 12, color: "burntorange" }}>
                    {getLabel(key)}
                  </StyledDiv>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    {Object.keys(tokenData.txns[key]).map((subKey) => (
                      <TYPE.white key={subKey} textAlign={"center"}>
                        <StyledDiv
                          style={{
                            color: subKey == "sells" ? "#f33645" : "#079a81",
                          }}
                        >
                          {subKey}
                        </StyledDiv>
                        <span
                          style={{
                            color: subKey == "sells" ? "#f33645" : "#079a81",
                          }}
                        >
                          {tokenData.txns[key][subKey]}
                        </span>
                      </TYPE.white>
                    ))}
                  </div>
                </div>
              ))}
            <VolumePanelWrapper>
              <TYPE.small>Hourly Volume</TYPE.small>
              <VolumeContainer>
                {Object.keys(tokenData?.volume)
                  .reverse()
                  .map((key) => (
                    <div
                      key={key}
                      style={{
                        paddingRight:
                          _.last(Object.keys(tokenData.volume).reverse()) == key
                            ? 0
                            : 10,
                        borderRight:
                          _.last(Object.keys(tokenData.volume).reverse()) == key
                            ? "none"
                            : "1px solid #444",
                      }}
                    >
                      <TYPE.small textAlign="center">
                        {getLabel(key, "Volume")}
                      </TYPE.small>
                      <TYPE.black>
                        ${abbreviateNumber(tokenData?.volume?.[key])}
                      </TYPE.black>
                    </div>
                  ))}
              </VolumeContainer>
            </VolumePanelWrapper>
           </StatsWrapper>
          </div>
      ) : (
        <p style={{ margin: 0 }}>Failed to load token data.</p>
      )
    ) : (
      <>{ToggleElm}</>
    );
  };
  
  const ChartComponent = React.memo(
    (props: {
      symbol: string;
      address: string;
      tokenSymbolForChart: string;
      pairData?: any[];
    }) => {
      const { symbol, tokenSymbolForChart, pairData } = props;
      const chartKey = React.useMemo(() => {
    if (symbol && (symbol == "ETH" || symbol == "WETH")) {
          return "UNISWAP:WETHUSDT";
        }
  
        if (pairData && pairData.length) {
          const pairSymbol = `${
            pairData[0].token0.symbol?.toLowerCase() === symbol?.toLowerCase()
              ? pairData[0].token1.symbol
              : pairData[0].token0.symbol
          }`;
          if (pairSymbol === "DAI") return `DOLLAR${symbol.replace("$", "")}DAI`;
          return `UNISWAP:${symbol.replace("$", "") || ""}${pairSymbol}`;
        }
  
        return tokenSymbolForChart ? tokenSymbolForChart : `pair.not.found`;
      }, [pairData, symbol]);
      const symbolForChart = chartKey
        ? chartKey
        : tokenSymbolForChart.replace("$", "");
      return (
        <div style={{ height: 400 }}>
          {symbolForChart && (
            <TradingViewWidget
              hide_side_toolbar={false}
              symbol={symbolForChart}
              theme={"Dark"}
              locale={"en"}
              autosize={true}
            />
          )}
        </div>
      );
    },
    _.isEqual
  );
  ChartComponent.displayName = "CComponent";
  