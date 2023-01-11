import { createPortal } from 'react-dom'
import { Rnd } from 'react-rnd'
import { useMedia } from 'react-use'
import { createGlobalStyle } from 'styled-components'

import Modal from 'components/Modal'
import { Z_INDEXS } from 'constants/styles'
import { MEDIA_WIDTHS } from 'theme'

import WalletView, { HANDLE_CLASS_NAME } from './WalletView'

const GlobalStyle = createGlobalStyle<{ $pinned: boolean }>`
  #app > .react-draggable {
    inset: unset;
    top: unset;
    left: unset;
    right: ${({ $pinned }) => ($pinned ? '10px' : '0px')};
    bottom: ${({ $pinned }) => ($pinned ? '10px' : '0px')};
  }
`

const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)

type Props = {
  isModalOpen: boolean
  onDismissModal: () => void
  isPinned: boolean
  setPinned: (v: boolean) => void
}
const WalletPopup: React.FC<Props> = ({ isModalOpen, onDismissModal, isPinned, setPinned }) => {
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const rootNode = document.getElementById('app')

  const shouldOpenPopup = (!isPinned && isModalOpen) || isPinned

  const handleClosePopup = () => {
    onDismissModal()
    setPinned(false)
  }

  const handlePinPopup = () => {
    setPinned(true)
    onDismissModal()
  }

  if (!rootNode) {
    return null
  }

  if (isMobile) {
    return (
      <Modal isOpen={isModalOpen} onDismiss={onDismissModal} minHeight={80}>
        <WalletView onDismiss={handleClosePopup} isPinned={isPinned} />
      </Modal>
    )
  }

  const defaultWidth = 410
  const defaultHeight = 680
  const offset = isPinned ? 10 : 0
  const left = viewportWidth - offset - defaultWidth
  const top = viewportHeight - offset - defaultHeight

  return (
    <>
      <GlobalStyle $pinned={isPinned} />
      <Modal isOpen={isModalOpen && !isPinned} onDismiss={onDismissModal} minHeight={false} />
      {shouldOpenPopup &&
        createPortal(
          <Rnd
            default={{
              x: left,
              y: top,
              width: defaultWidth,
              height: defaultHeight,
            }}
            minWidth="320px"
            minHeight="420px"
            maxWidth="480px"
            maxHeight="960px"
            dragHandleClassName={HANDLE_CLASS_NAME}
            style={{
              position: 'fixed',
              zIndex: isPinned ? Z_INDEXS.WALLET_POPUP : Z_INDEXS.MODAL + 1,
              cursor: 'auto',
              transition: 'top 150ms, left 150ms',
              top,
              left,
            }}
            enableResizing={isPinned}
            disableDragging={!isPinned}
          >
            <WalletView blurBackground onDismiss={handleClosePopup} isPinned={isPinned} onPin={handlePinPopup} />
          </Rnd>,
          rootNode,
        )}
    </>
  )
}

export default WalletPopup
