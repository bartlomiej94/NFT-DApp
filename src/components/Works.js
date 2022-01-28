import React from 'react'
import styled from 'styled-components'

import { Controls } from './Redeem'

const WorksFrame = styled.div`
  width: 100%;
  padding: 24px;
  padding-top: 16px;
  box-sizing: border-box;
  font-size: 24px;
  font-weight: 600;
  /* line-height: 170%; */
  /* text-align: center; */
`
const Title = styled.p`
  margin-top: 1rem !important;

  font-weight: 600;
  font-size: 16px;
`

const Desc = styled.p`
  line-height: 150%;
  font-size: 14px;
  margin-top: 1rem !important;
  font-weight: 500;
`

export function link(hash) {
  return `https://etherscan.io/tx/${hash}`
}

export const EtherscanLink = styled.a`
  text-decoration: none;
  color: ${props => props.theme.uniswapPink};
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
`

export default function Works({ closeCheckout }) {
  return (
<WorksFrame>
      <Controls closeCheckout={closeCheckout} theme={'dark'} />

      <Title style={{fontWeight: "bold"}}>How it works:</Title>
      <Desc>
      Inspired by Unisocks, Combat Curve is a market for NFT physicals. For our first drop, each NFT has a unique token that entitles you to 1 real, limited edition tee-shirt, shipped anywhere in the world.
      </Desc>
      <Desc>
      You can sell the token back at any time. 
      </Desc>
      {/* <Desc>
      Each influencer has 100 tokens with a listing price of $100, each of which can be redeemed for 1 physical t-shirt designed by Ratwell. 
      </Desc> */}
      <Title style={{fontWeight: "bold"}}>How it's priced:</Title>
      <Desc style={{fontWeight: "italic"}}>
      For our first drop, $MIKE and $TUBA tokens are listed starting at $50 USD. Each buy/sell will move the respective price. The increase or decrease follows a bonding curve. $MIKE and $TUBA will eventually find an equilibrium based on market demand. May the best swag win.
      </Desc>
      <Title style={{fontWeight: "bold"}}>Unipay:</Title>
      <Desc>
      Buying or selling uses the uniswap protocol and accepts ETH as payment method. The pools of $TUBA & $MIKE are on Uniswap where 35 TUBA tokens and 35 MIKE tokens will be deposited along with a starting value of ETH.
      <br></br>
      <br></br>
      We set transaction fees to 1% in order to offset sunk costs + help extend runway (over time). Team funded LPs out of pocket & platform development in entirety.
      </Desc>
      <Title style={{fontWeight: "bold"}}>Other?</Title>
      <Desc>
      We were VERY surprised to learn some people are confused what $SOCKS are (NGMI). Read up more <a rel="noopener noreferrer" target="_blank" href="https://medium.com/frst/money-laundry-the-rise-of-the-crypto-sock-market-f979aafc3796">here</a>. If you still have questions (Normies, we know you do), reach out! 
      </Desc>
      <Desc>
        <a href="mailto:combatcurve@gmail.com" target="_blank" rel="noopener noreferrer">
          Get in touch.
        </a>
      </Desc>
    </WorksFrame>

    
  )
}
