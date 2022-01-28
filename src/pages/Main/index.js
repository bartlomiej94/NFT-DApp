/* global BigInt */

import React, { useState, useCallback, useEffect } from 'react'
import { useWeb3Context } from 'web3-react'
import { Contract, Provider } from 'ethcall';
import { InfuraProvider } from '@ethersproject/providers';
import { batch, contract } from '@pooltogether/etherplex'
import { ethers } from 'ethers'
import Web3EthAbi from 'web3-eth-abi'
import Web3Eth from 'web3-eth'
import {
  Multicall,
  ContractCallResults,
  ContractCallContext,
} from 'ethereum-multicall';
import Web3 from 'web3';

import { getContract, amountFormatter } from '../../utils/index'
import FACTORY_ABI from '../../utils/factory.json'
import POOL_ABI from '../../utils/pool.json'
import WETH_ABI from '../../utils/weth.json'
import NFT_ABI from '../../utils/nft.json'
import NFT_CALLER_ABI from '../../utils/nftCaller.json'
import CCROUTER_ABI from '../../utils/ccRouter.json'

import { TOKEN_SYMBOLS, TOKEN_ADDRESSES, ERROR_CODES, getETHUSDValue } from '../../utils'
import { useAppContext } from '../../context';
import {
  useTokenContract,
  useExchangeContract,
  useAddressBalance,
  useAddressAllowance,
  useExchangeReserves,
  useExchangeAllowance,
  useTotalSupply
} from '../../hooks' 
import Body from '../Body'
import Team from '../Team'
import OrderStatus from '../OrderStatus';
import Leaderboard from '../Leaderboard'

import { getYesterdayPrices, setYesterdayPrice } from '../../backend/api';

import {
  abi as EXCHANGE_ABI,
} from '@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json'

// denominated in bips
const GAS_MARGIN = ethers.BigNumber.from(1000)

export function calculateGasMargin(value, margin) {
  const offset = value.mul(margin).div(ethers.BigNumber.from(10000))
  return value.add(offset)
}

// denominated in seconds
const DEADLINE_FROM_NOW = 60 * 15

// denominated in bips
const ALLOWED_SLIPPAGE = ethers.BigNumber.from(1500)

export function calculateSlippageBounds(value) {
  const offset = value.mul(ALLOWED_SLIPPAGE).div(ethers.BigNumber.from(10000))
  const minimum = value.sub(offset)
  const maximum = value.add(offset)
  return {
    minimum: minimum.lt(ethers.constants.Zero) ? ethers.constants.Zero : minimum,
    maximum: maximum.gt(ethers.constants.MaxUint256) ? ethers.constants.MaxUint256 : maximum
  }
}

// this mocks the getInputPrice function, and calculates the required output
function calculateEtherTokenOutputFromInput(inputAmount, inputReserve, outputReserve) {
  const inputAmountWithFee = inputAmount.mul(ethers.BigNumber.from(997))
  const numerator = inputAmountWithFee.mul(outputReserve)
  const denominator = inputReserve.mul(ethers.BigNumber.from(1000)).add(inputAmountWithFee)
  return numerator.div(denominator)
}

// this mocks the getOutputPrice function, and calculates the required input
function calculateEtherTokenInputFromOutput(outputAmount, inputReserve, outputReserve) {
  const numerator = inputReserve.mul(outputAmount).mul(ethers.BigNumber.from(1000))
  const denominator = outputReserve.sub(outputAmount).mul(ethers.BigNumber.from(997))
  return numerator.div(denominator).add(ethers.constants.One)
}

// get exchange rate for a token/ETH pair
function getExchangeRate(inputValue, outputValue, invert = false) {
  const inputDecimals = 18
  const outputDecimals = 18

  if (inputValue && inputDecimals && outputValue && outputDecimals) {
    const factor = ethers.BigNumber.from(10).pow(ethers.BigNumber.from(18))

    if (invert) {
      return inputValue
        .mul(factor)
        .div(outputValue)
        .mul(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(outputDecimals)))
        .div(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(inputDecimals)))
    } else {
      return outputValue
        .mul(factor)
        .div(inputValue)
        .mul(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(inputDecimals)))
        .div(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(outputDecimals)))
    }
  }
}

