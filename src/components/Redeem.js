import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { useWeb3Context } from 'web3-react'
import { Link } from 'react-router-dom'

import { useAppContext } from '../context'
import Button from './Button'
import RedeemForm from './RedeemForm'
import { amountFormatter, TRADE_TYPES } from '../utils'
import { FailedTransaction } from './Animations'
import { pushToRedeemed, updateBurnedByHash } from '../backend/api'

import IncrementToken from './IncrementToken'
import test from './Gallery/test.png'
import nfc from './Gallery/nfc.png'
import sent from './Gallery/sent.png'
import nftMike from './Gallery/nftMike.png'
import nftTuba from './Gallery/nftTuba.png'
import tshirtMike from './Gallery/tshirtMike.png'
import tshirtTuba from './Gallery/tshirtTuba.png'

import close from './Gallery/close.svg'
import closeDark from './Gallery/close_dark.svg'

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

export function Controls({ closeCheckout, theme, type }) {
  return (
    <FrameControls>
      <Unicorn theme={theme}>
        <span role="img" aria-label="unicorn">
        ⚔️
        </span>{' '}
        Pay{' '}
        <span style={{ color: '#737373' }}>
          {' '}
          {type === 'confirm' ? ' / Order Details' : type === 'shipping' ? ' / Shipping Details' : ''}
        </span>
      </Unicorn>

      <Close src={theme === 'dark' ? closeDark : close} onClick={() => closeCheckout()} alt="close" />
    </FrameControls>
  )
}

