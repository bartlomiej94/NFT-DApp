import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useWeb3Context } from 'web3-react'

import Connect from './Connect'
import Works from './Works'
import BuyAndSell from './BuyAndSell'
import Redeem from './Redeem'
import Confirmed from './Confirmed'
import { useAppContext } from '../context'
import { TRADE_TYPES, TOKEN_ADDRESSES, getETHUSDValue, amountFormatter, getContract } from '../utils'
import CCROUTER_ABI from '../utils/ccRouter.json'
import { showToast } from '../pages/Body/index'
import { ethers } from 'ethers'
import { calculateSlippageBounds } from '../pages/Main'

import Confetti from 'react-dom-confetti'

const config = {
  angle: 90,
  spread: 76,
  startVelocity: 51,
  elementCount: 154,
  dragFriction: 0.1,
  duration: 7000,
  stagger: 0,
  width: '10px',
  height: '10px',
  colors: ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a']
}

export function useCount(initialValue, max) {
  const [state, setState] = useAppContext()

  function increment() {
    setState(state => {
      const newCount = state.count + 1
      if (!max || newCount <= max) {
        return { ...state, count: newCount }
      } else {
        return state
      }
    })
  }

  function decrement() {
    if (state.count > 1) {
      setState(state => ({ ...state, count: state.count - 1 }))
    }
  }

  function setCount(val) {
    setState(state => ({ ...state, count: val }))
  }

  // ok to disable exhaustive-deps for `setState` b/c it's actually just a useState setter
  useEffect(() => {
    if (initialValue) {
      setState(state => ({ ...state, count: initialValue }))
    }
  }, [initialValue]) // eslint-disable-line react-hooks/exhaustive-deps

  return [state.count, increment, decrement, setCount]
}

