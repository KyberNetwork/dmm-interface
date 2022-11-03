import { CSSProperties, ReactNode, useRef, useState } from 'react'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { AutoColumn } from 'components/Column'
import Divider from 'components/Divider'
import { RowBetween } from 'components/Row'

const Wrapper = styled(AutoColumn)`
  & * {
    transition: all ease-in-out 0.3s;
  }
`

const Header = styled(RowBetween)<{ $expanded: boolean }>`
  cursor: pointer;
  z-index: 1;
`

const Content = styled.div<{ $expanded: boolean; $height: number }>`
  padding: 10px 0;
  ${({ $expanded, $height }) =>
    $expanded
      ? `margin-top:0; opacity:1; max-height:500px;`
      : `margin-top:-${$height || 20}px; opacity:0; max-height:0;`}
  z-index: 0;
`
export default function ExpandableBox({
  expandedDefault = false,
  headerContent,
  expandContent,
  backgroundColor,
  border,
  borderRadius,
  padding = '12px',
  color,
  style,
  className,
}: {
  expandedDefault?: boolean
  headerContent?: ReactNode
  expandContent?: ReactNode
  backgroundColor?: string
  border?: string
  borderRadius?: string
  padding?: string
  color?: string
  style?: CSSProperties
  className?: string
}) {
  const [expanded, setExpanded] = useState(expandedDefault)
  const contentRef = useRef<any>()
  const contentHeight = contentRef.current?.getBoundingClientRect().height
  return (
    <Wrapper
      style={{
        backgroundColor: backgroundColor || 'black',
        border: border || 'none',
        borderRadius: borderRadius || '8px',
        overflow: 'hidden',
        color: color,
        ...style,
      }}
      className={className}
    >
      <Header
        onClick={() => setExpanded(ex => !ex)}
        $expanded={expanded}
        style={{
          backgroundColor: backgroundColor || 'black',
          padding: padding,
        }}
      >
        {headerContent || 'Header'} <DropdownSVG style={{ transform: expanded ? 'rotate(180deg)' : undefined }} />
      </Header>
      <Divider style={{ margin: '0px 16px', opacity: expanded ? '1' : '0' }} />
      <Content ref={contentRef as any} $expanded={expanded} $height={contentHeight} style={{ padding: padding }}>
        {expandContent || 'Template content'}
      </Content>
    </Wrapper>
  )
}
