import { RainbowButton } from '@rainbow-me/rainbow-button';
import { Avatar, Divider, List, Table } from 'antd'
import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import { useWeb3Context } from 'web3-react'
import { Link, useHistory  } from 'react-router-dom'
import { slide as Menu } from 'react-burger-menu'
import { useAppContext } from '../../context'
import { ToastContainer, toast } from 'react-toastify';
import { TRADE_TYPES } from '../../utils';

import {amountFormatter} from '../../utils'
import Card from '../../components/Card1';
import BuyButtons from '../../components/Buttons'
import ConnectWallet from '../../components/ConnectWalletButton'
import RedeemButton from '../../components/RedeemButton'
import Button from '../../components/Button';
import Checkout from '../../components/Checkout';
import myMike2 from './mikeNew.png';
import myTuba3 from './tuba3.png';
import tshirtMike from '../../components/Gallery/tshirtMike.png'
import tshirtTuba from '../../components/Gallery/tshirtTuba.png'
import nftMike from '../../components/Gallery/nftMike.png'
import nftTuba from '../../components/Gallery/nftTuba.png'
import ether from '../../components/Gallery/ether.svg'
// import Swords from './swords.png';
import Swords2 from './images.jpeg';
import SwordsPNG from './pngSwords.png';
import Trophy from './trophy.png';
import Handshake from './handshake.png';
import Books from './books.png';
import Footer from '../../components/footer';
import Countdown from '../../components/countdown';
import Modal from '../../components/NavModal'
import './countdown.css';
import 'react-toastify/dist/ReactToastify.css';

import './styles.scss'

export function showToast(text, type) {
  switch(type) {
    case "warn":
      toast.warn(text)
      break
    case "error":
      toast.error(text)
      break
    default:
      toast(text)
      break
  }
}

