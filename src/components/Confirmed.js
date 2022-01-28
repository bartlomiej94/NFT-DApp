import React, { useEffect } from 'react'
import styled from 'styled-components'
import { useWeb3Context } from 'web3-react'

import { amountFormatter, TRADE_TYPES, getContract, TOKEN_ADDRESSES } from '../utils'
import CCROUTER_ABI from '../utils/ccRouter.json'
import Button from './Button'

import close from './Gallery/close.svg'
import sent from './Gallery/sent.png'
import email from './Gallery/email.png'
import discord from './Gallery/discord.png'
import tshirtMike from './Gallery/tshirtMike.png'
import tshirtTuba from './Gallery/tshirtTuba.png'
import nftMike from './Gallery/nftMike.png'
import nftTuba from './Gallery/nftTuba.png'
import etherSvg from './Gallery/ether.svg'

import { useAppContext } from '../context'
import { UnwrapLoader } from './Loaders'
import { FailedTransaction } from './Animations'

const ConfirmedFrame = styled.div`
  width: 100%;
  /* padding: 2rem; */
  box-sizing: border-box;
  font-size: 36px;
  font-weight: 500;
  /* line-height: 170%; */
  text-align: center;
`

function Controls({ closeCheckout }) {
  return (
    <FrameControls>
      <Unicorn>
        <span role="img" aria-label="unicorn">
          ⚔️
        </span>{' '}
        Pay
      </Unicorn>
      <Close src={close} onClick={() => closeCheckout()} alt="close" />
    </FrameControls>
  )
}

const FrameControls = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  width: 100%;
  align-items: center;
`

const Unicorn = styled.p`
  color: #fff;
  font-weight: 600;
  margin: 0px;
  font-size: 16px;
