import graphql from 'babel-plugin-relay/macro'
import { parseEther } from 'ethers/lib/utils'
import { GenieCollection, WalletAsset } from 'nft/types'
import { wrapScientificNotation } from 'nft/utils'

import { useNftBalanceQueryQuery } from '../__generated__/types-and-hooks'

const nftBalancePaginationQuery = graphql`
  query NftBalanceQuery(
    $ownerAddress: String!
    $filter: NftBalancesFilterInput
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    nftBalances(
      ownerAddress: $ownerAddress
      filter: $filter
      first: $first
      after: $after
      last: $last
      before: $before
    ) {
      edges {
        node {
          ownedAsset {
            id
            animationUrl
            collection {
              isVerified
              image {
                url
              }
              name
              nftContracts {
                address
                chain
                name
                standard
                symbol
                totalSupply
              }
              markets(currencies: ETH) {
                floorPrice {
                  value
                }
              }
            }
            description
            flaggedBy
            image {
              url
            }
            originalImage {
              url
            }
            name
            ownerAddress
            smallImage {
              url
            }
            suspiciousFlag
            tokenId
            thumbnail {
              url
            }
            listings(first: 1) {
              edges {
                node {
                  price {
                    value
                    currency
                  }
                  createdAt
                  marketplace
                  endAt
                }
              }
            }
          }
          listedMarketplaces
          listingFees {
            payoutAddress
            basisPoints
          }
          lastPrice {
            currency
            timestamp
            value
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
    }
  }
`

// type NftBalanceQueryAsset = NonNullable<NonNullable<NftBalanceConnection>['edges']>[number]

export function useNftBalanceQuery(
  ownerAddress: string,
  collectionFilters?: string[],
  assetsFilter?: { address: string; tokenId: string }[],
  first?: number,
  after?: string,
  last?: number,
  before?: string
) {
  const { data, loading, fetchMore } = useNftBalanceQueryQuery({
    variables: {
      ownerAddress,
      filter:
        assetsFilter && assetsFilter.length > 0
          ? {
              assets: assetsFilter,
            }
          : {
              addresses: collectionFilters,
            },
      first,
      after,
      last,
      before,
    },
  })

  const hasNext = data?.nftBalances?.pageInfo?.hasNextPage
  const loadMore = () =>
    fetchMore({
      variables: {
        after: data?.nftBalances?.pageInfo?.endCursor,
      },
    })

  const walletAssets: WalletAsset[] | undefined = data?.nftBalances?.edges?.map((queryAsset) => {
    const asset = queryAsset?.node.ownedAsset
    const ethPrice = parseEther(wrapScientificNotation(asset?.listings?.edges[0]?.node.price.value ?? 0)).toString()
    return {
      id: asset?.id,
      imageUrl: asset?.image?.url,
      smallImageUrl: asset?.smallImage?.url,
      notForSale: asset?.listings?.edges?.length === 0,
      animationUrl: asset?.animationUrl,
      susFlag: asset?.suspiciousFlag,
      priceInfo: asset?.listings
        ? {
            ETHPrice: ethPrice,
            baseAsset: 'ETH',
            baseDecimals: '18',
            basePrice: ethPrice,
          }
        : undefined,
      name: asset?.name,
      tokenId: asset?.tokenId,
      asset_contract: {
        address: asset?.collection?.nftContracts?.[0]?.address,
        schema_name: asset?.collection?.nftContracts?.[0]?.standard,
        name: asset?.collection?.name,
        description: asset?.description,
        image_url: asset?.collection?.image?.url,
        payout_address: queryAsset?.node?.listingFees?.[0]?.payoutAddress,
      },
      collection: asset?.collection as GenieCollection,
      collectionIsVerified: asset?.collection?.isVerified,
      lastPrice: queryAsset.node.lastPrice?.value,
      floorPrice: asset?.collection?.markets?.[0]?.floorPrice?.value,
      basisPoints: queryAsset?.node?.listingFees?.[0]?.basisPoints ?? 0 / 10000,
      listing_date: asset?.listings?.edges?.[0]?.node?.createdAt?.toString(),
      date_acquired: queryAsset.node.lastPrice?.timestamp?.toString(),
      sellOrders: asset?.listings?.edges.map((edge: any) => edge.node),
      floor_sell_order_price: asset?.listings?.edges?.[0]?.node?.price?.value,
    }
  })
  return { walletAssets, hasNext, loadMore, loading }
}
