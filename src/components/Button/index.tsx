import { darken, rgba } from 'polished'
import React from 'react'
import { ChevronDown } from 'react-feather'
import { ButtonProps, Button as RebassButton } from 'rebass/styled-components'
import styled from 'styled-components'

import { RowBetween } from 'components/Row'

const Base = styled(RebassButton)<{
  padding?: string
  margin?: string
  width?: string
  height?: string
  borderRadius?: string
  altDisabledStyle?: boolean
  gap?: string
}>`
  padding: ${({ padding }) => (padding ? padding : '12px')};
  width: ${({ width }) => (width ? width : '100%')};
  height: ${({ height }) => (height ? height : 'auto')};
  margin: ${({ margin }) => (margin ? margin : 'unset')};
  gap: ${({ gap }) => gap && gap};
  font-weight: 500;
  font-size: 14px;
  text-align: center;
  border-radius: ${({ borderRadius }) => (borderRadius ? borderRadius : '999px')};
  outline: none;
  border: 1px solid transparent;
  color: white;
  text-decoration: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  position: relative;
  z-index: 1;

  &:hover {
    filter: brightness(0.8);
  }
  &:disabled {
    cursor: auto;
  }
  &:hover:disabled {
    filter: none;
  }
  & > * {
    user-select: none;
  }
`

export const ButtonPrimary = styled(Base)`
  background-color: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.textReverse};
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.1, theme.primary)};
    background-color: ${({ theme }) => darken(0.1, theme.primary)};
  }
  &:disabled {
    background-color: ${({ theme, altDisabledStyle }) => (altDisabledStyle ? theme.primary : theme.buttonGray)};
    color: ${({ theme, altDisabledStyle }) => (altDisabledStyle ? 'white' : theme.border)};
    cursor: auto;
    box-shadow: none;
    border: 1px solid transparent;
    outline: none;
    opacity: ${({ altDisabledStyle }) => (altDisabledStyle ? '0.7' : '1')};
  }
`

export const ButtonWarning = styled(Base)`
  background-color: ${({ theme }) => theme.warning};
  color: ${({ theme }) => theme.textReverse};
  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.05, theme.warning)};
    background-color: ${({ theme }) => darken(0.05, theme.warning)};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.1, theme.warning)};
    background-color: ${({ theme }) => darken(0.1, theme.warning)};
  }
  &:disabled {
    background-color: ${({ theme }) => rgba(theme.warning, 0.2)};
    cursor: auto;
    color: ${({ theme }) => theme.warning};
  }
`

export const ButtonLight = styled(Base)`
  background-color: ${({ theme }) => `${theme.primary}33`};
  min-width: unset;
  color: ${({ theme }) => theme.primary};
  font-size: 14px;
  font-weight: 500;

  &:active {
    box-shadow: 0 0 0 1pt ${({ theme, disabled }) => !disabled && darken(0.05, `${theme.primary}33`)};
    background-color: ${({ theme, disabled }) => !disabled && darken(0.05, `${theme.primary}33`)};
  }
  :disabled {
    cursor: not-allowed;
    background-color: ${({ theme }) => `${theme.buttonGray}`};
    color: ${({ theme }) => theme.border};
    box-shadow: none;
    border: 1px solid transparent;
    outline: none;
  }
`

export const ButtonGray = styled(Base)`
  background-color: ${({ theme }) => theme.buttonGray};
  color: ${({ theme }) => theme.subText};
  font-size: 16px;
  font-weight: 500;
  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme, disabled }) => !disabled && darken(0.05, theme.bg2)};
    background-color: ${({ theme, disabled }) => !disabled && darken(0.05, theme.bg2)};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme, disabled }) => !disabled && darken(0.1, theme.bg2)};
    background-color: ${({ theme, disabled }) => !disabled && darken(0.1, theme.bg2)};
  }
`

export const ButtonSecondary = styled(Base)`
  border: 1px solid ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.primary};
  background-color: transparent;
  font-size: 16px;
  border-radius: 12px;
  padding: ${({ padding }) => (padding ? padding : '10px')};

  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme }) => theme.primary};
    border: 1px solid ${({ theme }) => theme.primary};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => theme.primary};
    border: 1px solid ${({ theme }) => theme.primary};
  }
  &:disabled {
    opacity: 50%;
    cursor: auto;
  }
  a:hover {
    text-decoration: none;
  }
`

export const ButtonOutlined = styled(Base)<{ baseColor?: string }>`
  border: 1px solid ${({ theme, baseColor }) => (baseColor ? baseColor : theme.subText)};
  background-color: transparent;
  color: ${({ theme, baseColor }) => (baseColor ? baseColor : theme.subText)};
  border-radius: 999px;
  font-size: 14px;

  &:active {
    box-shadow: 0 0 0 1px ${({ theme, baseColor }) => (baseColor ? baseColor : theme.subText)};
  }
  &:disabled {
    color: ${({ theme, altDisabledStyle }) => (altDisabledStyle ? 'white' : theme.border)};
    cursor: auto;
    box-shadow: none;
    border: 1px solid ${({ theme, altDisabledStyle }) => (altDisabledStyle ? 'white' : theme.border)};
  }
`

export const ButtonEmpty = styled(Base)`
  background-color: transparent;
  color: ${({ theme }) => theme.primary};
  display: flex;
  justify-content: center;
  align-items: center;

  &:disabled {
    opacity: 50%;
    cursor: not-allowed;
  }
`

const ButtonConfirmedStyle = styled(Base)`
  background-color: ${({ theme }) => rgba(theme.apr, 0.2)};
  color: ${({ theme }) => theme.green};

  &:disabled {
    cursor: auto;
  }
`

const ButtonErrorStyle = styled(Base)`
  background-color: ${({ theme }) => theme.red};
  border: 1px solid ${({ theme }) => theme.red};

  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.05, theme.red)};
    background-color: ${({ theme }) => darken(0.05, theme.red)};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.1, theme.red)};
    background-color: ${({ theme }) => darken(0.1, theme.red)};
  }
  &:disabled {
    opacity: 50%;
    cursor: auto;
    box-shadow: none;
    background-color: ${({ theme }) => theme.red};
    border: 1px solid ${({ theme }) => theme.red};
  }
`

export function ButtonConfirmed({
  confirmed,
  altDisabledStyle,
  ...rest
}: { confirmed?: boolean; altDisabledStyle?: boolean } & ButtonProps) {
  if (confirmed) {
    return <ButtonConfirmedStyle {...rest} />
  } else {
    return <ButtonPrimary {...rest} altDisabledStyle={altDisabledStyle} />
  }
}

export function ButtonError({ error, ...rest }: { error?: boolean } & ButtonProps) {
  if (error) {
    return <ButtonErrorStyle {...rest} />
  } else {
    return <ButtonPrimary {...rest} />
  }
}

export function ButtonDropdownLight({
  disabled = false,
  children,
  ...rest
}: { disabled?: boolean; children?: React.ReactNode } & ButtonProps) {
  return (
    <ButtonOutlined {...rest} disabled={disabled}>
      <RowBetween>
        <div style={{ display: 'flex', alignItems: 'center' }}>{children}</div>
        <ChevronDown size={24} />
      </RowBetween>
    </ButtonOutlined>
  )
}
