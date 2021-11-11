import { Options, Placement } from '@popperjs/core'
import useInterval from 'lib/hooks/useInterval'
import styled from 'lib/theme'
import Layer from 'lib/theme/layer'
import maxSize from 'popper-max-size-modifier'
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePopper } from 'react-popper'

const BoundaryContext = createContext<HTMLDivElement | null>(null)

export const BoundaryProvider = BoundaryContext.Provider

const PopoverContainer = styled.div<{ show: boolean }>`
  background-color: ${({ theme }) => theme.dialog};
  border: 1px solid ${({ theme }) => theme.outline};
  border-radius: 0.5em;
  color: ${({ theme }) => theme.primary};
  opacity: ${(props) => (props.show ? 1 : 0)};
  padding: 8px;
  transition: visibility 0.15s linear, opacity 0.15s linear;
  visibility: ${(props) => (props.show ? 'visible' : 'hidden')};
  z-index: ${Layer.TOOLTIP};
`

const Reference = styled.div`
  display: inline-block;
`

const Arrow = styled.div`
  height: 8px;
  width: 8px;
  z-index: ${Layer.TOOLTIP};

  ::before {
    background: ${({ theme }) => theme.dialog};
    border: 1px solid ${({ theme }) => theme.outline};
    content: '';

    height: 8px;
    position: absolute;
    transform: rotate(45deg);
    width: 8px;
  }

  &.arrow-top {
    bottom: -5px;
    ::before {
      border-left: none;
      border-top: none;
    }
  }

  &.arrow-bottom {
    top: -5px;
    ::before {
      border-bottom: none;
      border-right: none;
    }
  }

  &.arrow-left {
    right: -5px;
    ::before {
      border-bottom: none;
      border-left: none;
    }
  }

  &.arrow-right {
    left: -5px;
    ::before {
      border-right: none;
      border-top: none;
    }
  }
`

export interface PopoverProps {
  content: React.ReactNode
  show: boolean
  children: React.ReactNode
  placement?: Placement
}

export default function Popover({ content, show, children, placement = 'auto' }: PopoverProps) {
  const boundary = useContext(BoundaryContext)
  const reference = useRef<HTMLDivElement>(null)

  // Use callback refs to be notified when instantiated
  const [popper, setPopper] = useState<HTMLDivElement | null>(null)
  const [arrow, setArrow] = useState<HTMLDivElement | null>(null)

  const options = useMemo(
    (): Options => ({
      placement,
      strategy: 'absolute',
      modifiers: [
        { name: 'offset', options: { offset: [5, 5] } },
        { name: 'arrow', options: { element: arrow, padding: 6 } },
        { name: 'preventOverflow', options: { boundary, padding: 8 } },
        { ...maxSize, options: { boundary, padding: 28 } },
        {
          name: 'applyMaxSize',
          enabled: true,
          phase: 'beforeWrite',
          requires: ['maxSize'],
          fn({ state }) {
            const { width } = state.modifiersData.maxSize
            state.styles.popper = {
              ...state.styles.popper,
              maxWidth: `${width}px`,
            }
          },
        },
      ],
    }),
    [arrow, boundary, placement]
  )

  const { styles, update, attributes } = usePopper(reference.current, popper, options)

  const updateCallback = useCallback(() => {
    update && update()
  }, [update])
  useInterval(updateCallback, show ? 100 : null)

  return (
    <>
      <Reference ref={reference}>{children}</Reference>
      {boundary &&
        createPortal(
          <PopoverContainer show={show} ref={setPopper} style={styles.popper} {...attributes.popper}>
            {content}
            <Arrow
              className={`arrow-${attributes.popper?.['data-popper-placement'] ?? ''}`}
              ref={setArrow}
              style={styles.arrow}
              {...attributes.arrow}
            />
          </PopoverContainer>,
          boundary
        )}
    </>
  )
}
