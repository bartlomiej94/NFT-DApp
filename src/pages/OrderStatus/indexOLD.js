import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useWeb3Context } from 'web3-react'
import { useAppContext } from '../../context'
import { Redirect } from 'react-router-dom'
import { Header } from '../Body'
import Button from '../../components/Button'
import { EtherscanLink } from '../../components/Works'
import Footer from '../Body'

const OrderDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 2rem;
  border: 1px solid black;
  margin-bottom: 1rem;
`

export default function StatusPage({ totalSupply, ready, balanceMIKE }) {
  const [state] = useAppContext()
  const { library, account } = useWeb3Context()

  const [signature, setSignature] = useState()
  const [timestamp, setTimestamp] = useState()

  const [data, setData] = useState()
  const [error, setError] = useState()

  function sign() {
    const timestampToSign = Math.round(Date.now() / 1000)
    const signer = library.getSigner()
    const message = `This signature is proof that I control the private key of ${account} as of the timestamp ${timestampToSign}.\n\n It will be used to access my Unisocks order history.`
    signer.signMessage(message).then(returnedSignature => {
      setTimestamp(timestampToSign)
      setSignature(returnedSignature)
    })
  }

  useEffect(() => {
    if (account && signature && timestamp) {
      fetch('/.netlify/functions/getEntries', {
        method: 'POST',
        body: JSON.stringify({ address: account, signature: signature, timestamp: timestamp })
      }).then(async response => {
        if (response.status !== 200) {
          const parsed = await response.json().catch(() => ({ error: 'Unknown Error' }))
          console.error(parsed.error)
          setError(parsed.error)
        } else {
          const parsed = await response.json()
          setData(parsed)
        }
      })

      return () => {
        setError()
        setData()
        setTimestamp()
        setSignature()
      }
    }
  }, [account, signature, timestamp])

  if (!account) {
    return <Redirect to={'/'} />
  } else {
    return (
      <>
      <RedeemContainer>

      <TitleContainer>
      <TitleHomePage>
        <Title>NFT Swag Wars</Title>
        <Subtitle>You can't just wear <span style={{ color: '#FE6DDE' }}>$SOCKS</span></Subtitle>
      </TitleHomePage>  
    </TitleContainer>


    <SubHeader>   
       <Blurb1>
        <Drops>Redeem:</Drops>
          <LimitedEdition>
          You can use this page to check the status of your Unisocks order, please bookmark it for future reference.
           </LimitedEdition>
      </Blurb1>
      </SubHeader>
        {/* <Content> */}
          {error && <div>Error</div>}
          <ButtonStyle>
          <Button text={'Access my order history'} type="cta" disabled={!!data} onClick={sign} />
          </ButtonStyle>
          <br />
          {data &&
            (data.length === 0 ? (
              <div>No orders found.</div>
            ) : (
              data.map((d, i) => {
                return (
                  <OrderDiv key={i}>
                    <ul>
                      <li>
                        Order Date:{' '}
                        {new Date(Number(d.timestamp) * 1000).toLocaleDateString(undefined, {
                          dateStyle: 'long',
                          timeStyle: 'short'
                        })}
                      </li>
                      <li>{state.selectedTicker.toUpperCase()} Redeemed: {d.numberOfSocks}</li>
                      <li>
                        Status:{' '}
                        {d.invalid
                          ? 'Invalid Order'
                          : d.matched
                          ? d.shippingId
                            ? 'Shipped!'
                            : 'Processing Order'
                          : 'Order Received'}
                      </li>
                      {d.shippingId && (
                        <li>
                          Shipping Id:{' '}
                          <a
                            href={`https://www.google.com/search?q=${d.shippingId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none' }}
                          >
                            {d.shippingId}
                          </a>
                        </li>
                      )}
                    </ul>
                    {d.NFTTransactionHash && (
                      <EtherscanLink
                        style={{ marginBottom: '.5rem' }}
                        href={`https://etherscan.io/tx/${d.NFTTransactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View ERC-721 Transaction
                      </EtherscanLink>
                    )}
                  </OrderDiv>
                )
              })
            ))}
          <p style={{ fontSize: '.75rem', textAlign: 'center' }}>
            Problem with an order?{' '}
            <a
              href={`mailto:combatcurve@gmail.com`}
              target="_blank"
              rel="noopener noreferrer"
            >
            combatcurve@gmail.com
            </a>
            {' '}
          </p>
        {/* </Content> */}
      </RedeemContainer>
      <Footer/>
      </>
    )
  }
}

const ButtonStyle = styled.div`
width: 20rem;
display: flex;
align-items: center;
margin-left: 45rem; 
margin-right: 45rem;
`
const RedeemContainer = styled.div`
`

  const Title = styled.div`
  font-size: 60px;
  `

  const Subtitle = styled.div`
  color: #9D9D9D;
  `
  const SubHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F8F8F8;
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
  padding-top: 2.5rem;
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