export default function Checkout({
  selectedTokenSymbol,
  setSelectedTokenSymbol,
  ready,
  unlock,
  type,
  validateBuy,
  buy,
  validateSell,
  sell,
  unwrap,
  burn,
  mintNft,
  balance,
  totalSupply,
  reserveToken,
  dollarPrice,
  dollarize,
  reserveETH,
  currentTransactionHash,
  currentTransactionType,
  currentTransactionAmount,
  setCurrentTransaction,
  clearCurrentTransaction,
  setShowConnect,
  showConnect,
  showWorks,
  setShowWorks
}) {
  const { account, library } = useWeb3Context()
  const [state, setState] = useAppContext()

  const redeeming = state.tradeType === TRADE_TYPES.REDEEM || state.tradeType === TRADE_TYPES.MINT_NFT
  const buying = state.tradeType === TRADE_TYPES.BUY
  const unwrapping = state.tradeType === TRADE_TYPES.UNWRAP
  const mintingNft = state.tradeType === TRADE_TYPES.MINT_NFT

  const [lastTransactionHash, setLastTransactionHash] = useState('')
  const [lastTransactionType, setLastTransactionType] = useState('')
  const [lastTransactionAmount, setLastTransactionAmount] = useState('')

  const [ethInputValue, setEthInputValue] = useState()
  const [tokenInputValue, setTokenInputValue] = useState()
  const [usdInputValue, setUsdInputValue] = useState()

  const [isUsingInput, setIsUsingInput] = useState(false)
  const [isButtonDisabled, setIsButtonDisabled] = useState(true)
  const [isComputingValues, setIsComputingValues] = useState(false)

  const pending = !!currentTransactionHash

  // useEffect(() => {
  //   if (state.tradeType === TRADE_TYPES.UNWRAP_ALL) {
  //     console.log("SETTING SELL")
  //     setLastTransactionType(TRADE_TYPES.SELL)
  //   }
  // }, [state.tradeType])

  useEffect(() => {
    computeOtherCoinValuesFromInput(tokenInputValue, "token", !isUsingInput)
  }, [state.ethUsdExchangeRate])

  function onInputBlur(value, coinType, precision) {
    const parsedWithPrecision = parseFloat(value).toFixed(precision);

    switch(coinType) {
      case "eth":
        setEthInputValue(parsedWithPrecision)
        break
      case "token":
        setTokenInputValue(parsedWithPrecision)
        break
      case "usd":
        setUsdInputValue(parsedWithPrecision)
        break
    }
    
    setIsUsingInput(false)
    computeOtherCoinValuesFromInput(parseFloat(value), coinType, true)
  }

  function onInputChange(value, coinType) {
    setIsButtonDisabled(true)
    setIsUsingInput(true)

    switch(coinType) {
      case "eth":
        setEthInputValue(value)
        break
      case "token":
        setTokenInputValue(value)
        break
      case "usd":
        setUsdInputValue(value)
        break
    }

    computeOtherCoinValuesFromInput(value, coinType, false)
  }

  async function computeOtherCoinValuesFromInput(value, coinType, isFinalValue) {
    if (!value || !coinType) {
      setEthInputValue()
      setTokenInputValue()
      setUsdInputValue()

      return
    }

    setIsButtonDisabled(true)
    setIsComputingValues(true)
    
    let parsedValue = isFinalValue ? parseFloat(parseFloat(value).toFixed(6)) : parseFloat(value)
    
    if (isNaN(parsedValue) || parsedValue <= 0) {
      if (isFinalValue) {
        setEthInputValue()
        setTokenInputValue()
        setUsdInputValue()
        
        setIsComputingValues(false)
        showToast("Please provide a valid number.", "error")
      }
      return
    }

    const ethusd = state.ethUsdExchangeRate

    if (!ethusd) {
      setEthInputValue()
      setTokenInputValue()
      setUsdInputValue()

      return
    }
    
    let ethValue, tokenValue, usdValue

    const eth = parseFloat(amountFormatter(reserveETH))
    const token = parseFloat(amountFormatter(reserveToken))
    const k = eth * token

    switch(coinType) {
      case "eth":
        tokenValue = (k / (eth + parsedValue * 1.01) - token) * -1
        ethValue = parsedValue
        usdValue = ethValue * ethusd
        break
      case "token":
        if (buying) {
          tokenValue = parsedValue
          ethValue = ((k / (token - tokenValue)) - eth) * 1.01
          usdValue = ethValue * ethusd
        } else {
          tokenValue = parsedValue
          ethValue = ((k / (token + tokenValue)) - eth) * -1 * 0.99
          usdValue = ethValue * ethusd
        }
        break
      case "usd":
        usdValue = parsedValue
        ethValue = parsedValue / parseFloat(ethusd)
        tokenValue = tokenValue = (k / (eth + ethValue * 1.01) - token) * -1
        break
    }

    // Only allow 1 token at a time
    if (tokenValue > 1 && isFinalValue) {
      const buySellText = buying ? "buy" : "sell"

      tokenValue = 1
      ethValue = ((k / (token + tokenValue)) - eth) * -1 * 0.99
      usdValue = ethValue * ethusd

      showToast(`You can only ${buySellText} 1 token at a time.`, "warn")
    }

    // If not enough tokens, set tokens to amount of owned tokens
    const ownedTokenData = state.tokenBalances.filter(tb => tb.name === state.selectedTicker)[0]
    const ownedTokenBalance = parseFloat(amountFormatter(ownedTokenData.balance))

    if (!buying && tokenValue > ownedTokenBalance && isFinalValue) {
      tokenValue = ownedTokenBalance
      ethValue = ((k / (token + tokenValue)) - eth) * -1 * 0.99
      usdValue = ethValue * ethusd

      showToast("Not enough tokens.", "warn")
    }

    if (isFinalValue) {
      tokenValue = parseFloat(tokenValue.toFixed(6))
    }
    ethValue = parseFloat(ethValue.toFixed(6))
    usdValue = parseFloat(usdValue.toFixed(2))

    if ((ethValue <= 0 || tokenValue <= 0 || usdValue <= 0) && isFinalValue) {
      setEthInputValue()
      setTokenInputValue()
      setUsdInputValue()

      setIsComputingValues(false)
      showToast("The amount is too small.", "error")
      return
    }
    
    if (isFinalValue) {
      setTokenInputValue(tokenValue.toFixed(6))
    }
    setEthInputValue(ethValue.toFixed(6))
    setUsdInputValue(usdValue.toFixed(2))

    setState({ ...state, currentSelectionEthValue: ethValue.toFixed(6)})

    setIsButtonDisabled(false)
    setIsComputingValues(false)
  }

    // Update inputs on price change
    useEffect(() => {
      computeOtherCoinValuesFromInput(tokenInputValue, "token", !isUsingInput)
    }, [dollarPrice])

  useEffect(() => {
    if (currentTransactionHash) {
      library.waitForTransaction(currentTransactionHash).then((response) => {
        setState({ ...state, lastTransactionStatus: response.status, isTransactionPending: false, isUnwrapping: false })

        setLastTransactionHash(currentTransactionHash)
        setLastTransactionType(currentTransactionType)
        setLastTransactionAmount(currentTransactionAmount)
        clearCurrentTransaction()
      })
    }
  }, [
    currentTransactionHash,
    library,
    lastTransactionHash,
    state.showConnect,
    state.visible,
    setShowWorks,
    setShowConnect,
    clearCurrentTransaction,
    lastTransactionHash,
    currentTransactionType,
    currentTransactionAmount
  ])

  function closeCheckout() {
    setShowConnect(false)
    if (state.visible) {
      setShowWorks(false)
      setLastTransactionHash('')
      setState(state => ({
        ...state,
        visible: !state.visible,
        selectedTicker: null,
        currentSelectionEthValue: null,
        lastTransactionStatus: null,
        selectedTshirtSize: null,
      }))
    }
  }

  function renderContent() {
    if (showConnect) {
      return <Connect setShowConnect={setShowConnect} closeCheckout={closeCheckout} />
    } else if (showWorks) {
      return <Works closeCheckout={closeCheckout} />
    } else if (lastTransactionHash) {
      return (
        <Confirmed
          hash={lastTransactionHash}
          type={lastTransactionType}
          tokenType={type}
          amount={lastTransactionAmount}
          closeCheckout={closeCheckout}
          clearLastTransaction={() => {
            setLastTransactionHash('')
            setLastTransactionType('')
            setLastTransactionAmount('')
          }}
          unwrap={unwrap}
          unwrapping={unwrapping}
          setCurrentTransaction={setCurrentTransaction}
        />
      )
    } else {
      if (!redeeming) {
        return (
          <>
            <BuyAndSell
              selectedTokenSymbol={selectedTokenSymbol}
              setSelectedTokenSymbol={setSelectedTokenSymbol}
              ready={ready}
              unlock={unlock}
              type={type}
              validateBuy={validateBuy}
              buy={buy}
              validateSell={validateSell}
              closeCheckout={closeCheckout}
              sell={sell}
              unwrap={unwrap}
              balance={balance}
              dollarPrice={dollarPrice}
              dollarize={dollarize}
              totalSupply={totalSupply}
              setCurrentTransaction={setCurrentTransaction}
              currentTransactionHash={currentTransactionHash}
              currentTransactionAmount={currentTransactionAmount}
              setShowConnect={setShowConnect}
              reserveToken={reserveToken}
              reserveETH={reserveETH}
              pending={pending}
              computeOtherCoinValuesFromInput={computeOtherCoinValuesFromInput}
              isButtonDisabled={isButtonDisabled}
              isComputingValues={isComputingValues}
              onInputBlur={onInputBlur}
              onInputChange={onInputChange}
              ethInputValue={ethInputValue}
              tokenInputValue={tokenInputValue}
              usdInputValue={usdInputValue}
              setIsUsingInput={setIsUsingInput}
            />
          </>
        )
      } else {
        return (
          <Redeem
            ready={ready}
            burn={burn}
            mintNft={mintNft}
            mintingNft={mintingNft}
            balance={balance}
            setCurrentTransaction={setCurrentTransaction}
            setShowConnect={setShowConnect}
            closeCheckout={closeCheckout}
            pending={pending}
          />
        )
      }
    }
  }

  function onBackgroundClick() {
    closeCheckout()
    setEthInputValue()
    setTokenInputValue()
    setUsdInputValue()
  }

  return (
    <div>
      <CheckoutFrame isVisible={state.visible || showConnect}>
        {renderContent()}{' '}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Confetti active={!!lastTransactionHash && state.lastTransactionStatus} config={config} />
        </div>
      </CheckoutFrame>
      <CheckoutBackground onClick={onBackgroundClick} isVisible={state.visible || showConnect} />
    </div>
  )
}

