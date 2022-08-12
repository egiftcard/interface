import { LoadingRows as BaseLoadingRows } from 'components/Loader/styled'
import styled from 'styled-components/macro'
import { colors as ColorsPalette } from 'theme/colors'
import { opacify } from 'theme/utils'

import { AutoColumn } from '../Column'
import { RowBetween } from '../Row'

export const TextDot = styled.div`
  height: 3px;
  width: 3px;
  background-color: ${({ theme }) => theme.deprecated_text2};
  border-radius: 50%;
`

export const Checkbox = styled.input`
  border: 1px solid ${({ theme }) => theme.deprecated_red3};
  height: 20px;
  margin: 0;
`

export const PaddedColumn = styled(AutoColumn)`
  padding: 20px;
`

export const MenuItem = styled(RowBetween)<{ phase0Flag?: boolean }>`
  padding: 4px 20px;
  height: 56px;
  display: grid;
  grid-template-columns: auto minmax(auto, 1fr) auto minmax(0, 72px);
  grid-gap: 16px;
  cursor: ${({ disabled }) => !disabled && 'pointer'};
  pointer-events: ${({ disabled }) => disabled && 'none'};
  :hover {
    background-color: ${({ theme, disabled, phase0Flag }) =>
      (phase0Flag && opacify(8, ColorsPalette.gray200)) || (!disabled && theme.deprecated_bg2)};
  }
  opacity: ${({ disabled, selected }) => (disabled || selected ? 0.5 : 1)};
`

export const SearchInput = styled.input<{ phase0Flag?: boolean }>`
  position: relative;
  display: flex;
  padding: 16px;
  height: ${({ phase0Flag }) => phase0Flag && '40px'};
  align-items: center;
  width: 100%;
  white-space: nowrap;
  background: none;
  background-color: ${({ theme, phase0Flag }) => phase0Flag && theme.backgroundModule};
  border: none;
  outline: none;
  border-radius: ${({ phase0Flag }) => (phase0Flag ? '12px' : '20px')};
  color: ${({ theme }) => theme.deprecated_text1};
  border-style: solid;
  border: 1px solid ${({ theme, phase0Flag }) => (phase0Flag ? theme.backgroundOutline : theme.deprecated_bg3)};
  -webkit-appearance: none;

  font-size: ${({ phase0Flag }) => (phase0Flag ? '16px' : '18px')};

  ::placeholder {
    color: ${({ theme, phase0Flag }) => (phase0Flag ? theme.textTertiary : theme.deprecated_text3)};
    font-size: ${({ phase0Flag }) => phase0Flag && '16px'};
  }
  transition: border 100ms;
  :focus {
    border: 1px solid ${({ theme, phase0Flag }) => (phase0Flag ? 'transparent' : theme.deprecated_primary1)};
    background-color: ${({ theme, phase0Flag }) => phase0Flag && theme.accentActionSoft};
    outline: none;
  }
`
export const Separator = styled.div<{ phase0Flag?: boolean }>`
  width: 100%;
  height: 1px;
  background-color: ${({ theme, phase0Flag }) => (phase0Flag ? theme.backgroundOutline : theme.deprecated_bg2)};
`

export const SeparatorDark = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.deprecated_bg3};
`

export const LoadingRows = styled(BaseLoadingRows)`
  grid-column-gap: 0.5em;
  grid-template-columns: repeat(12, 1fr);
  max-width: 960px;
  padding: 12px 20px;

  & > div:nth-child(4n + 1) {
    grid-column: 1 / 8;
    height: 1em;
    margin-bottom: 0.25em;
  }
  & > div:nth-child(4n + 2) {
    grid-column: 12;
    height: 1em;
    margin-top: 0.25em;
  }
  & > div:nth-child(4n + 3) {
    grid-column: 1 / 4;
    height: 0.75em;
  }
`