function calculateAmount(
  inputTokenSymbol,
  outputTokenSymbol,
  SOCKSAmount,
  reserveMIKEETH,
  reserveTokenMike,
  reserveSelectedTokenETH,
  reserveSelectedTokenToken
) {
  // eth to token - buy => WORKS FOR UNISOCKS ONLY
  if (inputTokenSymbol === TOKEN_SYMBOLS.ETH && outputTokenSymbol === TOKEN_SYMBOLS.SOCKS) {
    const amount = calculateEtherTokenInputFromOutput(SOCKSAmount, reserveMIKEETH, reserveTokenMike)
    if (amount.lte(ethers.constants.Zero) || amount.gte(ethers.constants.MaxUint256)) {
      throw Error()
    }
    return amount
  }

  // token to eth - sell => WORKS FOR UNISOCKS ONLY
  if (inputTokenSymbol === TOKEN_SYMBOLS.SOCKS && outputTokenSymbol === TOKEN_SYMBOLS.ETH) {
    const amount = calculateEtherTokenOutputFromInput(SOCKSAmount, reserveTokenMike, reserveMIKEETH)
    if (amount.lte(ethers.constants.Zero) || amount.gte(ethers.constants.MaxUint256)) {
      throw Error()
    }

    return amount
  }

  // token to token - buy or sell
  const buyingMIKE = outputTokenSymbol === TOKEN_SYMBOLS.MIKE

  // TODO: Make it dynamic for new tokens
  if (buyingMIKE) {
    // eth needed to buy x socks
    const intermediateValue = calculateEtherTokenInputFromOutput(SOCKSAmount, reserveMIKEETH, reserveTokenMike)
    // calculateEtherTokenOutputFromInput
    if (intermediateValue.lte(ethers.constants.Zero) || intermediateValue.gte(ethers.constants.MaxUint256)) {
      throw Error()
    }
    // tokens needed to buy x eth
    const amount = calculateEtherTokenInputFromOutput(
      intermediateValue,
      reserveSelectedTokenToken,
      reserveSelectedTokenETH
    )
    if (amount.lte(ethers.constants.Zero) || amount.gte(ethers.constants.MaxUint256)) {
      throw Error()
    }
    return amount
  } else {
    // eth gained from selling x socks
    const intermediateValue = calculateEtherTokenOutputFromInput(SOCKSAmount, reserveTokenMike, reserveMIKEETH)
    if (intermediateValue.lte(ethers.constants.Zero) || intermediateValue.gte(ethers.constants.MaxUint256)) {
      throw Error()
    }
    // tokens yielded from selling x eth
    const amount = calculateEtherTokenOutputFromInput(
      intermediateValue,
      reserveSelectedTokenETH,
      reserveSelectedTokenToken
    )
    if (amount.lte(ethers.constants.Zero) || amount.gte(ethers.constants.MaxUint256)) {
      throw Error()
    }
    return amount
  }
}

