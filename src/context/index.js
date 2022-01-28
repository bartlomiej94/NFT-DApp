import React, { useState, useContext } from 'react'

import { TRADE_TYPES } from '../utils'

export const AppContext = React.createContext([{}, () => {}])

const initialState = {
  visible: false,
  count: 1,
  valid: false,
  tradeType: TRADE_TYPES.BUY,
  selectedTicker: null,
  transactionTicker: null,
  transactionEthAmount: null,
  ethUsdExchangeRate: null,
  currentSelectionEthValue: null,
  mintingNftFromSidebar: false,
  lastTransactionStatus: null,
  lastTransactionEthOutput: null,
  lastTransactionDeadline: null,
  selectedTshirtSize: null,
  isTransactionPending: false,
  isLoadingWallet: false,
  isUnwrapping: false,
  formState: [],
  finalFormData: {},
  tokenDollarPricesLeaderboard: [],
  yesterdayPrices: [],
  tokenBalances: [],
  tokenDollarPrices: [],
  tokenTotalSupplies: [],
  tokenReserves: [],
  unclaimedNfts: [],
}

export default function AppProvider({ children }) {
  const [state, setState] = useState(initialState)

  return <AppContext.Provider value={[state, setState]}>{children}</AppContext.Provider>
}

export function useAppContext() {
  return useContext(AppContext)
}
