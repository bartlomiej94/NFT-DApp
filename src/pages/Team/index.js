import React from 'react'
import styled from 'styled-components'
import { Header } from '../Body'
import nic from './nic.jpg';
import seranged from './seranged.png';
import carn from './carn.png';
import Footer from '../../components/footer'


export default function Team({ totalSupply, reserveTokenMike, ready, balanceMIKE }) {

  return (
  <>
      <Header totalSupply={totalSupply} ready={ready} balanceMIKE={balanceMIKE} setShowConnect={() => {}} />

      <Blurb>
        <Margin>
      </Margin>
      </Blurb>  

    <ThreeCardDiv>
    <Content>
          <Title>Seranged</Title>
          <TeamMember2 />
          <CardFooter>
            <a href="https://www.twitter.com/seranged">
              Twitter: @Seranged
            </a>
            <div><span role="img" aria-label="unicorn">
          📍
          </span> The Cloud</div>
          </CardFooter>
        </Content>
      <Content>
        <Title>Nicole Maffeo</Title>
        <TeamMember1 />
        <CardFooter>
          <a href="https://www.twitter.com/nicole_maffeo">
            Twitter: @nicole_maffeo
          </a>
          <div>
          <span role="img" aria-label="unicorn">
          📍
          </span> New York City</div>
        </CardFooter>
      </Content>
          <Content>
            <Title>Prince Dante</Title>
            <TeamMember3 />
            <CardFooter>
              <a href="https://twitter.com/0xPrinceDante">
                Twitter: @0xPrinceDante
              </a>
              <div><span role="img" aria-label="unicorn">
          📍
          </span>9th Circle of Hell</div>
            </CardFooter>
          </Content>
      </ThreeCardDiv>
      <Footer/>
    </>
  )
}
const ThreeCardDiv = styled.div`
*,
*::before,
*::after {
box-sizing: border-box;
}
display: flex;
flex-direction: row;
padding-bottom: 30px;
margin-bottom: 2.5rem;
margin-top: 4rem;
@media screen and (max-width: 1200px) {
  flex-direction: column;
  align-items: center;
}
`

const Margin = styled.div`
padding-top: 6rem;
`

const Blurb = styled.div`
  background: rgb(248,248,248);
  background: linear-gradient(0deg, rgba(248,248,248,1) 0%, rgba(239,241,248,1) 100%);
  font-size: 40px;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  text-align: center;
  color: ${props => props.theme.black};
  font-family: "Roboto", "Helvetica", "Arial", sans-serif;
  text-align: center;
  font-weight: bold;
`

const CardFooter = styled.p`
  margin-right: 2rem;
  margin-left: 2rem;
  color: white;
  margin-top: auto;
  a {
    text-decoration: none;
    color: #fe6dde;
    margin-bottom: 2rem;
    margin-top: auto;
  }
`

const TeamMember1 = styled.div`
  background-image: url(${nic});
  width: 300px;
  height: 225px;
  align-self: center;
  margin-bottom: 3rem;
  object-fit: cover;
  @media only screen and (max-width: 500px) {
    -webkit-transform: scale(0.75); /* Saf3.1+, Chrome */
    -moz-transform: scale(0.75); /* FF3.5+ */
     -ms-transform: scale(0.75); /* IE9 */
      -o-transform: scale(0.75); /* Opera 10.5+ */
    transform: scale(0.75);
  }
`
const TeamMember2 = styled.div`
  background-image: url(${seranged});
  background-position: 50% 30%;
  width: 300px;
  height: 225px;
  align-self: center;
  margin-bottom: 3rem;
  object-fit: cover;
  @media only screen and (max-width: 500px) {
    -webkit-transform: scale(0.75); /* Saf3.1+, Chrome */
    -moz-transform: scale(0.75); /* FF3.5+ */
     -ms-transform: scale(0.75); /* IE9 */
      -o-transform: scale(0.75); /* Opera 10.5+ */
    transform: scale(0.75);
  }
`
const TeamMember3 = styled.div`
  background-image: url(${carn});
  width: 300px;
  height: 225px;
  align-self: center;
  margin-bottom: 3rem;
  object-fit: cover;
  @media only screen and (max-width: 500px) {
    -webkit-transform: scale(0.75); /* Saf3.1+, Chrome */
    -moz-transform: scale(0.75); /* FF3.5+ */
     -ms-transform: scale(0.75); /* IE9 */
      -o-transform: scale(0.75); /* Opera 10.5+ */
    transform: scale(0.75);
  }
`

const Content = styled.div`
  width: 75%;
  margin: 2.5rem;
  margin-top: 2.5rem;
  margin-bottom: 5rem;
  background: #000000;
  background: linear-gradient(162.92deg, #2b2b2b 12.36%, #000000 94.75%);
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  object-fit: cover;
`

const Title = styled.h2`
  color: white;
  font-weight: 400;
  margin-left: 2rem;
  margin-bottom: 2rem;
  margin-top: 2rem;
`