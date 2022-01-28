import React from 'react'
import Lottie from 'react-lottie'
import styled from 'styled-components'
import * as animationData from '../../utils/lottie-data/sleeping-koala.json'
import Button from '../../components/Button'

const Idle = ({ setIdle }) => {
    const defaultOptions = {
        animationData: animationData.default,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid slice'
        }
    }

    const headers = [
        "Farewell, friend!",
        "See ya later, alligator!",
        "Cheerio!",
        "Okay bye, fry guy!",
        "Take it easy!",
        "Have a good one!",
        "Until next time!",
        "Farewell!",
        "Peace out!",
        "Adios, Amigos!",
        "So long, suckers!",
        "Take it easy, greasy!",
        "Later, potato!",
        "Tootle-loo, Kangaroo!",
        "Asta la vista, baby!",
        "Later, hater!",
        "Don’t forget to come back!",
        "Better shake, rattlesnake!",
    ]

    const randomIndex = parseInt(Math.random() * headers.length)

    return (
        <Wrapper>
            <HeaderWrapper>
                <Header>
                    {headers[randomIndex]}
                </Header>
            </HeaderWrapper>
            <Lottie
                options={defaultOptions}
                autoplay
                animationData={animationData.default}
                height={200}
                width={300}
            />
            <ButtonWrapper>
                <ButtonFrame type='cta' text="I'm back!" onClick={() => setIdle(false)} />
            </ButtonWrapper>
        </Wrapper>
    )
}

export default Idle

const Wrapper = styled.div`
    position: fixed;
    top: 40%;
    left: 50%;
    margin-top: -100px;
    margin-left: -150px;
    width: 300px;
`
const HeaderWrapper = styled.div`
    display: flex;
    max-width: 300px;
    justify-content: center;
    margin: 0;
`

const Header = styled.h2`
    text-align: center;
    font-size: 32px;
    font-weight: bold;
    width: 100%;
`

const ButtonWrapper = styled.div`
    display: flex;
    justify-content: center;
`

const ButtonFrame = styled(Button)`
  padding: 10px;
  margin-top: 24px;
  width: 100px;
  height: 40px;
`