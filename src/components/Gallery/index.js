import * as React from 'react'
import styled from 'styled-components'

import { GlassMagnifier } from "react-image-magnifiers";

const GalleryFrame = styled.div`
  width: 100%;
  height: 250px;
  margin-top: 20%;
  margin-bottom: 15%;
  display: flex;
  align-items: center;
  flex-direction: center;
  /* background-color: ${props => props.theme.black}; */
  box-shadow: 10px 10px 0px rgba(0, 0, 0, 0.05);
`

const GalleryWrapper = styled.div`
  @media (max-width: 699px) {
    display: none;
  }
`

const ImageMobile = styled.img`
  width: 100%;

  @media (min-width: 700px) {
    display: none;
  }
`

// const ImgStyle = styled.img`
//   width: 100%;
//   box-sizing: border-box;
//   border-radius: 4px;
//   /* background-color: ${props => props.theme.black}; */
// `

export default function Gallery1({ image }) {
  return (
    <GalleryFrame>
      <GalleryWrapper>
        <GlassMagnifier
          imageSrc={image}
          imageAlt="Example"
          largeImageSrc={image}
        />
      </GalleryWrapper>
      <ImageMobile src={image} />
    </GalleryFrame>
  )
}

export function Gallery2({ image }) {
  return (
    <GalleryFrame>
      <GlassMagnifier
      imageSrc={image}
      imageAlt="Example"
      largeImageSrc={image}/>
    </GalleryFrame>
  )
}
