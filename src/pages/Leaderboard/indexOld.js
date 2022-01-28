import React from 'react'
import styled from 'styled-components'
import { Header } from '../Body' 
import Footer from '../../components/footer'
import questionMark2 from '../../components/Gallery/questionMark2.png'

class Leaderboard extends React.Component {

  constructor() {
    super();
    this.state = {
      list: [{
        username:"0xtuba",
        img:"https://pbs.twimg.com/profile_images/1381237850310578181/SmH1zoqc_400x400.jpg",
        asset:`${questionMark2}`,
        price:"-",
        ticker:"$TUBA",
        burned:"-",
        pool:"-"
    },  
    {
      username:"mikedemarais",
      img:"https://pbs.twimg.com/profile_images/1427911499083886600/byWMKtYP_400x400.jpg",
      asset:`${questionMark2}`,
      price:"-",
      ticker:"$MIKE",
      burned:"-",
      pool:"-"
    },{
      username:"",
      img:`${questionMark2}`,
      asset:`${questionMark2}`,
      price:"-",
      ticker:"$----",
      burned:"-",
      pool:"-"
    },  
    {
      username:"",
      img:`${questionMark2}`,
      asset:`${questionMark2}`,
      price:"-",
      ticker:"$----",
      burned:"-",
      pool:"-"
    },{
      username:"",
      img:`${questionMark2}`,
      asset:`${questionMark2}`,
      price:"-",
      ticker:"$----",
      burned:"-",
      pool:"-"
  },  
    {
      username:"",
      img:`${questionMark2}`,
      asset:`${questionMark2}`,
      price:"-",
      ticker:"$----",
      burned:"-",
      pool:"-"
  }]}

    this._clickAllTime = this._clickAllTime.bind(this);
    this._clickRecent = this._clickRecent.bind(this);
  }

  componentDidMount() {
    const fetchInit = {
      method: 'GET',
      mode: 'cors'
    };

    fetch(`${ this.props.apiURL }`, fetchInit)
      .then(response => response.json())
      .then(data => {
        this.setState({
          list: data
        });
      })
      .catch(err => console.log('fetch error : ', err))
  }

  _clickAllTime(e) {
    let sorted = this.state.list.sort((a, b) => b.alltime - a.alltime);
    this.setState(sorted);
  }

  _clickRecent(e) {
    let sorted = this.state.list.sort((a, b) => b.price - a.price);
    this.setState(sorted);
  }

  render() {
    let userlist = this.state.list.map((user, i) => <User username={ user.username } rank={ i + 1 } asset={ user.asset } img={ user.img } price={ user.price } ticker={ user.ticker } burned={ user.burned } pool={ user.pool } />);
    return (
    <>
      <Header  />
      <HeaderDivision/>
      <TotalContainer>
        <LeaderboardHeader />
      <Container className="container">
        <ColumnHeader onClickAll={this._clickAllTime} onClick={this._clickRecent}/>
        { userlist }
      </Container>
      </TotalContainer>
      <FooterDivision/>
      <Footer/>
    </>
    )
  }

}

const LeaderboardHeader = () => {
  return (
    <>
    <Leadheader>
        <h2>Leaderboard</h2>
    </Leadheader>
    <LimitedEdition>
    May the best swag win. Most popular NFTs sorted by avg. price. Additional stats WIP.
    </LimitedEdition>
    </>
  )
}

const ColumnHeader = ({
  onClick,
  onClickAll
}) => (
  <Colheader>
      <UserBoxLeft>
        <h4>RANK</h4>
      </UserBoxLeft>
      <div className="col-xs-3 alltime">
        <h4 onClick={onClickAll} >PRICE</h4>
      </div>
      <div className="col-xs-3 alltime">
        <h4 >ASSET</h4>
      </div>
      <div className="col-xs-5">
        <h4>TWITTER</h4>
      </div>
      <div className="col-xs-3 recent">
        <h4 onClick={onClick} >TICKER</h4>
      </div>
      <div className="col-xs-3 alltime">
        <h4 onClick={onClickAll} >BURNED</h4>
      </div>
      <UserBoxRight className="col-xs-3 alltime">
        <h4 onClick={onClickAll} >POOL</h4>
      </UserBoxRight>
    </Colheader>
);


