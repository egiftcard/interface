import clsx from 'clsx'
import { AnimatedBox, Box } from 'nft/components/Box'
import { assetList } from 'nft/components/collection/CollectionNfts.css'
import { LoadingSparkle } from 'nft/components/common/Loading/LoadingSparkle'
import { Center, Column, Row } from 'nft/components/Flex'
import { VerifiedIcon } from 'nft/components/icons'
import { subhead, subheadSmall } from 'nft/css/common.css'
import { useBag, useIsMobile, useSellAsset, useSellPageState, useWalletBalance, useWalletCollections } from 'nft/hooks'
import { fetchMultipleCollectionStats, fetchWalletAssets, OSCollectionsFetcher } from 'nft/queries'
import { SellPageStateType, WalletAsset } from 'nft/types'
import { Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useReducer, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useInfiniteQuery, useQuery } from 'react-query'

import * as styles from './SelectPage.css'

const formatEth = (price: number) => {
  if (price > 1000000) {
    return `${Math.round(price / 1000000)}M`
  } else if (price > 1000) {
    return `${Math.round(price / 1000)}K`
  } else {
    return `${Math.round(price * 100 + Number.EPSILON) / 100}`
  }
}

export const SelectPage = () => {
  const { address } = useWalletBalance()
  const collectionFilters = useWalletCollections((state) => state.collectionFilters)

  const { data: ownerCollections } = useQuery(
    ['ownerCollections', address],
    () => OSCollectionsFetcher({ params: { asset_owner: address, offset: '0', limit: '300' } }),
    {
      refetchOnWindowFocus: false,
    }
  )

  const ownerCollectionsAddresses = useMemo(() => ownerCollections?.map(({ address }) => address), [ownerCollections])
  const { data: collectionStats } = useQuery(
    ['ownerCollectionStats', ownerCollectionsAddresses],
    () => fetchMultipleCollectionStats({ addresses: ownerCollectionsAddresses ?? [] }),
    {
      refetchOnWindowFocus: false,
    }
  )

  const {
    data: ownerAssetsData,
    fetchNextPage,
    hasNextPage,
    isSuccess,
  } = useInfiniteQuery(
    ['ownerAssets', address, collectionFilters],
    async ({ pageParam = 0 }) => {
      return await fetchWalletAssets({
        ownerAddress: address ?? '',
        collectionAddresses: collectionFilters,
        pageParam,
      })
    },
    {
      getNextPageParam: (lastPage, pages) => {
        return lastPage?.flat().length === 25 ? pages.length : null
      },
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  )

  const ownerAssets = useMemo(() => (isSuccess ? ownerAssetsData?.pages.flat() : null), [isSuccess, ownerAssetsData])

  const walletAssets = useWalletCollections((state) => state.walletAssets)
  const setWalletAssets = useWalletCollections((state) => state.setWalletAssets)
  const displayAssets = useWalletCollections((state) => state.displayAssets)
  const setDisplayAssets = useWalletCollections((state) => state.setDisplayAssets)
  const setWalletCollections = useWalletCollections((state) => state.setWalletCollections)
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const reset = useSellAsset((state) => state.reset)
  const setSellPageState = useSellPageState((state) => state.setSellPageState)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    setWalletAssets(ownerAssets?.flat() ?? [])
  }, [ownerAssets, setWalletAssets])

  useEffect(() => {
    ownerCollections && setWalletCollections(ownerCollections)
  }, [ownerCollections, setWalletCollections])

  const listFilter = useWalletCollections((state) => state.listFilter)

  useEffect(() => {
    if (searchText) {
      const filtered = walletAssets.filter((asset) => asset.name?.toLowerCase().includes(searchText.toLowerCase()))
      setDisplayAssets(filtered, listFilter)
    } else {
      setDisplayAssets(walletAssets, listFilter)
    }
  }, [searchText, walletAssets, listFilter, setDisplayAssets])

  useEffect(() => {
    if (ownerCollections?.length && collectionStats?.length) {
      const ownerCollectionsCopy = [...ownerCollections]
      for (const collection of ownerCollectionsCopy) {
        const floorPrice = collectionStats.find((stat) => stat.address === collection.address)?.floorPrice
        collection.floorPrice = floorPrice ? Math.round(floorPrice * 1000 + Number.EPSILON) / 1000 : 0 //round to at most 3 digits
      }
      setWalletCollections(ownerCollectionsCopy)
    }
  }, [collectionStats, ownerCollections, setWalletCollections])

  return (
    // Column style is temporary while we move over the filters bar that adjust width
    <Column style={{ width: 'calc(100vw - 32px)' }}>
      <Row
        alignItems="flex-start"
        position="relative"
        paddingLeft={{ sm: '0', md: '52' }}
        paddingRight={{ sm: '0', md: '72' }}
        paddingTop={{ sm: '16', md: '40' }}
      >
        <AnimatedBox paddingX="16" flexShrink="0" width="full">
          <Row gap="8" flexWrap="nowrap">
            <CollectionSearch searchText={searchText} setSearchText={setSearchText} />
            <SelectAllButton />
          </Row>
          <InfiniteScroll
            next={fetchNextPage}
            hasMore={hasNextPage ?? false}
            loader={
              hasNextPage ? (
                <Center>
                  <LoadingSparkle />
                </Center>
              ) : null
            }
            dataLength={displayAssets.length}
            style={{ overflow: 'unset' }}
          >
            <div className={assetList}>
              {displayAssets && displayAssets.length
                ? displayAssets.map((asset, index) => <WalletAssetDisplay asset={asset} key={index} />)
                : null}
            </div>
          </InfiniteScroll>
        </AnimatedBox>
      </Row>
      {sellAssets.length > 0 && (
        <Row
          display={{ sm: 'flex', md: 'none' }}
          position="fixed"
          bottom="60"
          left="16"
          height="56"
          borderRadius="12"
          paddingX="16"
          paddingY="12"
          style={{ background: '#0d0e0ef2', width: 'calc(100% - 32px)', lineHeight: '24px' }}
          className={subhead}
        >
          {sellAssets.length}&nbsp; selected item{sellAssets.length === 1 ? '' : 's'}
          <Box
            fontWeight="semibold"
            fontSize="14"
            cursor="pointer"
            color="genieBlue"
            marginRight="20"
            marginLeft="auto"
            onClick={reset}
            lineHeight="16"
          >
            Clear
          </Box>
          <Box
            marginRight="0"
            fontWeight="medium"
            fontSize="14"
            cursor="pointer"
            backgroundColor="genieBlue"
            onClick={() => setSellPageState(SellPageStateType.LISTING)}
            lineHeight="16"
            borderRadius="12"
            padding="8"
          >
            Continue
          </Box>
        </Row>
      )}
    </Column>
  )
}

