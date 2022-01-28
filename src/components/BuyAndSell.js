import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useWeb3Context } from 'web3-react'
import { Input, Tooltip } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import Button from './Button'
import SelectToken from './SelectToken'
import IncrementToken from './IncrementToken'
import Spinner from './Spinner'
import { PaperplaneLoader, UnlockLoader, UnwrapLoader } from './Loaders'
import { useAppContext } from '../context'
import { ERROR_CODES, amountFormatter, TRADE_TYPES } from '../utils'
import ether from './Gallery/ether.png'
import tshirtMike from './Gallery/tshirtMike.png'
import tshirtTuba from './Gallery/tshirtTuba.png'
import etherSvg from './Gallery/ether.svg'
import close from './Gallery/close.svg'

import { calculateSlippageBounds } from '../pages/Main'

import fieldStyles from './styles/fields.module.scss'

export function useCount() {
  const [state, setState] = useAppContext()

  function increment() {
    setState(state => ({ ...state, count: state.count + 1 }))
  }

  function decrement() {
    if (state.count >= 1) {
      setState(state => ({ ...state, count: state.count - 1 }))
    }
  }

  function setCount(val) {
    let int = val.toInt()
    setState(state => ({ ...state, count: int }))
  }
  return [state.count, increment, decrement, setCount]
}

function getValidationErrorMessage(validationError) {
  if (!validationError) {
    return null
  } else {
    switch (validationError.code) {
      case ERROR_CODES.INVALID_AMOUNT: {
        return 'Invalid Amount'
      }
      case ERROR_CODES.INVALID_TRADE: {
        return 'Invalid Trade'
      }
      case ERROR_CODES.INVALID_BUY_TOKEN_AMOUNT: {
        return 'Can Buy 1 Token at a Time'
      }
      case ERROR_CODES.INVALID_SELL_TOKEN_AMOUNT: {
        return 'Can Sell 1 Token at a Time'
      }
      case ERROR_CODES.INSUFFICIENT_ALLOWANCE: {
        return 'Set Allowance to Continue'
      }
      case ERROR_CODES.INSUFFICIENT_ETH_GAS: {
        return 'Not Enough ETH to Pay Gas'
      }
      case ERROR_CODES.INSUFFICIENT_ETH: {
        return 'Not Enough ETH'
      }
      case ERROR_CODES.PRICE_IMPACT_TOO_HIGH: {
        return 'Price Impact Too High'
      }
      case ERROR_CODES.NOT_ENOUGH_ETH_FOR_SLIPPAGE: {
        return 'Slippage Too High'
      }
      case ERROR_CODES.INSUFFICIENT_SELECTED_TOKEN_BALANCE: {
        return 'Not Enough Tokens'
      }
      default: {
        return 'Unknown Error'
      }
    }
  }
}