export default function Main({ team, leaderboard, orderstatus }) {
  const { library, account } = useWeb3Context()
  const [state, setState] = useAppContext()

  // selected token
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState(TOKEN_SYMBOLS.ETH)

  // get exchange contracts
  const exchangeContractMIKE = useExchangeContract(TOKEN_ADDRESSES.MIKE, true, 'mike')
  const exchangeContractTUBA = useExchangeContract(TOKEN_ADDRESSES.TUBA, true, 'tuba')

  const exchangeContractSelectedToken = useExchangeContract(TOKEN_ADDRESSES[selectedTokenSymbol])
  const exchangeContractDAI = useExchangeContract(TOKEN_ADDRESSES.DAI)

  // get token contracts
  const tokenContractMIKE = useTokenContract(TOKEN_ADDRESSES.MIKE)
  const tokenContractTUBA = useTokenContract(TOKEN_ADDRESSES.TUBA)
  const tokenContractSelectedToken = useTokenContract(TOKEN_ADDRESSES[selectedTokenSymbol])

  // get balances
  const balanceETH = useAddressBalance(account, "ETH")
  const balanceWETH = useAddressBalance(account, TOKEN_ADDRESSES.ETH)
  const balanceMIKE = useAddressBalance(account, TOKEN_ADDRESSES.MIKE, true)
  const balanceTUBA = useAddressBalance(account, TOKEN_ADDRESSES.TUBA)
  const balanceSelectedToken = useAddressBalance(account, TOKEN_ADDRESSES[selectedTokenSymbol])

  // totalsupply
  const totalSupplyMIKE = useTotalSupply(tokenContractMIKE)
  const totalSupplyTUBA = useTotalSupply(tokenContractTUBA)

  // get allowances
  const allowanceMIKE = useAddressAllowance(
    account,
    TOKEN_ADDRESSES.MIKE,
    TOKEN_ADDRESSES.CC_ROUTER
  )
  const allowanceTUBA = useAddressAllowance(
    account,
    TOKEN_ADDRESSES.TUBA,
    TOKEN_ADDRESSES.CC_ROUTER
  )
  const allowanceSelectedToken = useExchangeAllowance(account, TOKEN_ADDRESSES[selectedTokenSymbol])

  // get reserves
  const reserveMIKEETH = useAddressBalance(exchangeContractMIKE && exchangeContractMIKE.address, TOKEN_ADDRESSES.ETH)
  const reserveTUBAETH = useAddressBalance(exchangeContractTUBA && exchangeContractTUBA.address, TOKEN_ADDRESSES.ETH)
  const reserveMIKE = useAddressBalance(
    exchangeContractMIKE && exchangeContractMIKE.address,
    TOKEN_ADDRESSES.MIKE,
  );
  const reserveTUBA = useAddressBalance(
    exchangeContractTUBA && exchangeContractTUBA.address,
    TOKEN_ADDRESSES.TUBA
  );
  const { reserveETH: reserveSelectedTokenETH, reserveTokenMike: reserveSelectedTokenToken } = useExchangeReserves(
    TOKEN_ADDRESSES[selectedTokenSymbol]
  );

  // const reserveDAIETH = useAddressBalance(exchangeContractDAI && exchangeContractDAI.address, TOKEN_ADDRESSES.ETH)
  // const reserveDAIToken = useAddressBalance(exchangeContractDAI && exchangeContractDAI.address, TOKEN_ADDRESSES.DAI)

  const [USDExchangeRateETH, setUSDExchangeRateETH] = useState(4000)
  const [USDExchangeRateSelectedToken, setUSDExchangeRateSelectedToken] = useState()
  const [dollarPriceMike, setDollarPriceMike] = useState()
  const [dollarPriceTuba, setDollarPriceTuba] = useState()
  
  const ready = () => {

    // console.log({
    //   account,
    //   allowanceMIKE,
    //   allowanceTUBA,
    //   allowanceSelectedToken,
    //   selectedTokenSymbol,
    //   balanceETH,
    //   balanceMIKE, 
    //   balanceTUBA,
    //   reserveMIKEETHTuba: reserveTUBAETH,
    //   reserveMIKEETH: amountFormatter(reserveMIKEETH, 18, 2),
    //   reserveMIKE: amountFormatter(reserveMIKE, 18, 2),
    //   USDExchangeRateETH,
    //   USDExchangeRateSelectedToken,
    // })
    if (process.env.REACT_APP_ENABLED !== "true") {
      return false
    }

    return !!(
      (account === null || allowanceTUBA) &&  
      (account === null || allowanceMIKE) &&
      (selectedTokenSymbol === 'ETH' || account === null || allowanceSelectedToken) &&
      (account === null || balanceETH) &&
      (account === null || balanceMIKE) &&
      (account === null || balanceTUBA) &&
      (account === null || balanceSelectedToken) &&
      reserveTUBAETH &&
      reserveMIKEETH &&
      reserveMIKE &&
      // (selectedTokenSymbol === 'ETH' || reserveSelectedTokenETH) &&
      // (selectedTokenSymbol === 'ETH' || reserveSelectedTokenToken) &&
      selectedTokenSymbol &&
      (USDExchangeRateETH || USDExchangeRateSelectedToken)
    )

  };

  async function fetchYesterdayPricesAndSetState() {
    if (!state.ethUsdExchangeRate || process.env.REACT_APP_ENABLED !== "true" ) return

    const allYesterdayPrices = await getYesterdayPrices()
    const mappedPrices = allYesterdayPrices && allYesterdayPrices.map(yp => yp.data) || []

    // If yesterday prices haven't been updated today, update them
    const promises = []
    const tsNow = +new Date
    const todayDay = new Date(tsNow).getUTCDate()

    const mikeId = '101'
    const tubaId = '102'
    
    for (let i = 0; i < mappedPrices.length; i++) {
      const isMike = mappedPrices[i].ticker === 'mike'
      const id = isMike ? mikeId : tubaId
      const ts = mappedPrices[i].lastUpdated
      const lastUpdatedDay = new Date(ts).getUTCDate()

      if (lastUpdatedDay !== todayDay) {
        const promise = new Promise((resolve, reject) => {
          const eth = parseFloat(amountFormatter(isMike ? reserveMIKEETH : reserveTUBAETH))
          const token = parseFloat(amountFormatter(isMike ? reserveMIKE : reserveTUBA))
          const k = eth * token
          const ethValue = ((k / (token - 1)) - eth) * 1.01
          const price = ethValue * state.ethUsdExchangeRate
          const data = {
            price,
            lastUpdated: tsNow,
          }
          setYesterdayPrice(id, data).then(() => {
            resolve(() => {
              mappedPrices[i].price = price
            })
          }).catch((err) => reject(err))
        })
        promises.push(promise)
      }
    }

    Promise.all(promises)

    setState({ ...state, yesterdayPrices: mappedPrices })
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [team, leaderboard, orderstatus])

  useEffect(() => {
    if (dollarPriceMike && dollarPriceTuba && state.yesterdayPrices.length < 2) {
      (async () => {
        fetchYesterdayPricesAndSetState()
      })()
    }
  }, [dollarPriceMike, dollarPriceTuba])

  useEffect(() => {
    const tokenBalances = [
      {
        name: 'mike',
        balance: balanceMIKE,
      },
      {
        name: 'tuba',
        balance: balanceTUBA,
      }
    ]
    setState({ ...state, tokenBalances })
  }, [balanceMIKE, balanceTUBA])

  useEffect(() => {
    (async () => {
      const ethusd = await getETHUSDValue()

      setState({ ...state, ethUsdExchangeRate: ethusd })
    })()  
  }, [dollarPriceMike, dollarPriceTuba])

  useEffect(() => {
    const tokenTotalSupplies= [
      {
        name: 'mike',
        supply: totalSupplyMIKE,
      },
      {
        name: 'tuba',
        supply: totalSupplyTUBA,
      }
    ]
    setState({ ...state, tokenTotalSupplies })
  }, [totalSupplyMIKE, totalSupplyTUBA])

  useEffect(() => {
    const tokenReserves = [
      {
        name: 'mike',
        reserve: reserveMIKE,
      },
      {
        name: 'tuba',
        reserve: reserveTUBA,
      }
    ]
    setState({ ...state, tokenReserves })
  }, [reserveMIKE, reserveTUBA])

  // useEffect(() => {
  //   try {
  //     const exchangeRateDAI = getExchangeRate(reserveDAIETH, reserveDAIToken)

  //     if (selectedTokenSymbol === TOKEN_SYMBOLS.ETH) {
  //       // setUSDExchangeRateETH(exchangeRateDAI)
  //     } else {
  //       const exchangeRateSelectedToken = getExchangeRate(reserveSelectedTokenETH, reserveSelectedTokenToken)
  //       if (exchangeRateDAI && exchangeRateSelectedToken) {
  //         // setUSDExchangeRateSelectedToken(
  //         //   exchangeRateDAI
  //         //     .mul(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(18)))
  //         //     .div(exchangeRateSelectedToken)
  //         // )
  //       }
  //     }
  //   } catch {
  //     // setUSDExchangeRateETH()
  //     // setUSDExchangeRateSelectedToken()
  //   }
  // }, [reserveDAIETH, reserveDAIToken, reserveSelectedTokenETH, reserveSelectedTokenToken, selectedTokenSymbol])

  // function toPriceFormat(amount) {
  //   return amount.to
  // }

  function _dollarize(amount, exchangeRate) {
    return amount.mul(exchangeRate).div(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(18)))
  }

  function dollarize(amount) {
    return _dollarize(
      amount,
      selectedTokenSymbol === TOKEN_SYMBOLS.ETH ? USDExchangeRateETH : USDExchangeRateSelectedToken
    )
  }

  useEffect(() => {
    if (!reserveMIKEETH || !reserveTUBAETH || !reserveMIKE || !reserveTUBA) return

    async function fetchPrice () {
      // const factoryContract = getContract(TOKEN_ADDRESSES.FACTORY, FACTORY_ABI, library, account)

      // const poolMike = await factoryContract.getPool(TOKEN_ADDRESSES.MIKE, TOKEN_ADDRESSES.ETH, ethers.BigNumber.from(10000))
      // const poolContractMike = getContract(poolMike, POOL_ABI, library, account)
      // const poolBalanceMike = await poolContractMike.functions.slot0.call()
      // // const sqrtPriceX96Mike = poolBalanceMike[0]

      // const liquidity = await poolContractMike.functions.liquidity.call()
      // const y = liquidity[0]
      // console.log(amountFormatter(y, 18, 8))
      
      // const poolTuba = await factoryContract.getPool(TOKEN_ADDRESSES.TUBA, TOKEN_ADDRESSES.ETH, ethers.BigNumber.from(10000))
      // const poolContractTuba = getContract(poolTuba, POOL_ABI, library, account)
      // const poolBalanceTuba = await poolContractTuba.functions.slot0.call()
      // const sqrtPriceX96Tuba = poolBalanceTuba[0]

      const ETHUSD = state.ethUsdExchangeRate

      if (!ETHUSD) return

      const sixteenZeros = "0".repeat(16)

      // console.log("ETHUSD", ETHUSD)
      // console.log("TUBA:", (sqrtPriceX96Tuba * sqrtPriceX96Tuba* (1*10**(18))/(1*10**(18))/2 ** 192) * ETHUSD)
      
      //let priceMike = ((sqrtPriceX96Mike * sqrtPriceX96Mike * (1*10**(18))/(1*10**(18))/2 ** 192) * ETHUSD).toFixed(2)

      let priceMike = (reserveMIKEETH / reserveMIKE * ETHUSD).toFixed(2)
      priceMike = parseInt(parseFloat(priceMike) * 100)
      priceMike += sixteenZeros

      //let priceTuba = ((sqrtPriceX96Tuba * sqrtPriceX96Tuba * (1*10**(18))/(1*10**(18))/2 ** 192) * ETHUSD).toFixed(2)
      let priceTuba = (reserveTUBAETH / reserveTUBA * ETHUSD).toFixed(2)
      priceTuba = parseInt(parseFloat(priceTuba) * 100)
      priceTuba += sixteenZeros

      const tokenDollarPrices = [
        {
          name: 'mike',
          price: ethers.BigNumber.from(priceMike),
        },
        {
          name: 'tuba',
          price: ethers.BigNumber.from(priceTuba),
        }
      ]

      const ethMike = parseFloat(amountFormatter(reserveMIKEETH))
      const ethTuba = parseFloat(amountFormatter(reserveTUBAETH))
      const tokenMike = parseFloat(amountFormatter(reserveMIKE))
      const tokenTuba = parseFloat(amountFormatter(reserveTUBA))
      const kMike = ethMike * tokenMike
      const kTuba = ethTuba * tokenTuba
      
      const ethValueMike = ((kMike / (tokenMike - 1)) - ethMike) * 1.01
      const ethValueTuba = ((kTuba / (tokenTuba - 1)) - ethTuba) * 1.01

      const lbPriceMike = ethValueMike * state.ethUsdExchangeRate
      const lbPriceTuba = ethValueTuba * state.ethUsdExchangeRate

      const tokenDollarPricesLeaderboard = [
        lbPriceMike, lbPriceTuba
      ]

      setState({ ...state, tokenDollarPrices, tokenDollarPricesLeaderboard })

      setDollarPriceMike(ethers.BigNumber.from(priceMike))
      setDollarPriceTuba(ethers.BigNumber.from(priceTuba))
    }
    fetchPrice()
  }, [USDExchangeRateETH, reserveMIKEETH, reserveMIKE, reserveTUBA, reserveTUBAETH])

  async function unlock(buying = true, type) {
    const contract = buying ? tokenContractSelectedToken : tokenContractMIKE;
    const spenderAddress = buying ? exchangeContractSelectedToken.address : exchangeContractMIKE.address

    const contractTuba = buying ? tokenContractSelectedToken : tokenContractTUBA
    const spenderAddressTuba = buying ? exchangeContractSelectedToken.address : exchangeContractTUBA.address

    const estimatedGasLimit = await contract.estimateGas.approve(TOKEN_ADDRESSES.CC_ROUTER, ethers.constants.MaxUint256)
    const estimatedGasPrice = await library
      .getGasPrice()
      .then(gasPrice => gasPrice.mul(ethers.BigNumber.from(150)).div(ethers.BigNumber.from(100)))

    if (type === "tuba") {
      const estimatedGasLimitTuba = await contractTuba.estimateGas.approve(TOKEN_ADDRESSES.CC_ROUTER, ethers.constants.MaxUint256)
      return contractTuba.approve(TOKEN_ADDRESSES.CC_ROUTER, ethers.constants.MaxUint256, {
        gasLimit: calculateGasMargin(estimatedGasLimitTuba, GAS_MARGIN),
        gasPrice: estimatedGasPrice
      })
    }

    return contract.approve(TOKEN_ADDRESSES.CC_ROUTER, ethers.constants.MaxUint256, {
      gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN),
      gasPrice: estimatedGasPrice
    })
  }

  // buy functionality
  const validateBuy = useCallback(
    (numberOfSOCKS, valueInEth) => {
      // validate passed amount
      let parsedValue
      try {
        parsedValue = ethers.utils.parseUnits(numberOfSOCKS, 18)
      } catch (error) {
        error.code = ERROR_CODES.INVALID_AMOUNT
        throw error
      }

      // let requiredValueInSelectedToken
      // try {
      //   requiredValueInSelectedToken = calculateAmount(
      //     selectedTokenSymbol,
      //     TOKEN_SYMBOLS.MIKE,
      //     parsedValue,
      //     reserveMIKEETH,
      //     reserveMIKE,
      //     reserveSelectedTokenETH,
      //     reserveSelectedTokenToken
      //   )
      // } catch (error) {
      //   error.code = ERROR_CODES.INVALID_TRADE
      //   throw error
      // }

      const valueInEthParsed = state.currentSelectionEthValue
      const valueInEthStringified = parseInt(valueInEthParsed * 10 ** 18).toString()
      const valueInEthBN = ethers.BigNumber.from(valueInEthStringified)
      const reserveToken = state.selectedTicker === 'mike' ? reserveMIKE : reserveTUBA
      


      // the following are 'non-breaking' errors that will still return the data
      let errorAccumulator
      // validate minimum ether balance
      // if (balanceETH && balanceETH.lt(ethers.utils.parseEther('.00000000000001'))) {
      //   const error = Error()
      //   error.code = ERROR_CODES.INSUFFICIENT_ETH_GAS
      //   console.log("1")
      //   if (!errorAccumulator) {
      //     errorAccumulator = error
      //   }
      // }

      // validate minimum eth balance
      if (balanceETH && valueInEthBN && balanceETH.lt(valueInEthBN)) {
        const error = Error()
        error.code = ERROR_CODES.INSUFFICIENT_ETH
        if (!errorAccumulator) {
          errorAccumulator = error
        }
      }

      // validate price impact
      const maxPriceImpactPercentage = 15
      const token = parseFloat(amountFormatter(reserveToken))
      const priceImpactPercentage = parseFloat(numberOfSOCKS) / token * 100
      
      if (priceImpactPercentage >= maxPriceImpactPercentage) {
        const error = Error()
        error.code = ERROR_CODES.PRICE_IMPACT_TOO_HIGH
        if (!errorAccumulator) {
          errorAccumulator = error
        }
      }

      // validate max buy amount
      if (amountFormatter(parsedValue) > 1) {
        const error = Error()
        error.code = ERROR_CODES.INVALID_BUY_TOKEN_AMOUNT
        if (!errorAccumulator) {
          errorAccumulator = error
        }
      }

      // validate slippage
      if (amountFormatter(balanceETH,18,8) < valueInEthParsed * 1.15) {
        const error = Error()
        error.code = ERROR_CODES.NOT_ENOUGH_ETH_FOR_SLIPPAGE
        if (!errorAccumulator) {
          errorAccumulator = error
        }
      }
      
      return {
        inputValue: valueInEthBN,
        maximumInputValue: valueInEthBN,
        outputValue: parsedValue,
        error: errorAccumulator
      }
    },
    [
      allowanceSelectedToken,
      balanceETH,
      balanceSelectedToken,
      reserveMIKEETH,
      reserveMIKE,
      reserveSelectedTokenETH,
      reserveSelectedTokenToken,
      selectedTokenSymbol,
      state.currentSelectionEthValue
    ]
  )

  async function buy(maximumInputValue, outputValue, ticker) {
    if (process.env.REACT_APP_ENABLED !== "true") {
      return
    }
    const deadline = Math.ceil(Date.now() / 1000) + DEADLINE_FROM_NOW
    const tokenAddress = ticker === 'mike' ? TOKEN_ADDRESSES.MIKE : TOKEN_ADDRESSES.TUBA

    const requestedTokenAmount = parseFloat(outputValue)
    // When sending max eth we need to account for 15% slippage.
    // This is the same way Uniswap is sending eth. Unused eth will be refunded.
    const maxEthSent = amountFormatter(maximumInputValue, 18, 8) * 1.15
    const maxEthSentBN = ethers.BigNumber.from(parseInt(maxEthSent * 10 ** 18).toString())
    
    const paramsOut = {
      tokenIn: TOKEN_ADDRESSES.ETH,
      tokenOut: tokenAddress,
      fee: 10000,
      recipient: account,
      deadline: deadline.toString(),
      amountOut: requestedTokenAmount.toString(),
      amountInMaximum: maxEthSentBN,
      sqrtPriceLimitX96: ethers.BigNumber.from(0).toString()
    }
    
    const factoryContract = getContract(TOKEN_ADDRESSES.FACTORY, FACTORY_ABI, library, account)

    const CCRouterContract = getContract(TOKEN_ADDRESSES.CC_ROUTER, CCROUTER_ABI, library, account)

    // const poolMike = await factoryContract.getPool(TOKEN_ADDRESSES.MIKE, TOKEN_ADDRESSES.ETH, ethers.BigNumber.from(10000))
    // const poolContract = getContract(poolMike, POOL_ABI, library, account) 
    // const routerContract = getContract(TOKEN_ADDRESSES.ROUTER, EXCHANGE_ABI, library, account)

    const estimatedGasPrice = await library
      .getGasPrice()
      .then(gasPrice => gasPrice.mul(ethers.BigNumber.from(150)).div(ethers.BigNumber.from(100)))

    const bn = ethers.BigNumber.from((parseInt(requestedTokenAmount)).toString())

    const estimatedGasLimit = await CCRouterContract.estimateGas.convertEthToExactToken(
      bn, tokenAddress, deadline, {
      value: maxEthSentBN,
    });

    return CCRouterContract.convertEthToExactToken(bn, tokenAddress, deadline, {
      value: maxEthSentBN,
      gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN),
      gasPrice: estimatedGasPrice
    })
  }

  // sell functionality
  const validateSell = useCallback(
    (tokenInputAmount, ethOutputAmount, ticker) => {
      // validate passed amount
      let parsedValue
      try {
        parsedValue = ethers.utils.parseUnits(tokenInputAmount, 18)
      } catch (error) {
        error.code = ERROR_CODES.INVALID_AMOUNT
        throw error
      }

      const balance = ticker === 'mike' ? balanceMIKE : balanceTUBA
      const allowance = ticker === 'mike' ? allowanceMIKE : allowanceTUBA
      const reserveETH = ticker === 'mike' ? reserveMIKEETH : reserveTUBAETH
      const reserveToken = ticker === 'mike' ? reserveMIKE : reserveTUBA
      
      // the following are 'non-breaking' errors that will still return the data
      let errorAccumulator
      
      // validate minimum ether balance
      if (balanceETH.lt(ethers.utils.parseEther('.001'))) {
        const error = Error()
        error.code = ERROR_CODES.INSUFFICIENT_ETH_GAS
        if (!errorAccumulator) {
          errorAccumulator = error
        }
      }

      // validate minimum socks balance
      if (balance.lt(parsedValue)) {
        const error = Error()
        error.code = ERROR_CODES.INSUFFICIENT_SELECTED_TOKEN_BALANCE
        if (!errorAccumulator) {
          errorAccumulator = error
        }
      }

      // validate allowance
      if (allowance.lt(parsedValue)) {
        const error = Error()
        error.code = ERROR_CODES.INSUFFICIENT_ALLOWANCE
        if (!errorAccumulator) {
          errorAccumulator = error
        }
      }

      // validate price impact
      const maxPriceImpactPercentage = 15
      const eth = parseFloat(amountFormatter(reserveETH))
      const priceImpactPercentage = parseFloat(ethOutputAmount) / eth * 100
      
      if (priceImpactPercentage >= maxPriceImpactPercentage) {
        const error = Error()
        error.code = ERROR_CODES.PRICE_IMPACT_TOO_HIGH
        if (!errorAccumulator) {
          errorAccumulator = error
        }
      }

      // validate max sell amount
      if (amountFormatter(parsedValue) > 1) {
        const error = Error()
        error.code = ERROR_CODES.INVALID_SELL_TOKEN_AMOUNT
        if (!errorAccumulator) {
          errorAccumulator = error
        }
      }

      return {
        inputValue: parsedValue,
        minimumOutputValue: ethOutputAmount,
        error: errorAccumulator
      }
    },
    [
      allowanceMIKE,
      balanceETH,
      balanceMIKE,
      reserveMIKEETH,
      reserveMIKE,
      allowanceTUBA,
      balanceTUBA,
      reserveTUBAETH,
      reserveTUBA,
      reserveSelectedTokenETH,
      reserveSelectedTokenToken,
      selectedTokenSymbol,
    ]
  )

  async function sell(inputValue, minimumOutputValue, ticker) {
    if (process.env.REACT_APP_ENABLED !== "true") {
      return
    }
    const deadline = Math.ceil(Date.now() / 1000) + DEADLINE_FROM_NOW
    const tokenAddress = ticker === 'mike' ? TOKEN_ADDRESSES.MIKE : TOKEN_ADDRESSES.TUBA
    
    const min = parseInt(minimumOutputValue*10**18*0.8)
    
    const paramsOut = {
      tokenIn: tokenAddress,
      tokenOut: TOKEN_ADDRESSES.ETH,
      fee: 10000,
      recipient: account,
      deadline: deadline.toString(),
      amountIn: inputValue,
      amountOutMinimum: ethers.BigNumber.from(min.toString()),
      sqrtPriceLimitX96: ethers.BigNumber.from(0).toString()
    }
    
    const estimatedGasPrice = await library
      .getGasPrice()
      .then(gasPrice => gasPrice.mul(ethers.BigNumber.from(150)).div(ethers.BigNumber.from(100)))
    
    // const estimatedGasLimit = await routerContract.estimateGas.exactInputSingle(paramsOut)

    const CCRouterContract = getContract(TOKEN_ADDRESSES.CC_ROUTER, CCROUTER_ABI, library, account)

    const bnMinEth = ethers.BigNumber.from(min.toString())
      //   const estimatedGasLimit = await routerContract.estimateGas
      // .exactInputSingle(paramsOut, { value: 0 });

    const estimatedGasLimit = await CCRouterContract.estimateGas
      .convertExactTokenToEth(inputValue, 0, tokenAddress, deadline, { value: 0 });
      
    return CCRouterContract.convertExactTokenToEth(inputValue, 0, tokenAddress, deadline,
      {
        value: 0,
        gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN),
        gasPrice: estimatedGasPrice
      }
    )

    // return routerContract.exactInputSingle(paramsOut, {
    //   value: 0,
    //   gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN),
    //   gasPrice: estimatedGasPrice
    // })
  }

  async function unwrapWETH(amount) {
    const wethContract = getContract(TOKEN_ADDRESSES.ETH, WETH_ABI, library, account)

    const estimatedGasPrice = await library
      .getGasPrice()
      .then(gasPrice => gasPrice.mul(ethers.BigNumber.from(150)).div(ethers.BigNumber.from(100)))

    const estimatedGasLimit = await wethContract.estimateGas.withdraw(amount);

    // If requested amount is less than balance, unwrap all
    const amountToUnwrap = balanceWETH.lt(amount) ? balanceWETH : amount

    return wethContract.withdraw(amountToUnwrap, {
      value: 0,
      gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN),
      gasPrice: estimatedGasPrice
    })
  }

  async function burn(amount) {
    if (process.env.REACT_APP_ENABLED !== "true") {
      return
    }
    const parsedAmount = ethers.utils.parseUnits(amount, 18)

    const tokenContract = state.selectedTicker === 'mike' ? tokenContractMIKE : tokenContractTUBA;

    const estimatedGasPrice = await library
      .getGasPrice()
      .then(gasPrice => gasPrice.mul(ethers.BigNumber.from(150)).div(ethers.BigNumber.from(100)))

    const estimatedGasLimit = await tokenContract.estimateGas.burn(parsedAmount)

    return tokenContract.burn(parsedAmount, {
      gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN),
      gasPrice: estimatedGasPrice
    })
  }

  async function mintNft(ticker) {
    if (process.env.REACT_APP_ENABLED !== "true") {
      return
    }
    const selectedTicker = ticker || state.selectedTicker
    const tokenContract = selectedTicker === 'mike' ? tokenContractMIKE : tokenContractTUBA;

    const metadata_mike = "https://ipfs.io/ipfs/Qmd7WQ1SSrTebBtfbTD4sYHyFyUkqCN6RZJwb3cS8PSz1q?filename=ccmike_metadata.json";
    const metadata_tuba = "https://ipfs.io/ipfs/QmNZPovs2kfsXdkjhoGwiER1YLDocPbjBBsXdzYkqo36mX?filename=cctuba_metadata.json";
    const metadata =  selectedTicker === 'mike' ? metadata_mike : metadata_tuba

    const nftCallerContract = getContract(TOKEN_ADDRESSES.NFT_CALLER, NFT_CALLER_ABI, library, account)
    
    const estimatedGasPrice = await library
    .getGasPrice()
    .then(gasPrice => gasPrice.mul(ethers.BigNumber.from(150)).div(ethers.BigNumber.from(100)))

    const estimatedGasLimit = await nftCallerContract.estimateGas.mint(tokenContract.address, account, metadata)

    return nftCallerContract.mint(tokenContract.address, account, metadata, {
      gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN),
      gasPrice: estimatedGasPrice
    })
  }

  return team ? (
    <Team reserveTokenMike={reserveMIKE} totalSupply={totalSupplyMIKE} ready={ready()} balanceMIKE={balanceMIKE}/> ) : leaderboard ? (
    <Leaderboard dollarPriceMike={dollarPriceMike} dollarPriceTuba={dollarPriceTuba} reserveTokenMike={reserveMIKE} totalSupply={totalSupplyMIKE} ready={ready()} balanceMIKE={balanceMIKE}/> ): orderstatus ? (
    <OrderStatus ready={ready()}/> ) :(
    <Body
      selectedTokenSymbol={selectedTokenSymbol}
      setSelectedTokenSymbol={setSelectedTokenSymbol}
      ready={ready()}
      unlock={unlock}
      validateBuy={validateBuy}
      buy={buy}
      validateSell={validateSell}
      sell={sell}
      unwrap={unwrapWETH}
      burn={burn}
      mintNft={mintNft}
      dollarize={dollarize}
      dollarPriceMike={dollarPriceMike}
      dollarPriceTuba={dollarPriceTuba}
      balanceMIKE={balanceMIKE}
      balanceTUBA={balanceTUBA}
      balanceWETH={balanceWETH}
      reserveTokenMike={reserveMIKE}
      reserveTokenTuba={reserveTUBA}
      reserveMIKEETH={reserveMIKEETH}
      reserveTUBAETH={reserveTUBAETH}
      totalSupplyMike={totalSupplyMIKE}
      totalSupplyTuba={totalSupplyTUBA}
      
    />
  )
}
