import { useState } from 'react'
import styled from 'styled-components'

import BridgeTransferHistory from '../BridgeTransferHistory'
import TabSelector from './TabSelector'

type Props = {
  className?: string
}

const BridgeHistory: React.FC<Props> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<1>(1)

  return (
    <div className={className}>
      <TabSelector activeTab={activeTab} setActiveTab={setActiveTab} />
      <BridgeTransferHistory />
    </div>
  )
}

export default styled(BridgeHistory)`
  width: 100%;
  flex: 1;

  display: flex;
  flex-direction: column;
  gap: 22px;
`
