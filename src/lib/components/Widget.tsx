import { DEFAULT_LOCALE } from 'constants/locales'
import { Provider as AtomProvider } from 'jotai'
import { BlockUpdater } from 'lib/hooks/useBlockNumber'
import { UNMOUNTING } from 'lib/hooks/useUnmount'
import { Provider as I18nProvider } from 'lib/i18n'
import { MulticallUpdater, store as multicallStore } from 'lib/state/multicall'
import styled, { keyframes, ThemeProvider } from 'lib/theme'
import { PropsWithChildren, StrictMode, useRef } from 'react'
import { Provider as ReduxProvider } from 'react-redux'

import { Provider as DialogProvider } from './Dialog'
import ErrorBoundary from './Error/ErrorBoundary'
import PropValidator from './Error/PropValidator'
import { SwapProps } from './Swap'
import Web3Provider from './Web3Provider'

const slideDown = keyframes`
  to {
    top: calc(100% - 0.25em);
  }
`
const slideUp = keyframes`
  from {
    top: calc(100% - 0.25em);
  }
`

const WidgetWrapper = styled.div<{ width?: number | string }>`
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  background-color: ${({ theme }) => theme.container};
  border-radius: ${({ theme }) => theme.borderRadius}em;
  color: ${({ theme }) => theme.primary};
  display: flex;
  flex-direction: column;
  font-feature-settings: 'ss01' on, 'ss02' on, 'cv01' on, 'cv03' on;
  font-size: 16px;
  font-smooth: always;
  font-variant: none;
  height: 348px;
  min-width: 300px;
  overflow-y: hidden;
  padding: 0.25em;
  position: relative;
  width: ${({ width }) => width && (isNaN(Number(width)) ? width : `${width}px`)};

  @supports (overflow: clip) {
    overflow-y: clip;
  }

  * {
    box-sizing: border-box;
    font-family: ${({ theme }) => theme.fontFamily};
    user-select: none;

    @supports (font-variation-settings: normal) {
      font-family: ${({ theme }) => theme.fontFamilyVariable};
    }
  }

  .dialog {
    animation: ${slideUp} 0.25s ease-in-out;
  }

  .dialog.${UNMOUNTING} {
    animation: ${slideDown} 0.25s ease-in-out;
  }
`

function Updaters() {
  return (
    <>
      <BlockUpdater />
      <MulticallUpdater />
    </>
  )
}

export type WidgetProps = SwapProps

export default function Widget(props: PropsWithChildren<WidgetProps>) {
  const {
    children,
    theme,
    locale = DEFAULT_LOCALE,
    provider,
    jsonRpcEndpoint,
    width = 360,
    dialog,
    className,
    onError,
  } = props

  const wrapper = useRef<HTMLDivElement>(null)
  return (
    <StrictMode>
      <I18nProvider locale={locale}>
        <ThemeProvider theme={theme}>
          <WidgetWrapper width={width} className={className} ref={wrapper}>
            <DialogProvider value={dialog || wrapper.current}>
              <ErrorBoundary onError={onError}>
                <ReduxProvider store={multicallStore}>
                  <AtomProvider>
                    <Web3Provider provider={provider} jsonRpcEndpoint={jsonRpcEndpoint}>
                      <Updaters />
                      <PropValidator {...props} />
                      {children}
                    </Web3Provider>
                  </AtomProvider>
                </ReduxProvider>
              </ErrorBoundary>
            </DialogProvider>
          </WidgetWrapper>
        </ThemeProvider>
      </I18nProvider>
    </StrictMode>
  )
}
