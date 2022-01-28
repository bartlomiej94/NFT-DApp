import React from 'react'
import styled from 'styled-components'
import email from './Gallery/email.png'
import discord from './Gallery/discord.png'
import twitter from './Gallery/twitter.png'

export default function Footer() {
  return (
    <>
    <FooterFrame>
      <LogoContainer>
      <a href="mailto:combatcurve@gmail.com" target={"_blank"} rel="noopener noreferrer" style={{ textDecoration: 'none', alignItems: 'center' }}>
        <img src={email}  alt="shutup" style={{ width: '60px', height: 'auto' }}></img>
      </a>

      <a href="https://discord.gg/Qd43VY3hE7" target={"_blank"} rel="noopener noreferrer" style={{ textDecoration: 'none', alignItems: 'center' }}>
        <img src={discord} alt="shutup" style={{ width: '60px', height: 'auto' }}></img>
      </a>

      <a href="https://twitter.com/combatcurve" target={"_blank"} rel="noopener noreferrer" style={{ textDecoration: 'none', alignItems: 'center' }}>
        <img src={twitter} alt="shutup" style={{ width: '60px', height: 'auto' }}></img>
      </a>
      </LogoContainer>
    </FooterFrame>
    </>
  )
}

const FooterFrame = styled.div`
  background-color: #F0F1F8;
  height: 10rem;
`

const LogoContainer = styled.div`
padding-top: 2.5rem;
  background-color: #F0F1F8;
  display: flex;
  align-items: center;
  justify-content: center;
  a {
    padding: 10px;
  }
`