import "./App.css";
import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { MantineProvider } from "@mantine/core";
import { NotificationsProvider } from "@mantine/notifications";

import Main from "./Main";

const { chains, provider } = configureChains(
  [chain.mainnet, chain.goerli, chain.foundry],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "Stable & Bet App",
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
  storage: null,
});

const BET_TOKEN = process.env.REACT_APP_BET_TOKEN;
const BET_STABLE_SWAP = process.env.REACT_APP_BET_STABLE_SWAP;
const STABLE_TOKEN = process.env.REACT_APP_STABLE_TOKEN;
const BET_MANAGER = process.env.REACT_APP_BET_MANAGER;
const BET_POOL = process.env.REACT_APP_BET_POOL;

function App() {
  // Return error page if any of the required env vars are missing
  if (
    !BET_TOKEN ||
    !BET_STABLE_SWAP ||
    !STABLE_TOKEN ||
    !BET_MANAGER ||
    !BET_POOL
  ) {
    return (
      <>
        <h1>App not working as expected.</h1>
        <p>Please contact administrator</p>
      </>
    );
  }
  return (
    <MantineProvider
      theme={{ colorScheme: "dark" }}
      withGlobalStyles
      withNormalizeCSS
    >
      <NotificationsProvider>
        <WagmiConfig client={wagmiClient}>
          <RainbowKitProvider chains={chains} theme={darkTheme()}>
            <Main />
          </RainbowKitProvider>
        </WagmiConfig>
      </NotificationsProvider>
    </MantineProvider>
  );
}

export default App;