export function Header({ totalSupply, ready, balanceMIKE, balanceWETH, unwrap, mintNft, setCurrentTransaction, setShowConnect }) {
  const { account, setConnector  } = useWeb3Context()
  const [state, setState] = useAppContext()
  const [isModalOpen, toggleModal] = useState(false);

  const hasTokensInWallet = state.tokenBalances.some(tb => tb.balance && parseFloat(amountFormatter(tb.balance, 18, 8)) > 0)
  const hasUnclaimedNft = state.unclaimedNfts.some(uNft => uNft.count && uNft.count.gt(0))

  const wrappedEthName = "Wrapped ETH";

  const walletBalancesData = [
    {
      name: wrappedEthName,
      balance: balanceWETH,
    },
    ...state.tokenBalances
  ]

  function handleAccount() {
    setConnector('Injected', { suppressAndThrowErrors: true }).catch(error => {
      setShowConnect(true)
    })
  }

  // let historyTeam = useHistory();
  // function handleTeam() {
  //   historyTeam.push('/team')
  // }

  let historyLeaderboard = useHistory();
  function handleLB() {
    historyLeaderboard.push('/leaderboard')
  }

  let historyHome = useHistory();
  function handleHome() {
    historyHome.push('/')
  }
    
  return (
    <MenuWrapper>
    <HomePay>
    <HomeMenu src={Swords2} onClick={() => handleHome()}/>
    <ButtonMarginLeft>
      <RainbowWalletCover />
      <RainbowButton
        chainId={1}
        connectorOptions={{ bridge: 'https://bridge.walletconnect.org' }}
        onConnectorInitialized={(connector) => {}}
      />
      <RainbowComingSoon>Coming Soon</RainbowComingSoon>
    </ButtonMarginLeft>
    </HomePay>
    <Menu right styles={ styles } >
      <TextLinks>
        <NavBarSubSection>
        <img src={SwordsPNG} style={logoStyle} alt="swordLogo" onClick={() => handleHome()}></img>
        <Link id="title" to="/"  style={TextStylingTitle}>CombatCurve</Link>
        </NavBarSubSection>
        <NavBarSubSection>
        <img src={Trophy} style={logoStyle} alt="trophyeLogo" onClick={() => handleLB()}></img>
        <Link id="leaderboard" to="/leaderboard" style={TextStyling}>Leaderboard</Link>
        </NavBarSubSection>
        {/* <NavBarSubSection>
        <img src={Handshake} style={logoStyle} alt="handshakeLogo" onClick={() => handleTeam()}></img>
        <Link id="team"  to="/team"  style={TextStyling}>Team</Link>
        </NavBarSubSection> */}
        <NavBarSubSection>
        <img src={Books} style={logoStyle} alt="booksLogo" onClick={() => toggleModal(!isModalOpen)}></img>
        <p target="_blank" style={TextStyling} onClick={() => toggleModal(!isModalOpen)}>Learn More</p>
        </NavBarSubSection>
      </TextLinks>
      <Modal isOpen={isModalOpen} toggle={toggleModal}><button onClick={() => toggleModal(false)}>toggle</button></Modal>

      {process.env.REACT_APP_ENABLED === "true" && (!account ? (
        <Account onClick={() => handleAccount()} balanceMIKE={balanceMIKE}>
          <SockCount>Connect Wallet</SockCount>
        </Account>
        ) : walletBalancesData && (hasTokensInWallet || (balanceWETH && balanceWETH.gt(0))) && (
          <div className="cc-wallet">
            <Divider orientation="middle">Your wallet</Divider>
            <List
              itemLayout="horizontal"
              dataSource={walletBalancesData}
              renderItem={item => parseFloat(amountFormatter(item.balance, 18, 8)) > 0 && (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar src={item.name === 'mike' ? tshirtMike : item.name === 'tuba' ? tshirtTuba : ether} />}
                    title={item.name.toUpperCase()}
                    description={
                      <React.Fragment>
                        {amountFormatter(item.balance, 18, 8)}
                        {item.name === wrappedEthName && !state.isTransactionPending && (
                          <UnwrapAllButtonWrapper>
                            <Button
                              type="cta"
                              height={28}
                              text="Unwrap"
                              onClick={() => {
                                setState({ ...state, isLoadingWallet: true })
                                unwrap(item.balance).then(response => {
                                  setState({ ...state, isTransactionPending: true, visible: true, tradeType: TRADE_TYPES.UNWRAP_ALL, selectedTicker: 'weth' })
                                  setCurrentTransaction(
                                    response.hash,
                                    TRADE_TYPES.UNWRAP_ALL,
                                    item.balance
                                  )
                                }).finally(() => {
                                  setState({ ...state, isLoadingWallet: false })
                                })
                              }}
                            />
                          </UnwrapAllButtonWrapper>
                        )}
                      </React.Fragment>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )
      )}
    </Menu>
    </MenuWrapper>
  )

}
const styles = {
  bmBurgerButton: {
    position: 'fixed',
    width: '36px',
    height: '30px',
    right: '36px',
    top: '36px',
  },
  bmBurgerBars: {
    background: '#373a47'
  },
  bmBurgerBarsHover: {
    background: '#a90000'
  },
  bmCrossButton: {
    height: '24px',
    width: '24px'
  },
  bmCross: {
    background: '#bdc3c7'
  },
  bmMenuWrap: {
    position: 'fixed',
    height: '100%'
  },
  bmMenu: {
    background: '#373a47',
    padding: '2.5em 1.5em 0',
    fontSize: '1.15em'
  },
  bmMorphShape: {
    fill: '#373a47'
  },
  bmItemList: {
    color: '#b8b7ad',
    padding: '0.8em'
  },
  bmItem: {
    display: 'inline-block'
  },
  bmOverlay: {
    background: 'rgba(0, 0, 0, 0.3)'
  }
}

const MenuWrapper = styled.div`
  position: fixed;
  height: 100px;
  width: 100%;
  z-index: 99999999999;
  background: linear-gradient(#FFFFFF,#F8F8F8);
`

const HomeMenu = styled.img`
  position: fixed;
  width: 50px;
  height: 50px;
  background-repeat: no-repeat;
  background-size: contain;
  margin-left: 20px;
  top: 25px;
  border-radius: 17.5px;
  cursor: pointer;
  `

const ButtonMarginLeft = styled.div`
  position: relative;
  margin-left: 6rem;
  opacity: 0.6;
  text-align: center;

  @media (max-width: 500px) {
    display: none;
  }
`

const RainbowComingSoon = styled.div`
  font-weight: bold;
  margin-top: -8px;
`

const RainbowWalletCover = styled.div`
  position: absolute;
  width: 300px;
  height: 60px;
  top: 0;
  left: -20px;
  z-index: 10000;
`

const UnwrapAllButtonWrapper = styled.div`
  width: 50%;
  height: 20px;
  margin: 8px 0;
  margin-bottom: 2rem;
`

const Account = styled.div`
  background-color: ${props => (props.balanceMIKE ? '#f1f2f6' : "#DEDEDE")};
  padding: 0.75rem;
  border-radius: 6px;
  cursor: ${props => (props.balanceMIKE ? 'auto' : 'pointer')};
  color: #2F80ED;
  transform: scale(1);
  transition: transform 0.3s ease;
  :hover {
    transform: ${props => (props.balanceMIKE ? 'scale(1)' : 'scale(1.02)')};
    text-decoration: underline;
  }
`
const SockCount = styled.p`
  /* color: #6c7284; */
  font-weight: 500;
  margin: 0px;
  font-size: 14px;
  float: left;
`

const HomePay = styled.div` 
  z-index: 900;
  position: fixed;
  margin-left: 5px;
  top: 25px;
  display: flex;

`

const NavBarSubSection = styled.p`
  display: flex;
`

const TextStyling = {
  marginTop: "0.5rem",
  padding: "none",
  textDecoration: "none",
  color: 'white',
  cursor: `pointer`
}

const TextStylingTitle = {
  marginTop: "0.5rem",
  padding: "none",
  fontSize: "20px",
  textDecoration: "none",
  color: 'white',
  cursor: `pointer`
}

const logoStyle = {
  marginRight: "1rem",
  marginBottom: "1rem",
  height: "100%",
  width: "40px",
  cursor: `pointer`
}

const TextLinks = styled.ul`
  text-decoration: none;
  padding-left: "0";
  padding-inline-start: 0px;
`;

export default function Body({
  // account,
  selectedTokenSymbol,
  setSelectedTokenSymbol,
  ready,
  unlock,
  validateBuy,
  buy,
  validateSell,
  sell,
  unwrap,
  burn,
  mintNft,
  dollarize,
  dollarPriceMike,
  dollarPriceTuba,
  balanceMIKE,
  balanceTUBA,
  balanceWETH,
  reserveMIKEETH,
  reserveTUBAETH,
  reserveTokenMike,
  reserveTokenTuba,
  totalSupplyMike,
  totalSupplyTuba
}) {
  // const { account } = useWeb3Context()
  const [currentTransaction, _setCurrentTransaction] = useState({})
  const setCurrentTransaction = useCallback((hash, type, amount) => {
    _setCurrentTransaction({ hash, type, amount })
  }, [])
  const clearCurrentTransaction = useCallback(() => {
    _setCurrentTransaction({})
  }, [])
  const [state, setState] = useAppContext()
  const [showConnect, setShowConnect] = useState(false)
  const [showWorks, setShowWorks] = useState(false)
  const currentDate = new Date();
  const year = (currentDate.getMonth() === 11 && currentDate.getDate() > 23) ? currentDate.getFullYear() + 1 : currentDate.getFullYear();
  const { account, setConnector  } = useWeb3Context()
  function handleAccount() {
    setConnector('Injected', { suppressAndThrowErrors: true }).catch(error => {
      setShowConnect(true)
    })
  }

  return (
    <>
    
    <BodyContainer>

    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
    />

    <Header
        totalSupply={totalSupplyMike}
        ready={ready}
        dollarPrice={dollarPriceMike}
        balanceMIKE={balanceMIKE}
        balanceWETH={balanceWETH}
        unwrap={unwrap}
        mintNft={mintNft}
        setCurrentTransaction={setCurrentTransaction}
        setShowConnect={setShowConnect}
      />


    <TitleContainer>
      <TitleHomePage>
        <Title>NFT Swag Wars</Title>
        <Subtitle>You can't just wear <span style={{ color: '#FE6DDE' }}>$SOCKS</span></Subtitle>
      </TitleHomePage>  
    </TitleContainer>


    <SubHeader>   
       <Blurb1>
        <SmallBlurb1>
        <div>0xTuba vs Mike Demarais: Art by ratwell<span><Countdown date={`${year}-10-27T20:00:00`}/></span></div>
        </SmallBlurb1>
      </Blurb1>
    </SubHeader>

      <TwoCardDiv>
    <AppWrapper overlay={state.visible}>
      <InfluencerCard1/>
      <Content>
      <Card 
        totalSupply={totalSupplyTuba} 
        dollarPrice={dollarPriceTuba} 
        reserveToken={reserveTokenTuba}
        reserveETH={reserveTUBAETH}
        type="tuba"
        yesterdayPriceObject={state.yesterdayPrices.filter(yp => yp && yp.ticker === "tuba")[0]}
      />{' '}
        <Info>
          <div style={{ marginBottom: '4px' }}>Buy and sell real shirts with digital currency.</div>
          <div style={{ marginBottom: '4px' }}>
            Delivered on demand.{' '}
            {/* <a
              href="/"
              onClick={e => {
                e.preventDefault()
                setState(state => ({ ...state, visible: !state.visible }))
                setShowWorks(true)
              }}
            >
              Learn more
            </a> */}
          </div>
        </Info>
        {!account ? (
        <div onClick={() => process.env.REACT_APP_ENABLED === "true" ? handleAccount() : () => {}}>
          <ConnectWallet>Connect Wallet</ConnectWallet>
        </div>
        ):  <BuyButtons balances={state.tokenBalances} ticker={"tuba"} /> }
        <RedeemButton balance={balanceTUBA} ticker={"tuba"} />
        {/* {!!account && (
          <Link style={{ textDecoration: 'none' }} to="/orderstatus">
            <OrderStatusLink>Check order status?</OrderStatusLink>
          </Link>
        )} */}
      </Content>
      {/* <Checkout
        selectedTokenSymbol={selectedTokenSymbol}
        setSelectedTokenSymbol={setSelectedTokenSymbol}
        ready={ready}
        unlock={unlock}
        type="tuba"
        validateBuy={validateBuy}
        buy={buy}
        validateSell={validateSell}
        sell={sell}
        burn={burn}
        balanceMIKE={balanceTUBA}
        dollarPrice={dollarPriceTuba}
        reserveTokenMike={reserveTokenTuba}
        dollarize={dollarize}
        showConnect={showConnect}
        setShowConnect={setShowConnect}
        currentTransactionHash={currentTransaction.hash}
        currentTransactionType={currentTransaction.type}
        currentTransactionAmount={currentTransaction.amount}
        setCurrentTransaction={setCurrentTransaction}
        clearCurrentTransaction={clearCurrentTransaction}
        showWorks={showWorks}
        setShowWorks={setShowWorks}
      /> */}
    </AppWrapper>


        <AppWrapper overlay={state.visible}>
        <InfluencerCard2/>
        <Content>
        <Card 
        totalSupply={totalSupplyMike} 
        dollarPrice={dollarPriceMike} 
        reserveToken={reserveTokenMike}
        reserveETH={reserveMIKEETH}
        type="mike"
        yesterdayPriceObject={state.yesterdayPrices.filter(yp => yp && yp.ticker === "mike")[0]}
      />{' '}
          <Info>
            <div style={{ marginBottom: '4px' }}>Buy and sell real shirts with digital currency.</div>
            <div style={{ marginBottom: '4px' }}>
              Delivered on demand.{' '}
              {/* <a
                href="/"
                onClick={e => {
                  e.preventDefault()
                  setState(state => ({ ...state, visible: !state.visible}))
                  setShowWorks(true)
                }}
              >
                Learn more
              </a> */}
            </div>
          </Info>
          {!account ? (
        <div onClick={() => process.env.REACT_APP_ENABLED === "true" ? handleAccount() : () => {}}>
          <ConnectWallet>Connect Wallet</ConnectWallet>
        </div>
        ): <BuyButtons balances={state.tokenBalances} ticker={"mike"} /> }
          <RedeemButton balance={balanceMIKE} ticker={"mike"} />
          {/* {!!account && (
            <Link style={{ textDecoration: 'none' }} to="/orderstatus">
              <OrderStatusLink>Check order status?</OrderStatusLink>
            </Link>
          )} */}
        </Content>
        {state.selectedTicker && <Checkout
          selectedTokenSymbol={selectedTokenSymbol}
          setSelectedTokenSymbol={setSelectedTokenSymbol}
          ready={ready}
          unlock={unlock}
          validateBuy={validateBuy}
          buy={buy}
          validateSell={validateSell}
          sell={sell}
          unwrap={unwrap}
          burn={burn}
          mintNft={mintNft}
          type={state.selectedTicker}
          balance={state.selectedTicker === 'mike' ? balanceMIKE : balanceTUBA}
          totalSupply={state.selectedTicker === 'mike' ? totalSupplyMike : totalSupplyTuba}
          dollarPrice={state.selectedTicker === 'mike' ? dollarPriceMike : dollarPriceTuba}
          reserveToken={state.selectedTicker === 'mike' ? reserveTokenMike : reserveTokenTuba}
          reserveETH={state.selectedTicker === 'mike' ? reserveMIKEETH : reserveTUBAETH}
          dollarize={dollarize}
          showConnect={showConnect}
          setShowConnect={setShowConnect}
          currentTransactionHash={currentTransaction.hash}
          currentTransactionType={currentTransaction.type}
          currentTransactionAmount={currentTransaction.amount}
          setCurrentTransaction={setCurrentTransaction}
          clearCurrentTransaction={clearCurrentTransaction}
          showWorks={showWorks}
          setShowWorks={setShowWorks}
        />}
      </AppWrapper>
      </TwoCardDiv>
      <SubHeader>   
       <Blurb1>
        {/* <Drops>Drops:</Drops> */}
          <LimitedEdition>
           Limited edition, dynamically priced, uniquely designed NFTs. Redeemable for the physical swag. Prices change when tokens are bought and sold.
           </LimitedEdition>
      </Blurb1>
    </SubHeader>
      <Footer/>
      </BodyContainer>
      </>
  )
}

const BodyContainer = styled.div`
width: 100%;
*,
*::before,
*::after {
box-sizing: border-box;
}
`


const TwoCardDiv = styled.div`
display: flex;
background-color: #F8F8F8;
@media screen and (max-width: 992px) {
  flex-direction: column;
}
`
const SubHeader = styled.div`
display: flex;
align-items: center;
justify-content: center;
background-color: #F8F8F8;
`

  const Title = styled.div`
  font-size: 60px;
  `

  const Subtitle = styled.div`
  color: #9D9D9D;
  `


const TitleContainer = styled.div`
  width: 100%;
  background: rgb(248,248,248);
  background: linear-gradient(0deg, rgba(248,248,248,1) 0%, rgba(239,241,248,1) 100%);
  font-size: 40px;
  display: flex;
  flex-direction: column;
  padding: 100px 1rem 1rem 1rem;
  text-align: center;
  color: ${props => props.theme.black};
  font-family: "Roboto", "Helvetica", "Arial", sans-serif;
  text-align: center;
  font-weight: bold;
` 
const TitleHomePage = styled.div`
  margin-top: 2rem;
  padding: 0rem;
  display: flex;
  flex-direction: column;
  text-align: centre;
  color: ${props => props.theme.black};
  font-weight: 600;
  font-family: "Roboto", "Helvetica", "Arial", sans-serif;
  text-align: center;
`

const Blurb1 = styled.div`
  margin-top: 2.5rem;
  font-size: 36px;
  padding: 1rem;
  text-align: centre;
  color: ${props => props.theme.black};
  font-weight: bold;
  font-family: "Roboto", "Helvetica", "Arial", sans-serif;
  text-align: left;
`
const SmallBlurb1 = styled.div`
  font-size: 36px;
  text-align: center;
  color: ${props => props.theme.black};
  font-weight: 400;
  font-family: "Roboto", "Helvetica", "Arial", sans-serif;
  text-shadow: none;
  font-weight: bold;
`

const Drops = styled.div`
  padding-top: 1rem;
  font-size: 28px;
  text-align: left;
  color: ${props => props.theme.black};
  font-weight: 400;
  font-family: "Roboto", "Helvetica", "Arial", sans-serif;
  text-shadow: none;
  font-weight: bold;
`
const LimitedEdition = styled.div`
margin-bottom: 1rem;
  padding-top: 1rem;
  font-size: 20px;
  text-align: left;
  color: ${props => props.theme.black};
  font-weight: 400;
  font-family: "Roboto", "Helvetica", "Arial", sans-serif;
  text-shadow: none;
  color: #999;
`

const InfluencerCard1= styled.div`
  background: #000000;
  background: linear-gradient(162.92deg, #2b2b2b 12.36%, #000000 94.75%);
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.4);
  background-image: url(${myTuba3});
  width: 444px;
  height: 114px;
  border: 3px solid;
  margin-bottom: 0.5rem;
  border-radius: 16px;
  @media screen and (max-width: 992px) {
      display: none;
  }
 `
 const InfluencerCard2= styled.div`
  background: #000000;
  background: linear-gradient(162.92deg, #2b2b2b 12.36%, #000000 94.75%);
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.4);
  background-image: url(${myMike2});
  width: 444px;
  height: 114px;
  border: 3px solid;
  margin-bottom: 0.5rem;
  border-radius: 16px;
  @media screen and (max-width: 992px) {
    display: none;
}
 `

const AppWrapper = styled.div`
  width: 100vw;
  height: 100%;
  margin: 0px auto;
  margin-bottom: 1rem;
  margin-top: 2em;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-items: center;
  z-index: 0;
  positon: fixed;

  @media (max-width: 600px) {
    z-index: ${props => props.overlay ? 999999999999999 : 0};
  }
`

const Content = styled.div`
  width: calc(100vw - 32px);
  max-width: 375px;
  margin-top: 30px;
`

const Info = styled.div`
text-align: center;
  color: ${props => props.theme.text};
  font-weight: 500;
  margin: 0px;
  font-size: 14px;
  padding: 20px;
  padding-top: 32px;
  border-radius: 0 0 8px 8px;
  /* border-radius: 8px; */
  margin-bottom: 12px;
  margin-top: -12px;
  /* margin-top: 16px; */
  background-color: ${props => '#f1f2f6'};
  a {
    color: ${props => props.theme.uniswapPink};
    text-decoration: none;
    /* padding-top: 8px; */
    /* font-size: 14px; */
  }
  a:hover {
    cursor: pointer;
    text-decoration: underline;
  }
`

const OrderStatusLink = styled.p`
  color: ${props => props.theme.uniswapPink};
  text-align: center;
  font-size: 0.6rem;
`