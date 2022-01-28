import React from 'react'
import styled from 'styled-components'

import Button from './Button'
import { useAppContext } from '../context'
import { TRADE_TYPES } from '../utils'

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

// const Shim = styled.div`
//   width: 2rem !important;
//   height: 2rem;
// `

export default function BuyButtons(props) {
  const [, setState] = useAppContext()

  function handleToggleCheckout(tradeType) {
    setState(state => ({ ...state, visible: !state.visible, tradeType, selectedTicker: props.ticker }))
  }

  const balance = props.balances && props.balances.filter(tb => tb[props.ticker])

  return (
    <BuyButtonFrame>
      <ButtonFrame
        // disabled={true}
        disabled={typeof balance === "undefined" || process.env.REACT_APP_ENABLED !== "true"}
        text={'Buy'}
        // text={'Buy'}
        type={'cta'}
        onClick={() => {
          handleToggleCheckout(process.env.REACT_APP_ENABLED !== "true" ? null : TRADE_TYPES.BUY)
        }}
      />
    </BuyButtonFrame>
  )
}

