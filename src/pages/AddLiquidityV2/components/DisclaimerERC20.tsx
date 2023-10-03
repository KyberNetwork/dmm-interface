import { Trans } from '@lingui/macro'
import { AlertTriangle } from 'react-feather'
import { Flex, Text } from 'rebass'
import { useGetTokenListQuery } from 'services/ksSetting'

import { WarningCard } from 'components/Card'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

export default function DisclaimerERC20({ href, token0, token1 }: { href?: string; token0: string; token1: string }) {
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const { data: data0 } = useGetTokenListQuery(
    {
      chainId,
      query: token0,
    },
    {
      skip: !token0 || !token1,
    },
  )
  const { data: data1 } = useGetTokenListQuery(
    {
      chainId,
      query: token1,
    },
    {
      skip: !token0 || !token1,
    },
  )

  const hide = data0?.data?.tokens?.[0].isStandardERC20 && data1?.data?.tokens?.[0].isStandardERC20
  if (hide) return null

  return (
    <WarningCard padding="10px 16px">
      <Flex alignItems="center" sx={{ gap: '12px' }} lineHeight={1.5}>
        <AlertTriangle stroke={theme.warning} size="16px" />
        <Text flex={1} fontSize={12}>
          <Trans>
            Disclaimer: KyberSwap is a permissionless protocol optimized for the standard ERC20 implementation only.
            Please do your own research before you provide liquidity using tokens with unique mechanics (e.g. FOT,
            Rebase, LP tokens, contract deposits, etc.). More info{' '}
            <ExternalLink
              href={
                href ||
                'https://docs.kyberswap.com/liquidity-solutions/kyberswap-elastic/user-guides/elastic-pool-creation#non-standard-tokens'
              }
            >
              here
            </ExternalLink>
          </Trans>
        </Text>
      </Flex>
    </WarningCard>
  )
}