`

export default function Confirmed({ hash, unwrapping, type, tokenType, amount, clearLastTransaction, closeCheckout, unwrap, setCurrentTransaction }) {
  const [state, setState] = useAppContext()
  const { account, library } = useWeb3Context()
  const [lastEthOutput, setLastEthOutput] = React.useState()
  const { lastTransactionStatus } = state

  function link(hash) {
    return `https://etherscan.io/tx/${hash}`
  }

  useEffect(() => {
    if (!state.visible) {
      clearLastTransaction()
    }
  }, [state.visible, clearLastTransaction])

  useEffect(() => {
    (async () => {
      if (state.tradeType === TRADE_TYPES.SELL && !lastEthOutput && !state.lastTransactionEthOutput) {
        const CCRouterContract = getContract(TOKEN_ADDRESSES.CC_ROUTER, CCROUTER_ABI, library, account)
        const ethOutput = await CCRouterContract.getEthOutputValue()

        setLastEthOutput(ethOutput)
      }
    })()
  }, [])

  if (lastTransactionStatus === 0) {
    return (
      <ConfirmedFrame>
        <TopFrame>
          <Controls closeCheckout={closeCheckout} />
          <FailedTransaction />
          <InfoFrame>
            <Owned>
              <div>Transaction failed!</div>
            </Owned>
          </InfoFrame>
        </TopFrame>
        <CheckoutPrompt>
          <EtherscanLink href={link(hash)} target="_blank" rel="noopener noreferrer">
            Transaction Details ↗
          </EtherscanLink>
        </CheckoutPrompt>
        {/* <UnwrapPrompt>Try again or join our discord and ask a question.</UnwrapPrompt> */}
        <Shim />
      </ConfirmedFrame>    
    )
  }

  if (type === TRADE_TYPES.UNLOCK) {
    return (
      <ConfirmedFrame>
        <TopFrame>
          <Controls closeCheckout={closeCheckout} />
          <ImgStyle src={state.transactionTicker === 'mike' ? tshirtMike : tshirtTuba} alt="Logo" />
          <InfoFrame>
            <Owned>
              <div>Approved {state.selectedTicker.toUpperCase()}!</div>
            </Owned>
          </InfoFrame>
        </TopFrame>
        <CheckoutPrompt>
          <EtherscanLink href={link(hash)} target="_blank" rel="noopener noreferrer">
            Transaction Details ↗
          </EtherscanLink>
        </CheckoutPrompt>
        <ButtonFrame
            text={`Proceed to Sell`}
            type={'cta'}
            onClick={() => {
              clearLastTransaction()
              setState(state => ({ ...state, tradeType: TRADE_TYPES.SELL }))
            }}
          />
        <Shim />
      </ConfirmedFrame>
    )
  } else if (type === TRADE_TYPES.BUY) {
    return (
      <ConfirmedFrame>
        <TopFrame>
          <Controls closeCheckout={closeCheckout} />
          <ImgStyle src={state.transactionTicker === 'mike' ? tshirtMike : tshirtTuba} alt="Logo" />
          <InfoFrame>
            <Owned>
              <div> {`You got ${amountFormatter(amount, 18, 6)} ${state.transactionTicker.toUpperCase()}`}</div>
            </Owned>
          </InfoFrame>
        </TopFrame>
        <CheckoutPrompt>
          <EtherscanLink href={link(hash)} target="_blank" rel="noopener noreferrer">
            Transaction Details ↗
          </EtherscanLink>
        </CheckoutPrompt>
        <ButtonFrame
            text={`Close`}
            type={'cta'}
            onClick={() => {
              setState(state => ({ ...state, tradeType: null }))
              closeCheckout()
              clearLastTransaction()
              // setState(state => ({ ...state, tradeType: TRADE_TYPES.REDEEM }))
            }}
          />
        {/* <Shim /> */}
      </ConfirmedFrame>
    )
  } else if (type === TRADE_TYPES.SELL) {
    return (
      <ConfirmedFrame>
        <TopFrame>
          <Controls closeCheckout={closeCheckout} />
          <ImgStyle src={state.transactionTicker === 'mike' ? tshirtMike : tshirtTuba} alt="Logo" />
          <InfoFrame>
            <Owned>
              <div>You sold {state.transactionTicker.toUpperCase()}</div>
            </Owned>
          </InfoFrame>
        </TopFrame>
        {(unwrapping || type === TRADE_TYPES.UNWRAP_ALL) && <CheckoutPrompt style={{paddingTop: "8px"}}>
            <i>Your WETH is being unwrapped.</i>
          </CheckoutPrompt>}
        <CheckoutPrompt>
          <EtherscanLink href={link(hash)} target="_blank" rel="noopener noreferrer">
            Transaction Details ↗
          </EtherscanLink>
        </CheckoutPrompt>
        {(!unwrapping && type !== TRADE_TYPES.UNWRAP_ALL) &&
          <>
            <UnwrapPrompt>You sold your token for {lastEthOutput && parseFloat(amountFormatter(lastEthOutput,18,8))} WETH. You can get ETH by unwrapping it.</UnwrapPrompt>
            <ButtonFrame
                text={`Unwrap WETH`}
                type={'cta'}
                disabled={state.isLoadingWallet}
                onClick={() => {
                  setState({ ...state, isLoadingWallet: true })
                  unwrap(lastEthOutput).then(response => {
                    setState({ ...state, tradeType: TRADE_TYPES.UNWRAP })
                    closeCheckout()
                    setCurrentTransaction(
                      response.hash,
                      TRADE_TYPES.UNWRAP,
                      state.transactionEthAmount
                    )
                  }).finally(() => {
                    setState({ ...state, isLoadingWallet: false })
                  })
                }}
              />
            </>
          }
          {
            unwrapping && <UnwrapLoader />
          }
        {/* <Shim /> */}
      </ConfirmedFrame>
    )
  } else if (type === TRADE_TYPES.UNWRAP || type === TRADE_TYPES.UNWRAP_ALL) {
    return (
      <ConfirmedFrame>
        <TopFrame>
          <Controls closeCheckout={closeCheckout} />
          {type === TRADE_TYPES.UNWRAP && <ImgStyle src={state.transactionTicker === 'mike' ? tshirtMike : tshirtTuba} alt="Logo" />}
          {type === TRADE_TYPES.UNWRAP_ALL && <ImgStyleEth src={etherSvg} alt="Ether" />}
          <InfoFrame>
            <Owned>
              <div>WETH unwrapped!</div>
            </Owned>
          </InfoFrame>
        </TopFrame>
        <CheckoutPrompt>
          <EtherscanLink href={link(hash)} target="_blank" rel="noopener noreferrer">
            Transaction Details ↗
          </EtherscanLink>
        </CheckoutPrompt>
        <ButtonFrame
          text={`Close`}
          type={'cta'}
          onClick={() => {
            setState({ ...state, tradeType: null, selectedTicker: null })
            setCurrentTransaction()
          }}
        />
        {/* <Shim /> */}
      </ConfirmedFrame>
    )    
  } else if (type === TRADE_TYPES.MINT_NFT) {
    return (
      <>
      <TopFrame>
        <Controls closeCheckout={closeCheckout} />
        <NftImgStyle src={state.selectedTicker === 'mike' ? nftMike : nftTuba} alt="Logo" />
        <InfoFrame>
          <Owned>
            <div>You got an NFT!</div>
          </Owned>
        </InfoFrame>
      </TopFrame>
      <div style={{ margin: '16px 0 16px 16px' }}>
        <EtherscanLink href={link(hash)} target="_blank" rel="noopener noreferrer">
          View on Etherscan.
        </EtherscanLink>
          <br />Please allow up to 20 minutes for your NFT to appear in the wallet and OpenSea.
      </div>
    </>        
    ) 
  } else return null;
}

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
`
const Shim = styled.div`
  height: 20px;
