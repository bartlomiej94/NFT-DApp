import React from 'react'
import Lottie from 'react-lottie'
import styled from 'styled-components'
import * as animationDataBullUp from '../utils/lottie-data/bull-up.json'
import * as animationDataBearDown from '../utils/lottie-data/bear-down.json'
import * as animationDataQuestionMark from '../utils/lottie-data/question-mark.json'
import * as animationDataFailedTransaction from '../utils/lottie-data/failed-transaction-bear.json'

export function MarketDirectionBull() {
    const defaultOptions = {
        animationData: animationDataBullUp.default,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid slice'
        }
    }

    return (
        <CustomAnimationWrapper>
            <Lottie
                isClickToPauseDisabled={true}
                options={defaultOptions}
                autoplay
                height={60}
                width={60}
            />
        </CustomAnimationWrapper>
    ) 
}

export function MarketDirectionBear() {
    const defaultOptions = {
        animationData: animationDataBearDown.default,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid slice'
        }
    }

    return (
        <CustomAnimationWrapper>
            <Lottie
                isClickToPauseDisabled={true}
                options={defaultOptions}
                autoplay
                height={60}
                width={60}
            />
        </CustomAnimationWrapper>
    ) 
}

export function QuestionMark() {
    const defaultOptions = {
        animationData: animationDataQuestionMark.default,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid slice'
        }
    }

    return (
        <CustomAnimationWrapper>
            <Lottie
                isClickToPauseDisabled={true}
                options={defaultOptions}
                autoplay
                height={60}
                width={60}
            />
        </CustomAnimationWrapper>
    )     
}

export function FailedTransaction() {
    const defaultOptions = {
        animationData: animationDataFailedTransaction.default,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid slice'
        }
    }

    return (
        <FailedTransactionWrapper>
            <Lottie
                isClickToPauseDisabled={true}
                options={defaultOptions}
                autoplay
                height={300}
                width={300}
            />  
        </FailedTransactionWrapper>
    )
}

const CustomAnimationWrapper = styled.div`
    height: 60px;
    width: 60px;
`

const FailedTransactionWrapper = styled.div`
    height: 300px;
    width: 300px;
`