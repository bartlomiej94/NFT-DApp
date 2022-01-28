import React from 'react'
import Lottie from 'react-lottie';
import styled from 'styled-components'
import * as animationData from '../utils/lottie-data/spinner.json'

export default function Spinner({ height, width = 150, margin }) {
    const defaultOptions = {
        animationData: animationData.default,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid slice'
        }
    }

    return (
        <Wrapper style={{ margin }}>
            <Lottie
                isClickToPauseDisabled={true}
                options={defaultOptions}
                autoplay
                animationData={animationData.default}
                height={height}
                width={width}
                style={{margin}}
            />
        </Wrapper>
    )
}

const Wrapper = styled.div`

`