export default function Redeem({
  burn,
  mintNft,
  mintingNft,
  balance,
  ready,
  unlock,
  setCurrentTransaction,
  setShowConnect,
  closeCheckout
}) {
  const { library, account, setConnector } = useWeb3Context()
  const [state, setState] = useAppContext()

  const [numberBurned, setNumberBurned] = useState()
  const [hasPickedAmount, setHasPickedAmount] = useState(false)
  const [hasConfirmedAddress, setHasConfirmedAddress] = useState(false)
  const [transactionHash, setTransactionHash] = useState('')
  const [lastTransactionHash, setLastTransactionHash] = useState('')
  const [finishedMintingNftFromSidebar, setFinishedMintingNftFromSidebar] = useState(false)
  
  const [hasBurnt, setHasBurnt] = useState(false)
  const [hasMintedNft, setHasMintedNft] = useState(false)
  const [userAddress, setUserAddress] = useState('')
  
  const pending = !!transactionHash
  const burning = state.tradeType === TRADE_TYPES.REDEEM
  const { mintingNftFromSidebar, lastTransactionStatus } = state

  const sizeList = ['S', 'M', 'L']

  useEffect(() => {
    if (lastTransactionStatus === 0) {
      setState({ ...state, mintingNftFromSidebar: false })
    }
  }, [lastTransactionStatus])

  const prevTickerRef = useRef();
  useEffect(() => {
    if (transactionHash) {
      library.waitForTransaction(transactionHash).then((response) => {
        if (burning && !mintingNftFromSidebar && !mintingNft && response.status) {
          updateBurnedByHash(transactionHash)
        }

        if (mintingNft && response.status) {
          // setState({ ...state, tradeType: null })
          setHasMintedNft(true)
        }

        if (mintingNftFromSidebar && response.status) {
          setState({ ...state, mintingNftFromSidebar: false })
          setFinishedMintingNftFromSidebar(true)
          setHasMintedNft(true)
        }

        setState({ ...state, lastTransactionStatus: response.status, isTransactionPending: false, isUnwrapping: false })
        setLastTransactionHash(transactionHash)
        setTransactionHash('')
        setHasBurnt(true)
      })
    }
  })

  useEffect(() => {
    if (state.selectedTicker !== prevTickerRef.current) {
      prevTickerRef.current = state.selectedTicker
      setNumberBurned()
      setHasPickedAmount(false)
    }
  }, [state.selectedTicker])

  function link(hash) {
    return `https://etherscan.io/tx/${hash}`
  }

  function renderContent() {
    if (account === null) {
      return (
        <ButtonFrame
          className="button"
          disabled={process.env.REACT_APP_ENABLED !== "true"}
          text={account === null ? 'Connect Wallet' : 'Redeem Shirt'}
          type={'cta'}
          onClick={process.env.REACT_APP_ENABLED === "true" ? () => {
            setConnector('Injected', { suppressAndThrowErrors: true }).catch(() => {
              setShowConnect(true)
            })
          } : () => {}}
        />
      )
    } else if (lastTransactionStatus === 0) {
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
            <EtherscanLink href={link(lastTransactionHash)} target="_blank" rel="noopener noreferrer">
              Transaction Details ↗
            </EtherscanLink>
          </CheckoutPrompt>
          {/* <UnwrapPrompt>Try again or join our discord and ask a question.</UnwrapPrompt> */}
          <Shim />
        </ConfirmedFrame>    
      )
    } else if (!hasPickedAmount && !mintingNftFromSidebar && !finishedMintingNftFromSidebar) {
      return (
        <>
          <TopFrame hasPickedAmount={hasPickedAmount}>
            <NftWrapper>
              <NftImg src={state.selectedTicker === 'mike' ? nftMike : nftTuba} />
              <NftText>Bonus NFT</NftText>
            </NftWrapper>
            <Controls closeCheckout={closeCheckout} />
            <ImgStyle src={state.selectedTicker === 'mike' ? tshirtMike : tshirtTuba} alt="Logo" hasPickedAmount={hasPickedAmount} />
            <InfoFrame pending={pending}>
              <Owned>
                <SockCount>You own {balance && `${amountFormatter(balance, 18, 0)}`}</SockCount>
                <div>Redeem T-SHIRT</div>
              </Owned>
            </InfoFrame>
          </TopFrame>
          <ButtonFrame
            className="button"
            disabled={false}
            text={'Next'}
            type={'cta'}
            onClick={() => {
              setNumberBurned(1)
              setHasPickedAmount(true)
            }}
          />
        </>
      )
    } else if (!hasConfirmedAddress && !mintingNftFromSidebar) {
      return (
        <>
          <TopFrame hasPickedAmount={hasPickedAmount}>
            <Controls closeCheckout={closeCheckout} type="shipping" />

            <InfoFrame hasPickedAmount={hasPickedAmount}>
              <ImgStyle src={state.selectedTicker === 'mike' ? tshirtMike : tshirtTuba} alt="Logo" hasPickedAmount={hasPickedAmount} />
              <Owned>
                <div>{state.count} T-Shirt{state.count > 1 && "s"}</div>
                <Sizes>
                  {sizeList.map(size => (
                    <SizeCheckbox
                      className={state.selectedTshirtSize === size && "active"}
                      onClick={() => {setState({ ...state, selectedTshirtSize: size })}}
                    >
                      <p style={{ fontSize: '16px', fontWeight: '400', color: '#AEAEAE' }}>{size}</p>
                    </SizeCheckbox>
                  ))}
                </Sizes>
                <p style={{ fontSize: '14px', fontWeight: '500', marginTop: '16px', color: '#AEAEAE' }}>
                  {state.selectedTicker.toUpperCase()} Edition 0
                </p>
              </Owned>
            </InfoFrame>
          </TopFrame>

          {/* <Count>2/3</Count> */}
          <CheckoutPrompt>Where should we send {state.count > 1 ? "them" : "it"}?</CheckoutPrompt>
          <RedeemFrame
            burn={burn}
            setHasConfirmedAddress={setHasConfirmedAddress}
            setUserAddress={setUserAddress}
            numberBurned={numberBurned}
          />
          <Back>
            <span
              onClick={() => {
                setNumberBurned()
                setHasPickedAmount(false)
                setState({ ...state, selectedTshirtSize: null })
              }}
            >
              back
            </span>
          </Back>
        </>
      )
    } else if (!hasBurnt && !mintingNftFromSidebar && !finishedMintingNftFromSidebar) {
      return (
        <>
          <TopFrame hasPickedAmount={hasPickedAmount}>
            <Controls closeCheckout={closeCheckout} type="confirm" />
            <InfoFrame hasPickedAmount={hasPickedAmount}>
              <ImgStyle src={state.selectedTicker === 'mike' ? tshirtMike : tshirtTuba} alt="Logo" hasPickedAmount={hasPickedAmount} />
              <Owned>
                <p style={{ fontSize: '18px' }}>{state.count} T-Shirt{state.count > 1 && "s"}</p>
                <p style={{ fontSize: '14px', fontWeight: '500' }}>Size {state.selectedTshirtSize}</p>
                <p
                  style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#AEAEAE',
                    marginTop: '16px',
                    marginRight: '16px'
                  }}
                >
                  {userAddress}
                </p>
              </Owned>
            </InfoFrame>
            <InfoFrame hasPickedAmount={hasPickedAmount}>
              <NftImgStyle src={state.selectedTicker === 'mike' ? nftMike : nftTuba} alt="Logo" hasPickedAmount={hasPickedAmount} />
              <Bonus>Bonus</Bonus>
              <Owned>
                <p style={{ fontSize: '18px' }}>{state.count} {state.selectedTicker.toUpperCase()} NFT</p>
                <p style={{ fontSize: '14px', fontWeight: '500' }}>Digital Collectible</p>
                <p
                  style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#AEAEAE',
                    marginTop: '16px',
                    marginRight: '16px',
                    wordBreak: 'break-all'
                  }}
                >
                  {account}
                </p>
              </Owned>
            </InfoFrame>
          </TopFrame>
          {/* <Back
            onClick={() => {
              setHasConfirmedAddress(false)
            }}
          >
            back
          </Back>
          <Count>2/3</Count>
          <CheckoutPrompt>BURN THE SOCKS?</CheckoutPrompt> */}
          <ButtonFrame
            className="button"
            disabled={pending || state.isLoadingWallet}
            pending={pending}
            burning={burning}
            // // pending={pending }
            // text={pending ? `Waiting for confirmation...` : `Redeem ${numberBurned} SOCKS`}
            text={(pending) ? `Burning...` : `Place order (Redeem ${numberBurned} ${state.selectedTicker.toUpperCase()}) `}
            type={'cta'}
            onClick={() => {
              setState({ ...state, isLoadingWallet: true })
              burn(numberBurned.toString())
                .then(response => {
                  setState({ ...state, isTransactionPending: true })
                  setTransactionHash(response.hash)
                  const { finalFormData } = state
                  finalFormData.txHash = response.hash
                  pushToRedeemed(finalFormData)
                })
                .catch(error => {
                  console.error(error)
                  // setTransactionHash(
                  //   true
                  //     ? '0x888503cb966a67192afb74c740abaec0b7e8bda370bc8f853fb040eab247c63f'
                  //     : '0x66dac079f7ee27ba7b2cae27eaabf64574c2011aacd007968be6d282b3c2065b'
                  // )
                }).finally(() => {
                  setState({ ...state, isLoadingWallet: false })
                })
            }}
          />
          <Back disabled={!!pending}>
            {pending ? (
              <EtherscanLink href={link(transactionHash)} target="_blank" rel="noopener noreferrer">
                View on Etherscan.
              </EtherscanLink>
            ) : (
              <span
                onClick={() => {
                  setState({ ...state, selectedTshirtSize: null })
                  setHasConfirmedAddress(false)
                }}
              >
                back
              </span>
            )}
          </Back>
        </>
      )
    }
  }

  return (
    <>
      {renderContent()}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <Confetti active={(hasBurnt || hasMintedNft) && state.lastTransactionStatus} config={config} />
      </div>
    </>
  )
}