export default function BuyAndSell({
  selectedTokenSymbol,
  setSelectedTokenSymbol,
  ready,
  unlock,
  type,
  closeCheckout,
  validateBuy,
  buy,
  validateSell,
  pending,
  reserveToken,
  reserveETH,
  balance,
  sell,
  unwrap,
  dollarPrice,
  dollarize,
  totalSupply,
  ethusdExchangeRate,
  setCurrentTransaction,
  currentTransactionHash,
  currentTransactionAmount,
  setShowConnect,
  isButtonDisabled,
  isComputingValues,
  onInputBlur,
  onInputChange,
  ethInputValue,
  tokenInputValue,
  usdInputValue,
}) {
  const [state, setState] = useAppContext()
  const { account, setConnector } = useWeb3Context()
  
  const buying = state.tradeType === TRADE_TYPES.BUY
  const selling = state.tradeType === TRADE_TYPES.SELL
  const unwrappingAll = state.tradeType === TRADE_TYPES.UNWRAP_ALL
  
  const [buyValidationState, setBuyValidationState] = useState({}) // { maximumInputValue, inputValue, outputValue }
  const [sellValidationState, setSellValidationState] = useState({}) // { inputValue, outputValue, minimumOutputValue }
  const [validationError, setValidationError] = useState()

  function link(hash) {
    return `https://etherscan.io/tx/${hash}`
  }

  let ethValue

  const eth = parseFloat(amountFormatter(reserveETH))
  const token = parseFloat(amountFormatter(reserveToken))
  const k = eth * token
  
  if (buying) {
    ethValue = ((k / (token - 1)) - eth) * 1.01
  } else {
    ethValue = ((k / (token + 1)) - eth) * -1 * 0.99
  }

  let dollarPriceValue

  if (state.ethUsdExchangeRate) {
    dollarPriceValue = ethValue * state.ethUsdExchangeRate
  }


  function getText(account, buying, errorMessage, ready, pending, hash) {
    // console.log({account, buying, errorMessage, ready, pending, hash})
    if (state.isLoadingWallet) {
      return <Spinner />
    }
    if (account === null) {
      return 'Connect Wallet'
    } else if (ready && !errorMessage) {
      if (!buying) {
        if (pending && hash) {
          return 'Waiting for confirmation'
        } else {
          return `Sell ${type && type.toUpperCase()}`
        }
      } else {
        if (pending && hash) {
          return 'Waiting for confirmation'
        } else {
          return `Buy ${type && type.toUpperCase()}`
        }
      }
    } else {
      return errorMessage ? errorMessage : <SpinnerContainer><Spinner /></SpinnerContainer>
    }
  }

  // buy state validation
  useEffect(() => {
    if (ready && buying && tokenInputValue && ethInputValue) {
      try {
        const { error: validationError, ...validationState } = validateBuy(String(tokenInputValue), String(ethInputValue))
        setBuyValidationState(validationState)
        setValidationError(validationError || null)

        return () => {
          setBuyValidationState({})
          setValidationError()
        }
      } catch (error) {
        setBuyValidationState({})
        setValidationError(error)
      }
    }
  }, [ready, buying, validateBuy, tokenInputValue, ethInputValue])

  // sell state validation
  useEffect(() => {
    if (ready && selling) {
      try {
        // Setting value to .1 if null because we need to check for token Approval instantly.
        // This is bad. Need to figure out how to trigger this check instantly.
        const { error: validationError, ...validationState } = validateSell(String(tokenInputValue), String(ethInputValue), state.selectedTicker)
        setSellValidationState(validationState)
        setValidationError(validationError || null)

        return () => {
          setSellValidationState({})
          setValidationError()
        }
      } catch (error) {
        setSellValidationState({})
        setValidationError(error)
      }
    }
  }, [ready, selling, validateSell, tokenInputValue, ethInputValue, state.selectedTicker])

  const shouldRenderUnlock = validationError && validationError.code === ERROR_CODES.INSUFFICIENT_ALLOWANCE

  const errorMessage = getValidationErrorMessage(validationError)

  function renderFormData() {
    let conditionalRender
    if (buying && buyValidationState.inputValue) {
      conditionalRender = (
        <>
          <div>
            ${ready && dollarPriceValue && parseFloat(dollarPriceValue).toFixed(2)}
            {/* ({amountFormatter(buyValidationState.inputValue, 18, 4)} {selectedTokenSymbol}) */}
          </div>
        </>
      )
    } else if (selling && sellValidationState.outputValue) {
      conditionalRender = (
        <>
          <div>
            ${ready && dollarPriceValue && parseFloat(dollarPriceValue).toFixed(2)}
            {/* ({amountFormatter(sellValidationState.outputValue, 18, 4)} {selectedTokenSymbol}) */}
          </div>
        </>
      )
    } else {
      conditionalRender = <div>$<Spinner /></div>
    }

    return <>{conditionalRender}</>
  }

  function TokenVal() {
    if (buying && buyValidationState.inputValue) {
      return amountFormatter(buyValidationState.inputValue, 18, 4)
    } else if (selling && sellValidationState.outputValue) {
      return amountFormatter(sellValidationState.outputValue, 18, 4)
    } else {
      return '0'
    }
  }
  
  return (
    <>
      <TopFrame>
        {/* <button onClick={() => fake()}>test</button> */}
        {!unwrappingAll && <Unicorn>
          <span role="img" aria-label="unicorn">
            ⚔️
          </span>{' '}
          Pay
        </Unicorn>}
        <Close src={close} onClick={() => closeCheckout()} alt="close" />
        {!unwrappingAll && <ImgStyle src={type === 'mike' ? tshirtMike : type === 'tuba' ? tshirtTuba : etherSvg} alt="Logo" />}
        {unwrappingAll && <ImgStyleEth src={etherSvg} alt="Ether" />}
        {!unwrappingAll && <InfoFrame pending={pending}>
          <CurrentPrice>
            {/* {dollarPrice && `$${amountFormatter(dollarPrice, 18, 2)} USD`} */}
            <USDPrice>${dollarPriceValue && parseFloat(dollarPriceValue).toFixed(2)}</USDPrice>
            <SockCount>{reserveToken && `${amountFormatter(reserveToken, 18, 0)}/${totalSupply} available`}</SockCount>
          </CurrentPrice>
          {/* <IncrementToken /> */}
        </InfoFrame>}
      </TopFrame>
      {pending && currentTransactionHash ? (
        <CheckoutControls buying={buying}>
          <CheckoutPrompt>
            <i>{shouldRenderUnlock ? "Approving token." : unwrappingAll ? "Your WETH is being unwrapped." : "Your transaction is pending."}</i>
          </CheckoutPrompt>
          <CheckoutPrompt>
            <EtherscanLink href={link(currentTransactionHash)} target="_blank" rel="noopener noreferrer">
              View on Etherscan.
            </EtherscanLink>
          </CheckoutPrompt>
        </CheckoutControls>
      ) : (
        <CheckoutControls buying={buying}>
          <CheckoutPrompt>
            <i>{
              buying
              ? `How much ${state.selectedTicker && state.selectedTicker.toUpperCase()} do you want to buy?`
              : shouldRenderUnlock
              ?  `Allow CombatCurve to use your ${state.selectedTicker && state.selectedTicker.toUpperCase()}. You only have to do this once per token.`
              :  `How much ${state.selectedTicker && state.selectedTicker.toUpperCase()} do you want to sell?`
            }&nbsp;&nbsp;
              <Tooltip title="Ether values are estimate. 15% slippage applies, unused ether will be refunded." color="#fe6dde">
                <ExclamationCircleOutlined />
              </Tooltip>
            </i>
          </CheckoutPrompt>
          {/* <SelectToken
            selectedTokenSymbol={selectedTokenSymbol}
            setSelectedTokenSymbol={setSelectedTokenSymbol}
            prefix={TokenVal()}
          /> */}
          {!shouldRenderUnlock && <div className="fixedInputAddon">
            <Input
                onChange={e => onInputChange(e.target.value, "token")}
                onBlur={e => onInputBlur(e.target.value, "token", 6)}
                value={tokenInputValue}
                className={fieldStyles.amountInput}
                addonBefore={<b>{`${type && type.toUpperCase()}`}</b>}
                // addonAfter={selling &&
                //   <MaxButton>
                //     <MaxButtonFrame
                //       text={`Max (${amountFormatter(balance, 18, 4)})`}
                //       onClick={() => onInputBlur(amountFormatter(balance, 18, 18), "token", 6)}
                //     />
                //   </MaxButton>
                // }
              />
              
            <Input
              onChange={e => onInputChange(e.target.value, "eth")}
              onBlur={e => onInputBlur(e.target.value, "eth", 6)}
              value={ethInputValue}
              className={fieldStyles.amountInput}
              addonBefore={<Icon src={ether} />}
              disabled
            />

            <Input
              onChange={e => onInputChange(e.target.value, "usd")}
              onBlur={e => onInputBlur(e.target.value, "usd", 2)}
              value={usdInputValue}
              className={fieldStyles.amountInput}
              addonBefore={<b>{`USD`}</b>}
              disabled
            />
          </div>}
        </CheckoutControls>
      )}
      {shouldRenderUnlock ? pending ? <SpinnerContainer><UnlockLoader /></SpinnerContainer> : (
        <ButtonFrame
          text={state.isLoadingWallet ? <Spinner /> : `Approve ${buying ? selectedTokenSymbol : type.toUpperCase()}`}
          type={'cta'}
          pending={pending}
          disabled={state.isLoadingWallet}
          onClick={() => {
            setState({ ...state, isLoadingWallet: true })
            unlock(buying, type).then(({ hash }) => {
              setState({ ...state, transactionTicker: type })
              setCurrentTransaction(hash, TRADE_TYPES.UNLOCK, undefined)
            }).finally(() => {
              setState({ ...state, isLoadingWallet: false })
            })
          }}
        />
      ) : unwrappingAll ? <SpinnerContainer><UnwrapLoader /></SpinnerContainer>
      : (
        pending
        ? <SpinnerContainer><PaperplaneLoader /></SpinnerContainer>
        : isComputingValues
        ? <SpinnerContainer><Spinner /></SpinnerContainer>
        : <ButtonFrame
          className="button"
          pending={pending}
          disabled={(validationError !== null || (pending && currentTransactionHash)) || isButtonDisabled || state.isLoadingWallet}
          text={getText(account, buying, errorMessage, ready, pending, currentTransactionHash)}
          type={'cta'}
          onClick={() => {
            setState({ ...state, isLoadingWallet: true })
            if (account === null) {
              setConnector('Injected', { suppressAndThrowErrors: true }).catch(error => {
                setShowConnect(true)
              })
            } else {
              ;(buying
                ? buy(buyValidationState.maximumInputValue, buyValidationState.outputValue, state.selectedTicker)
                : sell(sellValidationState.inputValue, sellValidationState.minimumOutputValue, state.selectedTicker)
              ).then(response => {
                setState({ ...state, transactionTicker: type, transactionEthAmount: selling ? sellValidationState.minimumOutputValue : buyValidationState.maximumInputValue })
                setCurrentTransaction(
                  response.hash,
                  buying ? TRADE_TYPES.BUY : TRADE_TYPES.SELL,
                  buying ? buyValidationState.outputValue : sellValidationState.inputValue
                )
              }).finally(() => {
                setState({ ...state, isLoadingWallet: false })
              })
            }
          }}
        />
      )}
    </>
  )
}

