import * as React from 'react'

import { BigNumber, ethers, providers, utils } from 'ethers'
import { Initialization, API as OnboardApi, Wallet } from 'bnc-onboard/dist/src/interfaces'
import { TokenInfo, Tokens, tokensReducer } from './tokensReducer'
import { useEffect, useReducer, useState } from 'react'

import { Erc20Detailed } from './interfaces/Erc20Detailed'
import { Erc20DetailedFactory } from './interfaces/Erc20DetailedFactory'
import { useActiveWeb3React } from '../../../hooks'

export type OnboardConfig = Partial<Omit<Initialization, 'networkId'>>;

type EthGasStationSettings = 'fast' | 'fastest' | 'safeLow' | 'average';
type EtherchainGasSettings = 'safeLow' | 'standard' | 'fast' | 'fastest';

type TokenConfig = {
  address: string;
  name?: string;
  symbol?: string;
  imageUri?: string;
};

type TokensToWatch = {
  [networkId: number]: TokenConfig[];
};

type Web3ContextProps = {
  cacheWalletSelection?: boolean;
  checkNetwork?: boolean;
  children: React.ReactNode;
  ethGasStationApiKey?: string;
  gasPricePollingInterval?: number; //Seconds between gas price polls. Defaults to 0 - Disabled
  gasPriceSetting?: EthGasStationSettings | EtherchainGasSettings;
  networkIds?: number[];
  onboardConfig?: OnboardConfig;
  spenderAddress?: string;
  tokensToWatch?: TokensToWatch; // Network-keyed collection of token addresses to watch
};

type Web3Context = {
  address?: string;
  ethBalance?: number;
  gasPrice: number;
  isReady: boolean;
  isMobile: boolean;
  network?: number;
  onboard?: OnboardApi;
  provider?: providers.Web3Provider;
  wallet?: Wallet;
  tokens: Tokens;
  checkIsReady(): Promise<boolean>;
  refreshGasPrice(): Promise<void>;
  resetOnboard(): void;
  signMessage(message: string): Promise<string>;
};

const Web3Context = React.createContext<Web3Context | undefined>(undefined)