const TopFrame = styled.div`
  position: relative;
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

const NftWrapper = styled.div`
  position: absolute;
  height: 80px;
  width: 80px;
  bottom: 30px;
  right: 25px;
  text-align: center;
`

const Sizes = styled.div`
  display: flex;
`

const SizeCheckbox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 30px;
  width: 30px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  margin: 0 5px;

  &:first-child {
    margin-left: 0;
  }

  &.active {
    background: ${props => props.theme.uniswapPink};
    border: 1px solid #ffffff !important;
    
    p {
      color: #ffffff !important;
    }
  }
`
  
const NftImg = styled.img`
  height: 100%;
  width: 100%;
  border-radius: 4px;
`

const NftText = styled.div`
  position: absolute;
  width: 88px;
  bottom: -14px;
  right: -4px;
  font-weight: bold;
  font-size: 11px;
  opacity: 0.95;
  border-radius: 4px;
  background: ${props => props.theme.uniswapPink};
`

const FrameControls = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  width: 100%;
  align-items: center;
`

const Unicorn = styled.p`
  color: ${props => (props.theme === 'dark' ? '#000' : '#fff')};
  font-weight: 600;
  margin: 0px;
  font-size: 16px;
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

const InfoFrame = styled.div`
  opacity: ${props => (props.pending ? 0.6 : 1)};
  width: 100%;
  font-size: 20px;
  font-weight: 500;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  margin-top: ${props => (props.hasPickedAmount ? '8px' : '0')};
  justify-content: ${props => (props.hasPickedAmount ? 'flex-start' : 'space-between')};
  align-items: flex-end;
  padding: ${props => (props.hasPickedAmount ? '1rem 0 1rem 0' : ' 0')};
  /* padding: 1rem 0 1rem 0; */
  margin-top: 12px;
  /* margin-bottom: 8px; */
  /* margin-right: ${props => (props.hasPickedAmount ? '8px' : '0px')}; */

  border-radius: 6px;

  /* background-color: ${props => (props.hasPickedAmount ? '#000' : 'none')}; */
  border: ${props => (props.hasPickedAmount ? '1px solid #3d3d3d' : 'none')};
`