const User = ({ rank, img, username, ticker, alltime, price, pool, burned, asset }) => {
  return (
    <Users>
        <UserBoxLeft>
          <h4>{ rank }</h4>
        </UserBoxLeft>
        <UserBox>
          <h4>{ price }</h4>
        </UserBox>
        <UserBoxImg>
          <img alt="ree" src={ asset }></img>
        </UserBoxImg>
        <UserBoxImg>
          <a href={`https://www.twitter.com/${username}`} target="_blank">
          <img src={ img } href={`https://www.twitter.com/${username}`}  alt='twitterPFP'/></a>
        </UserBoxImg>
      <UserBoxTicker>
          <h4>{ ticker }</h4>
        </UserBoxTicker>
        <UserBox>
          <h4>{ pool }</h4>
        </UserBox>
        <UserBoxRight>
          <h4>{ burned }</h4>
        </UserBoxRight>
      </Users>
  )
}

export default Leaderboard


// @import url('https://fonts.googleapis.com/css?family=Montserrat')
//font variables
// $main-font: 'Montserrat', sans-serif

// Color variables
// $bgcolor: #FFC9D7
// $maincolor: rgba(0, 168, 232, 0.79)
// $whiterow: rgba(254, 254, 254, .9)
// $greyrow: rgba(240, 240, 240, .9)
// $white: rgba(254, 254, 254, 1)

// Genral rules
//body
//  background: url('https://i.kinja-img.com/gawker-media/image/upload/m6ztwkawvypgrnn9k5o3.jpg') no-repeat center center fixed
//  background-size: cover
//  font-family: $main-font



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


  //leadcontainer
  const UserBox = styled.div`
  width: 0.5rem;
  `

    //leadcontainer
    const UserBoxImg = styled.div`
    margin-right: 1rem;
    `
  //leadcontainer
  const UserBoxLeft = styled.div`
  padding-left: 2rem;
  `

  const UserBoxRight = styled.div`
  padding-right: 2rem;
  `
  const UserBoxTicker = styled.div`
  padding-right: 2rem;
  `

  //leadcontainer
  const HeaderDivision = styled.div`
  padding: 2.5rem;
  `
    //leadcontainer
    const FooterDivision = styled.div`
    padding: 1rem;
    `
  

  //leadcontainer
  const TotalContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  @media (max-width: 550px) {
      width: 100%
  }
  `

  //leadcontainer
  const Container = styled.div`
  width: 75%;
  @media (max-width: 550px) {
      width: 100%
  }
  `

const Leadheader = styled.div`
color: black;
font-size: 28px;
  border-radius: 50px;
  width: 75%;
  height: 100%;
  text-align: center;
  border-radius: 5px 5px 0 0;
  h2 {
    margin: 0;
    padding-top: 20px;
  }
  `
// Column header  
  const Colheader = styled.div`
  margin-top: 2rem;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  text-align: center;
  border-bottom: 1px solid rgba(0,0,0,.2);
  h4 {
    font-size: 15px;
  }
  alltime {
    cursor: pointer;
    user-select: none;
  }
  recent {
    cursor: pointer;
    user-select: none;
  }
`

const h4 = styled.div`
margin-top: 2rem;
display: flex;
flex-direction: row;
justify-content: center;
`
// User table    
  const Users = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  
  justify-content: space-between;
  padding-top: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(0,0,0,.2);

  .name {
    text-align: left;
  }
  a {
    padding-top: 15px;
    vertical-align: middle;
    justify-content: centre;
  }
  img {
    float: left;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid $maincolor;
    margin-right: 0px;
  }
  .rank {
    background: $whiterow;
  }
  :nth-of-type(even){
    background: $greyrow;
  }
  :last-child {
    border-radius: 0 0 5px 5px;
  }
  @media (max-width: 550px) {
    users {
      padding-left: 5px;
    }
    name {
      padding-left: 5px;
    }
  }

`