const Web3Provider = ({
                        children,
                        onboardConfig,
                        networkIds,
                        ethGasStationApiKey,
                        gasPricePollingInterval = 0,
                        gasPriceSetting = 'fast',
                        tokensToWatch,
                        spenderAddress,
                        cacheWalletSelection = true,
                        checkNetwork = (networkIds && networkIds.length > 0) || false
                      }: Web3ContextProps) => {
  const [address, setAddress] = useState<string | undefined>(undefined)
  const [provider, setProvider] = useState<providers.Web3Provider | undefined>(undefined)
  const { chainId, account, library, connector } = useActiveWeb3React()

  const [network, setNetwork] = useState<number | undefined>(undefined)
  const [ethBalance, setEthBalance] = useState<number | undefined>(undefined)
  const [wallet, setWallet] = useState<Wallet | undefined>(undefined)
  const [isReady, setIsReady] = useState<boolean>(false)
  const [tokens, tokensDispatch] = useReducer(tokensReducer, {})
  const [gasPrice, setGasPrice] = useState(0)

  const refreshInfo = async () => {
    if (account) {
      setAddress(account)
      setNetwork(Number(chainId))
      if (library) {
        setProvider(library)
      }
      let networkName = ''
      switch (String(Number(chainId))) {
        case '1':
          networkName = 'Main'
          break
        case '2':
          networkName = 'Morden'
          break
        case '3':
          networkName = 'Ropsten'
          break
        case '4':
          networkName = 'Rinkeby'
          break
        case '42':
          networkName = 'Kovan'
          break
        case '43113':
          networkName = 'FUJI'
          break
        default:
          networkName = 'Unknown'
      }
      setWallet({
        name: networkName,
        provider: library,
        type: 'injected'
      })
      setIsReady(!!account)
      setEthBalance(0)
    }
  }

  useEffect(() => {
    refreshInfo().catch()
  }, [chainId, account, library, connector])

  // Gas Price poller
  useEffect(() => {
    let poller: NodeJS.Timeout
    if (network === 1 && gasPricePollingInterval > 0) {
      refreshGasPrice()
      poller = setInterval(refreshGasPrice, gasPricePollingInterval * 1000)
    } else {
      setGasPrice(10)
    }
    return () => {
      if (poller) {
        clearInterval(poller)
      }
    }
  }, [network])

  // Token balance and allowance listener
  // TODO: Allowance check not needed unless target is specificed
  useEffect(() => {
    const checkBalanceAndAllowance = async (
      token: Erc20Detailed,
      decimals: number
    ) => {
      if (address) {
        const balance = Number(
          utils.formatUnits(
            BigNumber.from(await token.balanceOf(address)),
            decimals
          )
        )
        var spenderAllowance = 0
        if (spenderAddress) {
          spenderAllowance = Number(
            utils.formatUnits(
              BigNumber.from(await token.balanceOf(address)),
              decimals
            )
          )
        }

        tokensDispatch({
          type: 'updateTokenBalanceAllowance',
          payload: {
            id: token.address,
            spenderAllowance: spenderAllowance,
            balance: balance
          }
        })
      }
    }

    const networkTokens =
      (tokensToWatch && network && tokensToWatch[network]) || []

    let tokenContracts: Array<Erc20Detailed> = []
    if (provider && address && networkTokens.length > 0) {
      networkTokens.forEach(async (token) => {
        const signer = await provider.getSigner()
        const tokenContract = Erc20DetailedFactory.connect(
          token.address,
          signer
        )

        const newTokenInfo: TokenInfo = {
          decimals: 0,
          balance: 0,
          imageUri: token.imageUri,
          name: token.name,
          symbol: token.symbol,
          spenderAllowance: 0,
          allowance: tokenContract.allowance,
          approve: tokenContract.approve,
          transfer: tokenContract.transfer
        }

        if (!token.name) {
          try {
            const tokenName = await tokenContract.name()
            newTokenInfo.name = tokenName
          } catch (error) {
            console.log(
              'There was an error getting the token name. Does this contract implement ERC20Detailed?'
            )
          }
        }
        if (!token.symbol) {
          try {
            const tokenSymbol = await tokenContract.symbol()
            newTokenInfo.symbol = tokenSymbol
          } catch (error) {
            console.error(
              'There was an error getting the token symbol. Does this contract implement ERC20Detailed?'
            )
          }
        }

        try {
          const tokenDecimals = await tokenContract.decimals()
          newTokenInfo.decimals = tokenDecimals
        } catch (error) {
          console.error(
            'There was an error getting the token decimals. Does this contract implement ERC20Detailed?'
          )
        }

        tokensDispatch({
          type: 'addToken',
          payload: { id: token.address, token: newTokenInfo }
        })

        checkBalanceAndAllowance(tokenContract, newTokenInfo.decimals)

        // This filter is intentionally left quite loose.
        const filterTokenApproval = tokenContract.filters.Approval(
          address,
          null,
          null
        )
        const filterTokenTransferFrom = tokenContract.filters.Transfer(
          address,
          null,
          null
        )
        const filterTokenTransferTo = tokenContract.filters.Transfer(
          null,
          address,
          null
        )

        tokenContract.on(filterTokenApproval, () =>
          checkBalanceAndAllowance(tokenContract, newTokenInfo.decimals)
        )
        tokenContract.on(filterTokenTransferFrom, () =>
          checkBalanceAndAllowance(tokenContract, newTokenInfo.decimals)
        )
        tokenContract.on(filterTokenTransferTo, () =>
          checkBalanceAndAllowance(tokenContract, newTokenInfo.decimals)
        )
        tokenContracts.push(tokenContract)
      })
    }
    return () => {
      if (tokenContracts.length > 0) {
        tokenContracts.forEach((tc) => {
          tc.removeAllListeners()
        })
        tokenContracts = []
        tokensDispatch({ type: 'resetTokens' })
      }
    }
  }, [network, provider, address])

  const checkIsReady = async () => {
    return !!address
  }

  const signMessage = async (message: string) => {
    if (!provider) return Promise.reject('The provider is not yet initialized')

    const data = ethers.utils.toUtf8Bytes(message)
    const signer = await provider.getSigner()
    const addr = await signer.getAddress()
    const sig = await provider.send('personal_sign', [
      ethers.utils.hexlify(data),
      addr.toLowerCase()
    ])
    return sig
  }

  const resetOnboard = () => {
    setIsReady(false)
    refreshInfo().catch(console.error)
  }

  const refreshGasPrice = async () => {
    try {
      let gasPrice
      if (ethGasStationApiKey) {
        const ethGasStationResponse = await (
          await fetch(
            `https://ethgasstation.info/api/ethgasAPI.json?api-key=${ethGasStationApiKey}`
          )
        ).json()
        gasPrice = ethGasStationResponse[gasPriceSetting] / 10
      } else {
        const etherchainResponse = await (
          await fetch('https://www.etherchain.org/api/gasPriceOracle')
        ).json()
        gasPrice = Number(etherchainResponse[gasPriceSetting])
      }

      const newGasPrice = !isNaN(Number(gasPrice)) ? Number(gasPrice) : 65
      setGasPrice(newGasPrice)
    } catch (error) {
      console.log(error)
      console.log('Using 65 gwei as default')
      setGasPrice(65)
    }
  }

  return (
    <Web3Context.Provider
      value={{
        address: address,
        provider,
        network: network,
        ethBalance: ethBalance,
        wallet: wallet,
        onboard: undefined,
        isReady: isReady,
        checkIsReady,
        resetOnboard,
        gasPrice,
        refreshGasPrice,
        isMobile: false,
        tokens: tokens,
        signMessage
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

const useWeb3 = () => {
  const context = React.useContext(Web3Context)
  if (context === undefined) {
    throw new Error('useOnboard must be used within a OnboardProvider')
  }
  return context
}

export { Web3Provider, useWeb3 }
