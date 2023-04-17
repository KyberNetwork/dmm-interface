import React, { ReactElement, ReactNode, useLayoutEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'

const Wrapper = styled.div`
  padding: 16px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.tableHeader};
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  width: fit-content;
  max-width: 200px;
  position: relative;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.32);

  transform: translateY(5px);
  transition: all 0.5s ease;
  .show {
    transform: translateY(0);
  }
`

const Arrow = styled.div`
  width: 10px;
  height: 10px;
  z-index: 99;
  position: absolute;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.32);
  ::before {
    position: absolute;
    width: 10px;
    height: 10px;
    z-index: 99;

    content: '';
    border: 1px solid transparent;
    transform: rotate(45deg);
    background: ${({ theme }) => theme.tableHeader};
  }

  &.arrow-top {
    bottom: -5px;
    left: 50%;
    transform: translatex(-50%);
    ::before {
      border-top: none;
      border-left: none;
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

export default function SimpleTooltip({
  text,
  delay = 50,
  x,
  y,
  children,
}: {
  text: ReactNode
  delay?: number
  x?: number
  y?: number
  children: ReactElement
}) {
  const ref = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState<boolean>(false)
  const [{ width, height }, setWidthHeight] = useState({ width: 0, height: 0 })
  console.log('🚀 ~ file: SimpleTooltip.tsx:94 ~ width:', width)
  const hovering = useRef(false)
  const handleMouseEnter = () => {
    hovering.current = true
    setShow(true)
  }
  const handleMouseLeave = () => {
    hovering.current = false
    setShow(false)
  }

  const clientRect = ref.current?.getBoundingClientRect()
  const bodyRect = document.body.getBoundingClientRect()
  const top = (y || clientRect?.top || 0) - (height || 50) - 10 - bodyRect.top
  const left = clientRect ? (x || clientRect.left) + clientRect.width / 2 : 0

  const inset = `${top}px 0 0 ${left}px`

  useLayoutEffect(() => {
    if (wrapperRef.current) {
      setWidthHeight({ width: wrapperRef.current.clientWidth, height: wrapperRef.current.clientHeight })
    }
  }, [show])
  return (
    <div ref={ref} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      {(show || (x && y)) &&
        ReactDOM.createPortal(
          <div
            ref={wrapperRef}
            style={{
              position: 'absolute',
              inset: inset,
              zIndex: 100,
              width: 'fit-content',
              height: 'fit-content',
              transform: 'translateX(-50%)',
            }}
          >
            <Wrapper>
              {text}
              <Arrow className={`arrow-top`} />
            </Wrapper>
          </div>,
          document.body,
        )}
    </div>
  )
}
