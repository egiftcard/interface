import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import { CollectionAsset } from 'nft/components/collection/CollectionAsset'
import * as styles from 'nft/components/collection/CollectionNfts.css'
import { Center } from 'nft/components/Flex'
import { bodySmall, buttonTextMedium, header2 } from 'nft/css/common.css'
import { AssetsFetcher } from 'nft/queries'
import { useMemo } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useInfiniteQuery } from 'react-query'

import { CollectionAssetLoading } from './CollectionAssetLoading'

interface CollectionNftsProps {
  contractAddress: string
}

export const CollectionNfts = ({ contractAddress }: CollectionNftsProps) => {
  const {
    data: collectionAssets,
    isSuccess: AssetsFetchSuccess,
    isLoading,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(
    [
      'collectionNfts',
      {
        contractAddress,
      },
    ],
    async ({ pageParam = 0 }) => {
      return await AssetsFetcher({
        contractAddress,
        pageParam,
      })
    },
    {
      getNextPageParam: (lastPage, pages) => {
        return lastPage?.flat().length === 25 ? pages.length : null
      },
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchInterval: 5000,
    }
  )

  const collectionNfts = useMemo(() => {
    if (!collectionAssets || !AssetsFetchSuccess) return undefined

    return collectionAssets.pages.flat()
  }, [collectionAssets, AssetsFetchSuccess])

  const loadingAssets = useMemo(() => <>{new Array(25).fill(<CollectionAssetLoading />)}</>, [])

  if (!collectionNfts) {
    // TODO: collection unavailable page
    return <div>No CollectionAssets</div>
  }

  const Nfts = collectionNfts.map((asset) =>
    asset ? <CollectionAsset asset={asset} key={asset.address + asset.tokenId} /> : null
  )

  const hasNfts = collectionNfts.length > 0

  return (
    <InfiniteScroll
      next={fetchNextPage}
      hasMore={hasNextPage ?? false}
      loader={hasNextPage ? loadingAssets : null}
      dataLength={collectionNfts.length}
      style={{ overflow: 'unset' }}
      className={hasNfts ? styles.assetList : undefined}
    >
      {hasNfts ? (
        isLoading ? (
          loadingAssets
        ) : (
          Nfts
        )
      ) : (
        <Center width="full" color="darkGray" style={{ height: '60vh' }}>
          <div style={{ display: 'block', textAlign: 'center' }}>
            <p className={header2}>No NFTS found</p>
            <Box className={clsx(bodySmall, buttonTextMedium)} color="blue" cursor="pointer">
              View full collection
            </Box>
          </div>
        </Center>
      )}
    </InfiniteScroll>
  )
}
