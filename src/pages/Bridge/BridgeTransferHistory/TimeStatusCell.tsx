import { t } from '@lingui/macro'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'
import { fullFormat } from 'pages/Bridge/BridgeTransferHistory/TimeCell'

dayjs.extend(utc)

type Props = {
  timestamp?: number | ''
}
const TimeStatusCell: React.FC<Props> = ({ timestamp }) => {
  const dateString = timestamp ? dayjs.utc(timestamp).local().format(fullFormat) : ''
  const theme = useTheme()
  return (
    <Flex
      sx={{
        fontWeight: 500,
        fontSize: '12px',
        lineHeight: '16px',
        color: theme.subText,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Text
        as="span"
        sx={{
          whiteSpace: 'nowrap',
        }}
      >
        {dateString || t`Unknown`}
      </Text>
    </Flex>
  )
}

export default TimeStatusCell
