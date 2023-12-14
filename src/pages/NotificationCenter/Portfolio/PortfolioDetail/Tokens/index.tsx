import { ChainId } from '@kyberswap/ks-sdk-core'

import TokenAllocation from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/TokenAllocation'
import WalletInfo from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/WalletInfo'

const Tokens = ({
  mobile,
  ...props
}: {
  walletAddresses: string[]
  chainIds: ChainId[]
  mobile?: boolean
  totalUsd: number
  isAllChain: boolean
}) => {
  return (
    <>
      <TokenAllocation {...props} mobile={mobile} />
      <WalletInfo {...props} />
    </>
  )
}
export default Tokens