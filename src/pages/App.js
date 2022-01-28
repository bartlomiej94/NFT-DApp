import React from 'react'
import Web3Provider, { Connectors } from 'web3-react'
import WalletConnectApi from '@walletconnect/web3-subprovider'
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom'
import { useIdleTimer } from 'react-idle-timer'

import GlobalStyle, { ThemeProvider } from '../theme'
import Web3ReactManager from '../components/Web3ReactManager'
import AppProvider from '../context'
import Main from './Main'
import Idle from './Idle/Idle'

const PROVIDER_URL = process.env.REACT_APP_PROVIDER_URL

const { NetworkOnlyConnector, InjectedConnector, WalletConnectConnector } = Connectors
const Network = new NetworkOnlyConnector({
  providerURL: PROVIDER_URL
})
const Injected = new InjectedConnector({ supportedNetworks: [1, 3, 4] })
const WalletConnect = new WalletConnectConnector({
  api: WalletConnectApi,
  bridge: 'https://bridge.walletconnect.org',
  supportedNetworkURLs: {
    1: PROVIDER_URL,
    3: PROVIDER_URL,
    4: PROVIDER_URL,
  },
  defaultNetwork: 3
})
const connectors = { Network, Injected, WalletConnect }

export default function App() {
  const [idle, setIdle] = React.useState(false)
  
  const handleOnIdle = event => {
    setIdle(true)
  }
  
  const { getRemainingTime, getLastActiveTime } = useIdleTimer({
    timeout: 1000 * 60 * 2, // 2 minutes
    onIdle: handleOnIdle,
    debounce: 500
  })

  if (idle) return <Idle setIdle={setIdle} />

  return (
    <ThemeProvider>
      <>
        <GlobalStyle />
        <Web3Provider connectors={connectors} libraryName={'ethers.js'}>
          <Web3ReactManager>
            <AppProvider>
              <BrowserRouter>
                <Switch>
                  <Route exact strict path="/" render={() => <Main />} />  
                  <Route exact strict path="/stats" render={() => <Main stats />} />
                  {/* <Route exact strict path="/team" render={() => <Main team />} /> */}
                  <Route exact strict path="/leaderboard" render={() => <Main leaderboard />} />
                  <Route exact strict path="/orderstatus" render={() => <Main orderstatus />} />
                  <Redirect to="/" />
                </Switch>
              </BrowserRouter>
            </AppProvider>
          </Web3ReactManager>
        </Web3Provider>
      </>
    </ThemeProvider>
  )
}
