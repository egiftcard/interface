import { ChevronLeft } from 'react-feather'
import styled from 'styled-components/macro'

const Menu = styled.div`
  width: 100%;
  height: 100%;
  font-size: 16px;
  overflow: auto;
  scrollbar-width: thin;

  ::-webkit-scrollbar {
    background: transparent;
    width: 4px;
  }
  ::-webkit-scrollbar-track {
    margin-top: 40px;
  }
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.backgroundOutline};
    border-radius: 8px;
  }
`

const Header = styled.span`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
`

const ClearAll = styled.div`
  display: inline-block;
  cursor: pointer;
  color: ${({ theme }) => theme.accentAction};
  font-weight: 600;
  font-size: 14px;
  margin-top: auto;
  margin-bottom: auto;

  :hover {
    opacity: 0.6;
    transition: ${({
      theme: {
        transition: { duration, timing },
      },
    }) => `${duration.fast}ms opacity ${timing.in}`};
  }
`

const StyledChevron = styled(ChevronLeft)`
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.textPrimary};
    transition: ${({
      theme: {
        transition: { duration, timing },
      },
    }) => `${duration.fast}ms color ${timing.in}`};
  }
`

const BackSection = styled.div`
  position: absolute;
  background-color: ${({ theme }) => theme.backgroundSurface};
  width: 100%;
  padding: 0 16px 16px 16px;
  color: ${({ theme }) => theme.textSecondary};
  cursor: default;
  display: flex;
  justify-content: space-between;
  z-index: 1;
`

const BackSectionContainer = styled.div`
  display: flex;
  justify-content: space-between;
  position: relative;
  width: 100%;
`

const ChildrenContainer = styled.div`
  overflow-y: auto;
  // height: calc(100% - 30px);
  margin-top: 40px;

  &::-webkit-scrollbar {
    background: transparent;
    border-radius: 8px;
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #999;
    border-radius: 8px;
    height: 10px;
  }
`

export const SlideOutMenu = ({
  children,
  onClose,
  title,
  onClear,
}: {
  onClose: () => void
  title: React.ReactNode
  children: React.ReactNode
  onClear?: () => void
}) => (
  <Menu>
    <BackSection>
      <BackSectionContainer>
        <StyledChevron onClick={onClose} size={24} />
        <Header>{title}</Header>
        {onClear && <ClearAll onClick={onClear}>Clear All</ClearAll>}
      </BackSectionContainer>
    </BackSection>

    <ChildrenContainer>{children}</ChildrenContainer>
  </Menu>
)