// const Wrapper = styled.div`
//   position: fixed;
//   background: #ffffff;
//   width: 100%;
//   max-width: 375px;
//   border-radius: 8px;
// `

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

const MaxButton = styled.div`
  height: 28px;
  width: 100%;
`

const MaxButtonFrame = styled(Button)`
  padding: 10px;
  margin: 0;
  height: 28px;
`

const TopFrame = styled.div`
  width: 100%;
  max-width: 375px;
  background: #000000;
  background: linear-gradient(162.92deg, #2b2b2b 12.36%, #000000 94.75%);
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  color: white;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
  padding: 16px;
  box-sizing: border-box;


  @media only screen and (max-width: 480px) {
    height: 50vh;
  }
`

const Unicorn = styled.p`
  width: 100%;
  color: #fff;
  font-weight: 600;
  margin: 0px;
  font-size: 16px;
`

const InfoFrame = styled.div`
  opacity: ${props => (props.pending ? 0.6 : 1)};
  width: 100%;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-items: center;
`

const ImgStyle = styled.img`
  width: 225px;
  padding: .25rem 0 .25rem 0;
  box-sizing: border-box;


  @media only screen and (max-width: 480px) {
    width: auto;
    height: 65%;
  }
`

const ImgStyleEth = styled.img`
  width: 300px;
  height: 350px;
  padding: .25rem 0 .25rem 0;
  box-sizing: border-box;


  @media only screen and (max-width: 480px) {
    width: auto;
    height: 65%;
  }
`

