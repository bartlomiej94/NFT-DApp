import React from 'react'
import styled from 'styled-components'
import Tilt from 'react-tilt'

import { amountFormatter } from '../utils'
import { useAppContext } from '../context'
import { MarketDirectionBull, MarketDirectionBear } from './Animations'
import tshirtMike from './Gallery/tshirtMike.png'
import tshirtTuba from './Gallery/tshirtTuba.png'

// import { calculateSlippageBounds } from '../pages/Main'


import Gallery1 from './Gallery'
import Spinner from './Spinner'

export default function Card({ totalSupply, dollarPrice, reserveToken, reserveETH, type, yesterdayPriceObject }) {
  const [state] = useAppContext()
  
  const eth = parseFloat(amountFormatter(reserveETH))
  const token = parseFloat(amountFormatter(reserveToken))
  const k = eth * token
  const ethValue = ((k / (token - 1)) - eth) * 1.01

  let todayPrice

  if (state.ethUsdExchangeRate) {
    todayPrice = ethValue * state.ethUsdExchangeRate
  }

  const yesterdayPrice = yesterdayPriceObject && parseFloat(yesterdayPriceObject.price)
  const todayPriceChangePercentage = (todayPrice - yesterdayPrice) / yesterdayPrice * 100
  const isBull = todayPriceChangePercentage >= 8
  const isBear = todayPriceChangePercentage <= -8

  return (
    <>
      <Tilt
        style={{ background: '#000', borderRadius: '8px' }}
        options={{ scale: 1.01, max: 10, glare: true, 'max-glare': 1, speed: 1000 }}
      >
        <CardWrapper>
          {/* {<MarketDirectionWrapper>
            {isBull && <MarketDirectionBull />}
            {isBear && <MarketDirectionBear />}
          </MarketDirectionWrapper>} */}
          <Title>${type.toUpperCase()} Edition 0</Title>
          {/* <SubTitle>${type.toUpperCase()}</SubTitle> */}
          <Gallery1 image={type === 'mike' ? tshirtMike : tshirtTuba} />
          {/* Total: {totalSupply} */}
          <MarketData>
            <span>
              <CurrentPrice>{todayPrice ? `$${todayPrice.toFixed(2)} USD` : <SpinnerWrapper>$<Spinner margin={`0  0 0 -10px`} /></SpinnerWrapper>}</CurrentPrice>
              <SockCount>
                {reserveToken && totalSupply
                  ? `${amountFormatter(reserveToken, 18, 0)}/${totalSupply} available`
                  : ''}
              </SockCount>
            </span>
            {yesterdayPrice && todayPrice && <span>
              <DailyChangeHeader>Daily Gain:<br/></DailyChangeHeader>
              <DailyChange value={todayPriceChangePercentage}>
                {todayPriceChangePercentage > 0 && "+"}{parseFloat(todayPriceChangePercentage.toFixed(2))}%
              </DailyChange>
            </span>}
          </MarketData>
        </CardWrapper>
      </Tilt>
    </>
  )
}



const CardWrapper = styled.div`
  /* max-width: 300px; */
  background: #000000;
  position: relative;
  background: linear-gradient(162.92deg, #2b2b2b 12.36%, #000000 94.75%);
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  color: white;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  cursor: default;
  padding: 24px;
  transform: perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1);
`

const Title = styled.p`
  font-weight: 500;
  font-size: 24px;
  line-height: 126.7%;
  width: 100%;
  margin: 0;
`

const MarketDirectionWrapper = styled.div`
  position: absolute;
  top: 24px;
  right: 24px;
`

// const SubTitle = styled.p`
//   color: #6c7284;
//   font-family: Inter;
//   font-style: normal;
//   font-weight: 500;
//   font-size: 18px;
//   line-height: 156.7%;
//   width: 100%;
//   margin: 0;
//   font-feature-settings: 'tnum' on, 'onum' on;
// `

const SockCount = styled.p`
  color: #aeaeae;
  font-weight: 400;
  margin: 0px;
  font-size: 12px;
  font-feature-settings: 'tnum' on, 'onum' on;
`

const DailyChangeHeader = styled.b`
  font-size: 12px;
`

const DailyChange = styled.b`
  font-size: 20px;

  color: ${props => props.value < 0
    ? "#f54242"
    : props.value > 0
    ? "#84f542"
    : "#ffffff"
  }
`

const CurrentPrice = styled.p`
  font-weight: 600;
  font-size: 18px;
  margin: 0px;
  margin-bottom: 0.5rem;
  font-feature-settings: 'tnum' on, 'onum' on;
`

const MarketData = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
  margin-top: 1rem;
`

const SpinnerWrapper = styled.div`
  display: flex;
  height: 30px;
`