const CheckoutFrame = styled.div`
  position: fixed;
  bottom: ${props => (props.isVisible ? '0px' : '-100%')};
  left: 0px;
  z-index: 99999;
  visibility: ${props => !props.isVisible && 'hidden'};
  

  transition: bottom 0.3s;
  width: 100%;
  max-height: 100vh;
  margin: 0;
  margin-top: 35rem;
  height: 524px;
  height: fit-content;
  border-radius: 8px 8px 0px 0px;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  background-color: #fff;
  border-color: ${props => props.theme.black};
  color: ${props => props.theme.primary};
  box-sizing: border-box;

  @media only screen and (min-device-width: 768px) {
    max-width: 375px;
    left: 0;
    right: 0;
    border-radius: 8px 8px;
    visibility: ${props => !props.isVisible && 'hidden'};

    position: fixed;
    left: 50%;
    top: 10vh;
    -webkit-transform: translateX(-50%) translateY(-80%);
    -ms-transform: translateX(-50%) translateY(-80%);
    transform: translateX(-50%) translateY(-80%);
    width: 100%;
  }
  
  @media only screen and (max-width: 480px) {
    overflow: scroll;
  }

  p {
    margin: 0px;
  }
`

const CheckoutBackground = styled.div`

  position: fixed;
  top: 0px;
  left: 0px;
  opacity: ${props => (props.isVisible ? '.5' : '0')};
  width: 100vw;
  height: 100vh;
  z-index: ${props => (props.isVisible ? '1' : '-1')};
  pointer-events: ${props => (props.isVisible ? 'all' : 'none')};
  background-color: ${props => props.theme.black};
  transition: opacity 0.3s;
  pointer-events: ${props => (props.isVisible ? 'all' : 'none')};
`