const Owned = styled.div`
  font-weight: 700;
  color: #efe7e4;
  font-size: 24px;
  margin-bottom: 12px;
  margin: 0px;
  white-space: pre-wrap;
`

const Bonus = styled.div`
  font-weight: 500;
  font-size: 12px;
  padding: 4px;
  background-color: ${props => props.theme.uniswapPink};
  border-radius: 4px;
  position: absolute;
  top: 200px;
  left: 32px;
`

const ImgStyle = styled.img`
  width: ${props => (props.hasPickedAmount ? (props.hasBurnt ? '300px' : '120px') : '300px')};
  padding: ${props => (props.hasPickedAmount ? (props.hasBurnt ? '0px' : '0 1rem 0 0') : '2rem 0 2rem 0')};
  box-sizing: border-box;
`
const NftImgStyle = styled.img`
  width: ${props => (props.hasPickedAmount ? (props.hasBurnt ? '300px' : '120px') : '300px')};
  padding: ${props => (props.hasPickedAmount ? (props.hasBurnt ? '0px' : '0 1rem 0 0') : '2rem 0 2rem 0')};
  box-sizing: border-box;
  padding: 10px;
  border-radius: 15px;
`

const SockCount = styled.span`
  color: #aeaeae;
  font-weight: 400;
  font-size: 14px;
  width: 100%;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.uniswapPink};
  cursor: pointer;

  :hover {
    text-decoration: underline;
  }
`

const Back = styled.div`
  color: #aeaeae;
  font-weight: 400;
  margin: 0px;
  margin: -4px 0 16px 0px !important;
  font-size: 14px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  /* color: ${props => props.theme.uniswapPink}; */
  text-align: center;
  span {
    cursor: pointer;
  }
  span:hover {
    text-decoration: underline;
  }
`

const CheckoutPrompt = styled.p`
  font-weight: 500;
  font-size: 14px;
  margin: 24px 16px 0 16px !important;
  text-align: left;
  color: '#000';
  font-style: italic;
  width: 100%;
`

const ButtonFrame = styled(Button)`
  margin: 16px;
  height: 48px;
  padding: 16px;
`

const RedeemFrame = styled(RedeemForm)`
  width: 100%;
`

const EtherscanLink = styled.a`
  text-decoration: none;
  color: ${props => props.theme.uniswapPink};
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
`

const ConfirmedFrame = styled.div`
  width: 100%;
  /* padding: 2rem; */
  box-sizing: border-box;
  font-size: 36px;
  font-weight: 500;
  /* line-height: 170%; */
  text-align: center;
`

const UnwrapPrompt = styled.p`
  text-decoration: none;
  font-style: normal;
  font-weight: 400;
  text-align: left;
  font-size: 14px;
  padding: 2px 16px;
`

const Shim = styled.div`
  height: 20px;
`

