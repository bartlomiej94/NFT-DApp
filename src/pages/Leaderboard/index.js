import React from 'react'
import { Image, Layout, Table } from 'antd';
import 'antd/dist/antd.css';
import './leaderBoard.scss'
import { Header } from '../Body' 
import Footer from '../../components/footer'
import { useAppContext } from '../../context';
import { amountFormatter } from '../../utils';

import Mike from "./PFP/mike400x400.jpg"
import Tuba from "./PFP/tuba400x400.jpg"
import { QuestionMark } from '../../components/Animations';
import Spinner from '../../components/Spinner';
import questionMark2 from '../../components/Gallery/questionMark2.png'
import tshirtMike from '../../components/Gallery/tshirtMike.png'
import tshirtTuba from '../../components/Gallery/tshirtTuba.png'
import gold from './gold.png'
import silver from './silver.png'
import bronze from './bronze.png'
import { Loader } from '../../components/Loaders';

const { Content } = Layout;

  const columns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      valueType: 'rank',
      className: 'col-center col-rank',
      width: 10,
    },
    {
      title: 'Twitter',
      dataIndex: 'img',
      key: 'img',
      className: 'col-center',
      responsive: ['md'],
      render: (img, object) => {
        return (
            object.username ? (
              <a href={`https://www.twitter.com/${object.username}`}  target="blank" rel="noopener noreferrer">
                <Image className="twitterPicture" style={{ borderRadius: "50%" }} preview={false} src={img} alt="reee"/>
              </a>
            ) : (
              <div className="question-mark-wrapper">
                <QuestionMark />
              </div>
            )

       );},
    },
    {
      title: 'Asset',
      dataIndex: 'asset',
      key: 'asset',
      className: 'col-center',
      render: (asset, object) => {
        return (
          object.username ? (
            <Image src={asset} className="twitterPicture" alt="reee"/>
          ) : (
            <div className="question-mark-wrapper">
              <QuestionMark />
            </div>
          )
        )
      },
    },
    {
      title: 'Artist',
      dataIndex: 'artist',
      key: 'artist',
      responsive: ['md'],
    },
    {
      title: 'Price',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
    },
    {
      title: 'Ticker',
      dataIndex: 'ticker',
      key: 'ticker',
      responsive: ['lg'],
    },
    // {
    //   title: 'Pool',
    //   dataIndex: 'pool',
    //   key: 'pool',
    //   responsive: ['md'],
    // },
    // {
    //   title: 'Burned',
    //   dataIndex: 'burned',
    //   key: 'burned',
    //   responsive: ['lg'],
    // },
  ];

const Leaderboard = () => {
  const [state] = useAppContext()

  
  // This will have to be stored in token data when rewriting the app
  // const mikeOriginalTotalSupply = 35
  // const tubaOriginalTotalSupply = 35
  
  // const mikePriceObj = state.tokenDollarPrices.filter(tdp => tdp.name === 'mike')[0]
  // const tubaPriceObj = state.tokenDollarPrices.filter(tdp => tdp.name === 'tuba')[0]
  // const mikeTotalSupplyObj = state.tokenTotalSupplies.filter(mts => mts.name === 'mike')[0]
  // const tubaTotalSupplyObj = state.tokenTotalSupplies.filter(tts => tts.name === 'tuba')[0]
  // const mikeReserveObj = state.tokenReserves.filter(mtr => mtr.name === 'mike')[0]
  // const tubaReserveObj = state.tokenReserves.filter(ttr => ttr.name === 'tuba')[0]
  
  // mikeDollarPrice = (mikePriceObj && parseFloat(amountFormatter(mikePriceObj.price, 18, 2)).toFixed(2)) || 0
  // const tubaDollarPrice = (tubaPriceObj && parseFloat(amountFormatter(tubaPriceObj.price, 18, 2)).toFixed(2)) || 0
  // const mikeTotalSupply = mikeTotalSupplyObj && mikeTotalSupplyObj.supply
  // const tubaTotalSupply = tubaTotalSupplyObj && tubaTotalSupplyObj.supply
  // const mikeReserve = mikeReserveObj && parseFloat(amountFormatter(mikeReserveObj.reserve, 18, 0))
  // const tubaReserve = tubaReserveObj && parseFloat(amountFormatter(tubaReserveObj.reserve, 18, 0))

  const mikeDollarPrice = state.tokenDollarPricesLeaderboard[0]
  const tubaDollarPrice = state.tokenDollarPricesLeaderboard[1]
  
  if (!mikeDollarPrice || !tubaDollarPrice) return <Loader />
  
  const spinner = <div className="spinner"><Spinner width={60} margin={"0 !important"} /></div>
  
  const emptyData = {
    username: null,
    img: `${questionMark2}`,
    asset: `${questionMark2}`,
    artist: "",
    currentPrice: 0,  
    ticker: "",
    pool: "",
    burned: ""
  }

  const mikeData = {
    username: "mikedemarais",
    img: `${Mike}`,
    asset: `${tshirtMike}`,
    artist: 'ratwell',
    currentPrice: mikeDollarPrice.toFixed(2),
    ticker: "$MIKE",
    // pool: mikeReserve && mikeTotalSupply ? `${mikeReserve}/${mikeTotalSupply}` : spinner,
    // burned: mikeTotalSupply ? mikeOriginalTotalSupply - mikeTotalSupply : spinner
  }

  const tubaData = {
    username: "0xtuba",
    img: `${Tuba}`,
    asset: `${tshirtTuba}`, 
    artist: 'ratwell',
    currentPrice: tubaDollarPrice.toFixed(2),
    ticker: "$TUBA",
    // pool: tubaReserve && tubaTotalSupply ? `${tubaReserve}/${mikeTotalSupply}` : spinner,
    // burned: tubaTotalSupply ? tubaOriginalTotalSupply - tubaTotalSupply : spinner
  }

  let dataSource = [mikeData, tubaData]

  for (let i = 0; i < 6; i++) {
    dataSource.push(Object.create(emptyData))
  }

  dataSource = dataSource.sort(function(a, b) {
    return  b.currentPrice - a.currentPrice; 
  });

  dataSource.map((item, index) => {
    switch(index) {
      case 0:
      case 1:
      case 2:
        const rankImg = index === 0 ? gold : index === 1 ? silver : bronze
        item.rank = <img className={`rankPicture rank-${index + 1}`} src={rankImg} />
        break
      default:
        item.rank = index + 1
    }

    return item.currentPrice = (item.currentPrice && !isNaN(item.currentPrice))
      ? `$${item.currentPrice}`
      : item.username
      ? spinner
      : ""
  })

  return (
    <>
      <Layout className="layout">
        <Header/>
         <Content style={{ padding: '7.5rem 2.5rem 0rem 2.5rem' }}>
            <Table className="leaderboardContainer" pagination={false} dataSource={dataSource} columns={columns} />
         </Content>
       <Footer/>
      </Layout>
    </>
  )
}


export default Leaderboard
