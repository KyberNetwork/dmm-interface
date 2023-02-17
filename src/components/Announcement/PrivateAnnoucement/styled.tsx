import { rgba } from 'polished'
import styled, { css } from 'styled-components'

export const InboxItemWrapper = styled.div<{ isRead: boolean }>`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.background};

  font-size: 12px;
  padding: 12px 16px;
  gap: 8px;
  display: flex;
  flex-direction: column;

  ${({ isRead }) =>
    !isRead &&
    css`
      cursor: pointer;
      background-color: ${({ theme }) => rgba(theme.buttonBlack, 0.8)};
    `};
`

export const Title = styled.div<{ isRead: boolean }>`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme, isRead }) => (isRead ? theme.text : theme.primary)};
`

export const PrimaryText = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.text};
`
export const InboxItemTime = styled.span`
  color: ${({ theme }) => theme.subText};
`
export const Dot = styled.span`
  background-color: ${({ theme }) => theme.primary};
  border-radius: 100%;
  height: 8px;
  width: 8px;
`

export const InboxItemRow = styled.div`
  justify-content: space-between;
  display: flex;
`
export const RowItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`