export const WalletAssetDisplay = ({ asset }: { asset: WalletAsset }) => {
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const selectSellAsset = useSellAsset((state) => state.selectSellAsset)
  const removeSellAsset = useSellAsset((state) => state.removeSellAsset)
  const cartExpanded = useBag((state) => state.bagExpanded)
  const toggleCart = useBag((state) => state.toggleBag)
  const isMobile = useIsMobile()

  const [boxHovered, toggleBoxHovered] = useReducer((state) => {
    return !state
  }, false)
  const [buttonHovered, toggleButtonHovered] = useReducer((state) => {
    return !state
  }, false)

  const isSelected = useMemo(() => {
    return sellAssets.some((item) => asset.id === item.id)
  }, [asset, sellAssets])

  const handleSelect = () => {
    isSelected ? removeSellAsset(asset) : selectSellAsset(asset)
    if (
      !cartExpanded &&
      !sellAssets.find(
        (x) => x.tokenId === asset.tokenId && x.asset_contract.address === asset.asset_contract.address
      ) &&
      !isMobile
    )
      toggleCart()
  }

  return (
    <Column
      as="a"
      href={`#/nft/asset/${asset.asset_contract.address}/${asset.tokenId}?origin=sell`}
      color={'blackBlue'}
      className={subheadSmall}
      onMouseEnter={toggleBoxHovered}
      onMouseLeave={toggleBoxHovered}
    >
      <Box
        as="img"
        alt={asset.name}
        width="full"
        borderTopLeftRadius="20"
        borderTopRightRadius="20"
        src={asset.image_url || '/nft/svgs/image-placeholder.svg'}
        style={{ aspectRatio: '1' }}
      />
      <Column
        position="relative"
        borderBottomLeftRadius="20"
        borderBottomRightRadius="20"
        transition="250"
        backgroundColor={boxHovered ? 'medGray' : 'lightGray'}
        paddingY="12"
        paddingX="12"
      >
        <Box className={subheadSmall} overflow="hidden" textOverflow="ellipsis" marginTop="4" lineHeight="20">
          {asset.name ? asset.name : `#${asset.tokenId}`}
        </Box>
        <Box fontSize="12" marginTop="4" lineHeight="16" overflow="hidden" textOverflow="ellipsis">
          {asset.collection?.name}
          {asset.collectionIsVerified ? <VerifiedIcon className={styles.verifiedBadge} /> : null}
        </Box>
        <Box as="span" fontSize="12" lineHeight="16" color="darkGray" marginTop="8">
          Last:&nbsp;
          {asset.lastPrice ? (
            <>
              {formatEth(asset.lastPrice)}
              &nbsp;ETH
            </>
          ) : (
            <Box as="span" marginLeft="6">
              &mdash;
            </Box>
          )}
        </Box>
        <Box as="span" fontSize="12" lineHeight="16" color="darkGray" marginTop="4">
          Floor:&nbsp;
          {asset.floorPrice ? (
            <>
              {formatEth(asset.floorPrice)}
              &nbsp;ETH
            </>
          ) : (
            <Box as="span" marginLeft="8">
              &mdash;
            </Box>
          )}
        </Box>
        <Box
          marginTop="12"
          textAlign="center"
          width="full"
          borderRadius="12"
          paddingY="8"
          transition="250"
          color={buttonHovered ? 'blackBlue' : isSelected ? 'red400' : 'genieBlue'}
          backgroundColor={buttonHovered ? (isSelected ? 'red400' : 'genieBlue') : 'lightGray'}
          className={subheadSmall}
          onMouseEnter={toggleButtonHovered}
          onMouseLeave={toggleButtonHovered}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleSelect()
          }}
        >
          {isSelected ? 'Remove' : 'Select'}
        </Box>
      </Column>
    </Column>
  )
}

