import React from 'react'
import styled from 'styled-components'
import { ethers } from 'ethers'
import { useWeb3Context } from 'web3-react'

import Button from './Button'
import { useAppContext } from '../context'
import { amountFormatter, TRADE_TYPES } from '../utils'

const BuyButtonFrame = styled.div`
  margin: 0.5rem 0rem 0.5rem 0rem;
  display: flex;
  align-items: center;
  flex-direction: center;
  flex-direction: row;
  color: ${props => props.theme.black};

  div {
    width: 100%;
  }

  @media only screen and (max-width: 480px) {
    /* For mobile phones: */
    /* margin: 1.5rem 2rem 0.5rem 2rem; */
  }
`
const ButtonFrame = styled(Button)`
  width: 100%;
`

const Shim = styled.div`
  width: 1rem !important;
  height: 1rem;
`

export default function RedeemButton({ balance, ticker }) {
  const [, setState] = useAppContext()
  const { account } = useWeb3Context()

  function handleToggleCheckout(tradeType) {
    setState(state => ({ ...state, visible: !state.visible, tradeType, selectedTicker: ticker }))
  }

  return (
    <BuyButtonFrame>
      <ButtonFrame
        disabled={process.env.REACT_APP_ENABLED !== "true" || (balance && amountFormatter(balance, 18, 8) > 0 ? false : true)}
        text={'Sell'}
        type={'secondary'}
        onClick={() => {
          handleToggleCheckout(process.env.REACT_APP_ENABLED !== "true" ? null : TRADE_TYPES.SELL)
        }}
      />
      <Shim />
      <ButtonFrame
        disabled={
          process.env.REACT_APP_ENABLED !== "true" || 
          account === null ||
          !balance ||
          balance.lt(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(18)))
        }
        text={'Redeem'}
        type={'secondary'}
        onClick={() => {
          handleToggleCheckout(process.env.REACT_APP_ENABLED !== "true" ? null : TRADE_TYPES.REDEEM)
        }}
      />
    </BuyButtonFrame>
  )
}
