import { Link } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'

if (Date.now() > new Date('2023-08-12T00:00:00Z').getTime()) {
  console.warn('Remove DeprecationBanner')
}

const DeprecationBanner = () => {
  const theme = useTheme()
  return (
    <Flex
      width="100%"
      padding="12px 20px"
      flexDirection={'column'}
      sx={{
        border: `1px solid ${theme.border}`,
        background: theme.background,
        borderRadius: '24px',
        gap: '4px',
      }}
    >
      <Text
        sx={{
          fontSize: '14px',
          lineHeight: '20px',
        }}
      >
        View your earnings & manage your liquidity positions through your new earnings dashboard! Access this dashboard
        anytime from <Link to={APP_PATHS.MY_EARNINGS}>My Earnings</Link> under the &apos;Earn&apos; section.
      </Text>
      <Text
        as="span"
        sx={{
          fontStyle: 'italic',
          fontSize: '12px',
          lineHeight: '16px',
        }}
      >
        Note: We will deprecate{' '}
        <Text
          as="span"
          sx={{
            color: theme.text,
          }}
        >
          My Pools
        </Text>{' '}
        by Aug 25.
      </Text>
    </Flex>
  )
}

export default DeprecationBanner