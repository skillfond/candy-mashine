import './App.css';
import { useMemo } from 'react';
import * as anchor from '@project-serum/anchor';
import Home from './Home';

import { clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  getPhantomWallet,
  getSlopeWallet,
  getSolflareWallet,
  getSolletWallet,
  getSolletExtensionWallet,
} from '@solana/wallet-adapter-wallets';

import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletDialogProvider } from '@solana/wallet-adapter-material-ui';

import { ThemeProvider, createTheme } from '@material-ui/core';

const theme = createTheme({
  palette: {
    type: 'dark',
    primary: {
      main: '#000'
    },
    secondary: {
			main: "#FFF",
		},
		background: {
			paper: "rgba(55,55,55, .6)",
		},
  },
  typography: {
    fontFamily: '"Brutal Type", sans-serif',
		h1: {
			fontFamily: '"Brutal Type", sans-serif',
		},
		h2: {
			fontFamily: '"Brutal Type", sans-serif',
		},
		h3: {
			fontFamily: '"Brutal Type", sans-serif',
		},
		h4: {
			fontFamily: '"Brutal Type", sans-serif',
		},
		h5: {
			fontFamily: '"Brutal Type", sans-serif',
		},
		h6: {
			fontFamily: '"Brutal Type", sans-serif',
		},
		body1: {
			fontFamily: '"Brutal Type", sans-serif',
		},
		body2: {
			fontFamily: '"Brutal Type", sans-serif',
		},
		caption: {
			fontFamily: '"Brutal Type", sans-serif',
		},
		subtitle1: {
			fontFamily: '"Brutal Type", sans-serif',
		},
		subtitle2: {
			fontFamily: '"Brutal Type", sans-serif',
		},
		button: {
			fontFamily: '"Brutal Type", sans-serif',
		},
	},
	breakpoints: {
		values: {
			xs: 0,
			sm: 600,
			md: 900,
			lg: 1200,
			xl: 1920,
		},
  },
  shape: {
    borderRadius: 0
  },
});

const getCandyMachineId = (): anchor.web3.PublicKey | undefined => {
  try {
    const candyMachineId = new anchor.web3.PublicKey(
      process.env.REACT_APP_CANDY_MACHINE_ID!,
    );

    return candyMachineId;
  } catch (e) {
    console.log('Failed to construct CandyMachineId', e);
    return undefined;
  }
};

const candyMachineId = getCandyMachineId();
const network = process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork;
const rpcHost = process.env.REACT_APP_SOLANA_RPC_HOST!;
const connection = new anchor.web3.Connection(rpcHost
  ? rpcHost
  : anchor.web3.clusterApiUrl('devnet'));

const startDateSeed = parseInt(process.env.REACT_APP_CANDY_START_DATE!, 10);
const txTimeoutInMilliseconds = 30000;

const App = () => {
  const endpoint = useMemo(() => clusterApiUrl(network), []);

  const wallets = useMemo(
    () => [
      getPhantomWallet(),
      getSolflareWallet(),
      getSlopeWallet(),
      getSolletWallet({ network }),
      getSolletExtensionWallet({ network }),
    ],
    [],
  );

  return (
    <ThemeProvider theme={theme}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletDialogProvider>
            <Home
              candyMachineId={candyMachineId}
              connection={connection}
              startDate={startDateSeed}
              txTimeout={txTimeoutInMilliseconds}
              rpcHost={rpcHost}
            />
          </WalletDialogProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ThemeProvider>
  );
};

export default App;