`

const NftImgStyle = styled.img`
  width: ${props => (props.hasPickedAmount ? (props.hasBurnt ? '300px' : '120px') : '300px')};
  padding: ${props => (props.hasPickedAmount ? (props.hasBurnt ? '0px' : '0 1rem 0 0') : '2rem 0 2rem 0')};
  box-sizing: border-box;
  padding: 10px;
  border-radius: 15px;
`

const Close = styled.img`
  width: 16px;
  color: #fff;
  font-weight: 600;
  margin: 0px;
  /* margin-right: 2px;
  margin-top: -7px; */
  height: 16px;
  font-size: 16px;
  padding: 4px;
  cursor: pointer;
`
const ButtonFrame = styled(Button)`
  width: calc(100% - 2rem);
  margin: 16px;
  height: 48px;
  padding: 16px;
`

const ButtonFrameDisabled = styled(ButtonFrame)`
  background: #ccc;
  box-shadow: 0px 4px 20px #ccc;
  cursor: initial;
`

const InfoFrame = styled.div`
  width: 100%;
  font-size: 20px;
  font-weight: 500;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  margin-top: 0;
  justify-content: 'center';
  align-items: flex-end;
  padding: 0;
  /* padding: 1rem 0 1rem 0; */
  margin-top: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  /* background-color: ${props => (props.hasPickedAmount ? '#000' : 'none')}; */
  /* border: ${props => (props.hasPickedAmount ? '1px solid #3d3d3d' : 'none')}; */
`

const Owned = styled.div`
  font-weight: 700;
  color: #efe7e4;
  font-size: 24px;
  margin-bottom: 12px;
  margin: 0px;
  white-space: pre-wrap;
`

const ImgStyle = styled.img`
  width: 300px;
  padding: 0px;
  box-sizing: border-box;
`

const ImgStyleEth = styled.img`
  width: 300px;
  height: 320px;
  padding: 0px;
  box-sizing: border-box;
`

const CheckoutPrompt = styled.p`
  font-weight: 500;
  font-size: 14px;
  margin: 8px 16px 0 16px !important;
  text-align: left;
  color: '#000';
  font-style: italic;
  width: 100%;
`
const EtherscanLink = styled.a`
  text-decoration: none;
  color: ${props => props.theme.uniswapPink};
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
`

const UnwrapPrompt = styled.p`
  text-decoration: none;
  font-style: normal;
  font-weight: 400;
  text-align: left;
  font-size: 14px;
  padding: 2px 16px;
`
