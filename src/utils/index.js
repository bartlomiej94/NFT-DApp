import { ethers } from 'ethers'
import axios from 'axios'

import ERC20_ABI from './erc20.json'
import FACTORY_ABI from './factory.json'

import {
  abi as EXCHANGE_ABI,
} from '@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json'

import UncheckedJsonRpcSigner from './signer'

// Ropsten
// const TUBA = "0x2f919cf12cB9c37cf110fC2B5926F2A9594C6421"
// const MIKE = "0xaADa87C3C56308064002f0850557B9524dAe8769"
const FACTORY_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984'
// const ROUTER_FACTORY_ADDRESS = '0xE592427A0AEce92De3Edee1F18E0157C05861564'
// const NFT_FACTORY_ADDRESS = '0xEe6184029119E9D290A599CEbEd732d72593E9A7'
// const CCROUTER_FACTORY_ADDRESS = '0x0dfb8FEbc561e70DDeD2bB9e168b4E12B9eB1e4a'

// Rinkeby
const MIKE = '0xC9ED3c68d59406a7C241495DF7aFD57Fc40607c0'
const TUBA = '0x6ED0E4980843297fDD7629D628d86E86A85BF91b'
const CCROUTER_FACTORY_ADDRESS = '0x9e492ccc75d0E86c7495F7A8443431b8bb07f1cE'
const NFT_CALLER_ADDRESS = '0x7b0273A53906A335321E591449920C4fD211d951'

export const TOKEN_ADDRESSES = {
  // ETH: 'ETH',
  ETH: '0xc778417E063141139Fce010982780140Aa0cD5Ab', // WETH | mainnet: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
  FACTORY: FACTORY_ADDRESS,
  // ROUTER: ROUTER_FACTORY_ADDRESS,
  CC_ROUTER: CCROUTER_FACTORY_ADDRESS,
  NFT_CALLER: NFT_CALLER_ADDRESS,
  TUBA: TUBA,
  MIKE: MIKE,
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
}

export const TOKEN_SYMBOLS = Object.keys(TOKEN_ADDRESSES).reduce((o, k) => {
  o[k] = k
  return o
}, {})

export const ERROR_CODES = [
  'INVALID_AMOUNT',
  'INVALID_TRADE',
  'INVALID_SELL_TOKEN_AMOUNT',
  'INVALID_BUY_TOKEN_AMOUNT',
  'INSUFFICIENT_ETH_GAS',
  'INSUFFICIENT_ETH',
  'INSUFFICIENT_ALLOWANCE',
  'PRICE_IMPACT_TOO_HIGH',
  'NOT_ENOUGH_ETH_FOR_SLIPPAGE',
].reduce((o, k, i) => {
  o[k] = i
  return o
}, {})

export const TRADE_TYPES = ['BUY', 'SELL', 'UNLOCK', 'REDEEM', 'MINT_NFT', 'UNWRAP', 'UNWRAP_ALL'].reduce((o, k, i) => {
  o[k] = i
  return o
}, {})

export function isAddress(value) {
  try {
    ethers.utils.getAddress(value)
    return true
  } catch {
    return false
  }
}

// account is optional
export function getProviderOrSigner(library, account) {
  return account ? new UncheckedJsonRpcSigner(library.getSigner(account)) : library
}

// account is optional
export function getContract(address, ABI, library, account) {
  if (!isAddress(address) || address === ethers.constants.AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }

  return new ethers.Contract(address, ABI, getProviderOrSigner(library, account))
}

export function getTokenContract(tokenAddress, library, account) {
  return getContract(tokenAddress, ERC20_ABI, library, account)
}

export function getExchangeContract(exchangeAddress, library, account) {
  return getContract(exchangeAddress, EXCHANGE_ABI, library, account)
}

export function getFactoryContract(library, account) {
  return getContract(FACTORY_ADDRESS, FACTORY_ABI, library, account)
}

export async function getTokenExchangeAddressFromFactory(tokenAddress, library, account, type) {
  const contract = getContract(FACTORY_ADDRESS, FACTORY_ABI, library, account);
  const pool = await contract.getPool(type === 'mike' ? MIKE : TUBA, TOKEN_ADDRESSES.ETH, ethers.BigNumber.from(10000))

  return pool
}

// get the ether balance of an address
export async function getEtherBalance(address, library) {
  if (!isAddress(address)) {
    throw Error(`Invalid 'address' parameter '${address}'`)
  }

  return library.getBalance(address)
}

// get the token balance of an address
export async function getTokenBalance(tokenAddress, address, library) {
  if (!isAddress(tokenAddress) || !isAddress(address)) {
    throw Error(`Invalid 'tokenAddress' or 'address' parameter '${tokenAddress}' or '${address}'.`)
  }

  return getContract(tokenAddress, ERC20_ABI, library).balanceOf(address)
}

export async function getTokenAllowance(address, tokenAddress, spenderAddress, library) {
  if (!isAddress(address) || !isAddress(tokenAddress) || !isAddress(spenderAddress)) {
    throw Error(
      "Invalid 'address' or 'tokenAddress' or 'spenderAddress' parameter" +
        `'${address}' or '${tokenAddress}' or '${spenderAddress}'.`
    )
  }

  return getContract(tokenAddress, ERC20_ABI, library).allowance(address, spenderAddress)
}

export function amountFormatter(amount, baseDecimals = 18, displayDecimals = 3, useLessThan = true) {
  if (baseDecimals > 18 || displayDecimals > 18 || displayDecimals > baseDecimals) {
    throw Error(`Invalid combination of baseDecimals '${baseDecimals}' and displayDecimals '${displayDecimals}.`)
  }

  // if balance is falsy, return undefined
  if (!amount) {
    return undefined
  }
  // // if amount is 0, return
  // else if (amount.isZero()) {
  //   return '0'
  // }
  // amount > 0
  else {
    // amount of 'wei' in 1 'ether'
    const baseAmount = ethers.BigNumber.from(10).pow(ethers.BigNumber.from(baseDecimals))

    const minimumDisplayAmount = baseAmount.div(
      ethers.BigNumber.from(10).pow(ethers.BigNumber.from(displayDecimals))
    )

    // if balance is less than the minimum display amount
    if (amount.lt(minimumDisplayAmount)) {
      return useLessThan
        ? `<${ethers.utils.formatUnits(minimumDisplayAmount, baseDecimals)}`
        : `${ethers.utils.formatUnits(amount, baseDecimals)}`
    }
    // if the balance is greater than the minimum display amount
    else {
      const stringAmount = ethers.utils.formatUnits(amount, baseDecimals)

      // if there isn't a decimal portion
      if (!stringAmount.match(/\./)) {
        return stringAmount
      }
      // if there is a decimal portion
      else {
        const [wholeComponent, decimalComponent] = stringAmount.split('.')
        const roundUpAmount = minimumDisplayAmount.div(ethers.constants.Two)
        const roundedDecimalComponent = ethers
          .BigNumber.from(decimalComponent.padEnd(baseDecimals, '0'))
          .add(roundUpAmount)
          .toString()
          .padStart(baseDecimals, '0')
          .substring(0, displayDecimals)

        // decimals are too small to show
        if (roundedDecimalComponent === '0'.repeat(displayDecimals)) {
          return wholeComponent
        }
        // decimals are not too small to show
        else {
          return `${wholeComponent}.${roundedDecimalComponent.toString().replace(/0*$/, '')}`
        }
      }
    }
  }
}

export async function getETHUSDValue() {
  axios.defaults.headers.post['Content-Type'] ='application/json;charset=utf-8';
  axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';

  return (await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')).data.ethereum.usd
}