const SelectAllButton = () => {
  const [isAllSelected, setIsAllSelected] = useState(false)
  const displayAssets = useWalletCollections((state) => state.displayAssets)
  const selectSellAsset = useSellAsset((state) => state.selectSellAsset)
  const resetSellAssets = useSellAsset((state) => state.reset)

  useEffect(() => {
    if (!isAllSelected) resetSellAssets()
    if (isAllSelected) {
      displayAssets.forEach((asset) => selectSellAsset(asset))
    }
  }, [displayAssets, isAllSelected, resetSellAssets, selectSellAsset])

  const toggleAllSelected = () => {
    setIsAllSelected(!isAllSelected)
  }
  return (
    <Box
      display="flex"
      flexShrink="0"
      flexDirection="row"
      alignItems="center"
      marginLeft={{ sm: '8', md: 'auto' }}
      borderRadius="12"
      backgroundColor="medGray"
      fontWeight="medium"
      height="44"
      paddingTop="12"
      paddingBottom="12"
      paddingRight="16"
      paddingLeft="16"
      cursor="pointer"
      color="blackBlue"
      onClick={toggleAllSelected}
      className={clsx(`${subheadSmall} ${isAllSelected ? styles.buttonSelected : null}`)}
    >
      {isAllSelected ? 'Deselect all' : 'Select all'}
    </Box>
  )
}

const CollectionSearch = ({
  searchText,
  setSearchText,
}: {
  searchText: string
  setSearchText: Dispatch<SetStateAction<string>>
}) => {
  return (
    <Box
      as="input"
      borderColor={{ default: 'medGray', focus: 'genieBlue' }}
      borderWidth="1px"
      borderStyle="solid"
      borderRadius="8"
      padding="12"
      backgroundColor="white"
      fontSize="14"
      color={{ placeholder: 'darkGray', default: 'blackBlue' }}
      placeholder="Search by name"
      value={searchText}
      width="full"
      onChange={(e: FormEvent<HTMLInputElement>) => setSearchText(e.currentTarget.value)}
    />
  )
}