const SockCount = styled.span`
  color: #aeaeae;
  font-weight: 400;
  margin: 0px;
  margin-top: 8px;
  font-size: 12px;
  font-feature-settings: 'tnum' on, 'onum' on;
`

const Close = styled.img`
  position: absolute;
  width: 16px;
  color: #fff;
  font-weight: 600;
  margin: 0px;
  top: 15px;
  right: 15px;
  height: 16px;
  font-size: 16px;
  padding: 4px;
  cursor: pointer;
`

const USDPrice = styled.div``

const CurrentPrice = styled.div`
  font-weight: 600;
  font-size: 18px;
  margin: 0px;
  font-feature-settings: 'tnum' on, 'onum' on;
`

const CheckoutControls = styled.span`
  width: 100%;
  margin: 16px 16px 0 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
`

const CheckoutPrompt = styled.p`
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 0;
  margin-left: 8px;
  text-align: left;
  width: 100%;
`

const ButtonFrame = styled(Button)`
  margin: 16px;
  height: 48px;
  padding: 16px;
`

const EtherscanLink = styled.a`
  text-decoration: none;
  color: ${props => props.theme.uniswapPink};
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  margin-top: 8px;
`

const Icon = styled.img`
  width: 14px;
  box-sizing: border-box;
`

const SpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
`
