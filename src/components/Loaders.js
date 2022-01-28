import React from 'react'
import Lottie from 'react-lottie'
import styled from 'styled-components'
import * as animationData from '../utils/lottie-data/loader.json'
import * as animationDataPaperplane from '../utils/lottie-data/paperplane.json'
import * as animationDataUnwrap from '../utils/lottie-data/unwrap.json'
import * as animationDataUnlock from '../utils/lottie-data/unlock.json'
import * as animationDataBurn from '../utils/lottie-data/burn.json'
import * as animationDataNft from '../utils/lottie-data/nft.json'

export function Loader() {
    const [hidden, setHidden] = React.useState(true)

    setTimeout(() => {
        setHidden(false)
    }, 500)
    
    const defaultOptions = {
        animationData: animationData.default,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid slice'
        }
    }

    return (
        !hidden && <LoaderWrapper>
            <Lottie
                isClickToPauseDisabled={true}
                options={defaultOptions}
                autoplay
                animationData={animationData.default}
                height={200}
                width={200}
            />
        </LoaderWrapper>
    )
}

export function PaperplaneLoader() {
    const defaultOptions = {
        animationData: animationDataPaperplane.default,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid slice'
        }
    }

    return (
        <CustomLoaderWrapper>
            <Lottie
                isClickToPauseDisabled={true}
                options={defaultOptions}
                autoplay
                animationData={animationData.default}
                height={100}
                width={200}
            />
        </CustomLoaderWrapper>
    ) 
}

export function UnwrapLoader() {
    const defaultOptions = {
        animationData: animationDataUnwrap.default,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid slice'
        }
    }

    return (
        <CustomLoaderWrapper>
            <Lottie
                isClickToPauseDisabled={true}
                options={defaultOptions}
                autoplay
                animationData={animationData.default}
                height={60}
                width={60}
            />
        </CustomLoaderWrapper>
    ) 
}

export function UnlockLoader() {
    const defaultOptions = {
        animationData: animationDataUnlock.default,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid slice'
        }
    }

    return (
        <RedeemLoaderWrapper>
            <Lottie
                isClickToPauseDisabled={true}
                options={defaultOptions}
                autoplay
                animationData={animationData.default}
                height={120}
                width={150}
            />
        </RedeemLoaderWrapper>
    ) 
}

export function BurnLoader() {
    const defaultOptions = {
        animationData: animationDataBurn.default,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid slice'
        }
    }

    return (
        <RedeemLoaderWrapper>
            <Lottie
                isClickToPauseDisabled={true}
                options={defaultOptions}
                autoplay
                animationData={animationData.default}
                height={50}
                width={50}
            />
        </RedeemLoaderWrapper>
    ) 
}

export function NftLoader() {
    const defaultOptions = {
        animationData: animationDataNft.default,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid slice'
        }
    }

    return (
        <CustomLoaderWrapperNFT>
            <Lottie
                isClickToPauseDisabled={true}
                options={defaultOptions}
                autoplay
                animationData={animationData.default}
                height={50}
                width={50}
            />
        </CustomLoaderWrapperNFT>
    ) 
}



const LoaderWrapper = styled.div`
    position: fixed;
    left: 50%;
    top: 50%;
    margin-top: -100px;
    margin-left: -100px;
`

const CustomLoaderWrapper = styled.div`
    height: 100%;
    width: 100%;
    padding: 8px 0;
`

const CustomLoaderWrapperNFT = styled.div`
    height: 100%;
    width: 100%;
    padding: 8px 0;
    margin-top: -8px;
`

const RedeemLoaderWrapper = styled.div`
    height: 100%;
    width: 100%;
    margin-top: -5px;
`