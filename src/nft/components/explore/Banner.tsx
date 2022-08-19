import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import { Center, Column, Row } from 'nft/components/Flex'
import { VerifiedIcon } from 'nft/components/icons'
import { bodySmall, buttonMedium, header1, section } from 'nft/css/common.css'
import { vars } from 'nft/css/sprinkles.css'
import { fetchTrendingCollections } from 'nft/queries'
import { TimePeriod, TrendingCollection } from 'nft/types'
import { formatEthPrice } from 'nft/utils/currency'
import { putCommas } from 'nft/utils/putCommas'
import { formatChange, toSignificant } from 'nft/utils/toSignificant'
import { ReactNode, useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'

import * as styles from './Banner.css'

const Banner = () => {
  /* Sets initially displayed collection to random number between 0 and 4  */
  const [current, setCurrent] = useState(Math.floor(Math.random() * 5))
  const [hovered, setHover] = useState(false)
  const { data: collections } = useQuery(
    ['trendingCollections'],
    () => {
      return fetchTrendingCollections({ volumeType: 'eth', timePeriod: TimePeriod.OneDay, size: 5 })
    },
    {
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  )

  useEffect(() => {
    /* Rotate through Top 5 Collections on 15 second interval */
    const interval = setInterval(async () => {
      if (collections && !hovered && !stale) {
        const nextCollectionIndex = (current + 1) % collections.length
        setCurrent(nextCollectionIndex)
      }
    }, 15_000)
    let stale = false
    return () => {
      stale = true
      clearInterval(interval)
    }
  }, [current, collections, hovered])

  return (
    <Box
      className={styles.fullWidth}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      cursor="pointer"
    >
      {collections ? (
        collections.map((collection: TrendingCollection, index: number) => (
          <Link to={`/nfts/collection/${collection.address}`} key={index} style={{ textDecoration: 'none' }}>
            <Box
              visibility={index === current ? 'visible' : 'hidden'}
              style={{
                height: index === current ? '386px' : '0',
                opacity: index === current ? 1 : 0,
                transition: 'visibility 0s linear 0s, opacity 400ms',
              }}
            >
              <CollectionWrapper bannerImageUrl={collection.bannerImageUrl}>
                <div className={styles.bannerContent}>
                  <Box
                    as="section"
                    className={section}
                    display="flex"
                    flexDirection="row"
                    flexWrap="nowrap"
                    paddingTop="40"
                  >
                    <CollectionDetails collection={collection} hovered={hovered} rank={index + 1} />
                  </Box>
                  <Center marginTop="16">
                    {Array(collections.length)
                      .fill(null)
                      .map((value, carouselIndex) => (
                        <CarouselIndicator
                          active={carouselIndex === current}
                          onClick={() => setCurrent(carouselIndex)}
                          key={carouselIndex}
                        />
                      ))}
                  </Center>
                </div>
              </CollectionWrapper>
            </Box>
          </Link>
        ))
      ) : (
        <>
          {/* TODO: Improve Loading State */}
          <p>Loading</p>
        </>
      )}
    </Box>
  )
}

export default Banner

/* Collection Wrapper: applies background image to entire banner */
const CollectionWrapper = ({ bannerImageUrl, children }: { bannerImageUrl: string; children: ReactNode }) => (
  <div className={styles.bannerWrap} style={{ backgroundImage: `url(${bannerImageUrl})` }}>
    <Box className={styles.bannerOverlay} width="full" />
    {children}
  </div>
)

/* Collection Details: displays collection stats within Banner  */
const CollectionDetails = ({
  collection,
  rank,
  hovered,
}: {
  collection: TrendingCollection
  rank: number
  hovered: boolean
}) => (
  <Column className={styles.collectionDetails} paddingTop="24">
    <div className={styles.volumeRank}>#{rank} volume in 24hr</div>
    <Row>
      <Box as="span" marginTop="16" className={clsx(header1, styles.collectionName)}>
        {collection.name}
      </Box>
      {collection.isVerified && (
        <Box as="span" marginTop="24">
          <VerifiedIcon height="32" width="32" />
        </Box>
      )}
    </Row>
    <Row className={bodySmall} marginTop="12" color="explicitWhite">
      <Box>
        <Box as="span" color="darkGray" marginRight="4">
          Floor:
        </Box>
        {collection.floor ? formatEthPrice(collection.floor.toString()) : '--'} ETH
      </Box>
      <Box>
        {collection.floorChange ? (
          <Box as="span" color={collection.floorChange > 0 ? 'green200' : 'error'} marginLeft="4">
            {collection.floorChange > 0 && '+'}
            {formatChange(collection.floorChange)}%
          </Box>
        ) : null}
      </Box>
      <Box marginLeft="24" color="explicitWhite">
        <Box as="span" color="darkGray" marginRight="4">
          Volume:
        </Box>
        {collection.volume ? putCommas(+toSignificant(collection.volume.toString())) : '--'} ETH
      </Box>
      <Box>
        {collection.volumeChange ? (
          <Box as="span" color={collection.volumeChange > 0 ? 'green200' : 'error'} marginLeft="4">
            {collection.volumeChange > 0 && '+'}
            {formatChange(collection.volumeChange)}%
          </Box>
        ) : null}
      </Box>
    </Row>
    <Link
      className={clsx(buttonMedium, styles.exploreCollection)}
      to={`/nfts/collection/${collection.address}`}
      style={{ textDecoration: 'none', backgroundColor: `${hovered ? vars.color.blue400 : vars.color.grey700}` }}
    >
      Explore collection
    </Link>
  </Column>
)

/* Carousel Progress Indicators */
const CarouselIndicator = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
  <Box
    cursor="pointer"
    paddingTop="16"
    paddingBottom="16"
    onClick={(e) => {
      e.preventDefault()
      e.stopPropagation()
      onClick()
    }}
  >
    <Box
      as="span"
      display="inline-block"
      className={clsx(styles.carouselIndicator, active && styles.carouselIndicatorActive)}
    />
  </Box>
)
