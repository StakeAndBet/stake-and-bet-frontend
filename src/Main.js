import { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import {
  Title,
  Box,
  AppShell,
  Navbar,
  Header,
  NavLink,
  Flex,
} from "@mantine/core";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { getContract } from "@wagmi/core";
import { useProvider, useSigner, erc20ABI } from "wagmi";
import StableSwap from "./pages/stable-swap";
import ManageBets from "./pages/manage-bets";
import Stacking from "./pages/stacking";
import ClaimRewardsButton from "./components/claim-rewards-button";

import {
  BET_TOKEN_ABI,
  BET_STABLE_SWAP_ABI,
  BET_MANAGER_ABI,
  BET_POOL_ABI,
} from "./ressources/abi";
import { useEffect } from "react";

function Main() {
  // Get env vars
  const BET_TOKEN = process.env.REACT_APP_BET_TOKEN;
  const BET_STABLE_SWAP = process.env.REACT_APP_BET_STABLE_SWAP;
  const STABLE_TOKEN = process.env.REACT_APP_STABLE_TOKEN;
  const BET_MANAGER = process.env.REACT_APP_BET_MANAGER;
  const BET_POOL = process.env.REACT_APP_BET_POOL;

  // Get current location
  const location = useLocation();

  // Get signer
  const { data: signer, isError, isLoading } = useSigner();
  const { data: provider } = useProvider();

  // Instantiate contracts
  const betTokenContract = getContract({
    address: BET_TOKEN,
    abi: BET_TOKEN_ABI,
    signerOrProvider: signer,
  });
  const betStableSwapContract = getContract({
    address: BET_STABLE_SWAP,
    abi: BET_STABLE_SWAP_ABI,
    signerOrProvider: signer,
  });
  const stableTokenContract = getContract({
    address: STABLE_TOKEN,
    abi: erc20ABI,
    signerOrProvider: signer,
  });
  const betManagerContract = getContract({
    address: BET_MANAGER,
    abi: BET_MANAGER_ABI,
    signerOrProvider: signer,
  });
  const betPoolContract = getContract({
    address: BET_POOL,
    abi: BET_POOL_ABI,
    signerOrProvider: signer,
  });

  // State variables
  const [betTokenBalance, setBetTokenBalance] = useState(0);
  const [betTokensToClaimFromBetManager, setBetTokensToClaimFromBetManager] =
    useState(0);
  const [betTokensToClaimFromBetPool, setBetTokensToClaimFromBetPool] =
    useState(0);

  // Fetch user token balance
  useEffect(() => {
    if (signer) {
      var subscriptions = [];
      const provider = signer.provider;

      // Fetch bet token balance on each block
      subscriptions.push(
        provider.on("block", async (block) => {
          betTokenContract.balanceOf(signer.getAddress()).then((balance) => {
            setBetTokenBalance(balance);
          });
        })
      );

      // Fetch bet rewards to claim on each block
      subscriptions.push(
        provider.on("block", async (block) => {
          betManagerContract
            .getTokenToClaim(signer.getAddress())
            .then((tokensToClaim) => {
              setBetTokensToClaimFromBetManager(tokensToClaim);
            });
        })
      );

      // Fetch stacking rewards to claim on each block
      subscriptions.push(
        provider.on("block", async (block) => {
          betPoolContract.earned(signer.getAddress()).then((tokensToClaim) => {
            setBetTokensToClaimFromBetPool(tokensToClaim);
          });
        })
      );

      return () => {
        subscriptions.forEach((subscription) =>
          subscription.removeAllListeners()
        );
      };
    }
  }, [signer]);

  return (
    <>
      <AppShell
        padding="md"
        navbar={
          <Navbar width={{ base: 200 }} p="xs">
            <Navbar.Section>
              <NavLink
                label="Home"
                component={Link}
                to="/"
                active={location.pathname === "/"}
              />
            </Navbar.Section>
            <Navbar.Section>
              <NavLink
                label="Swap Tokens"
                component={Link}
                to="/stable-swap"
                active={location.pathname === "/stable-swap"}
              />
            </Navbar.Section>
            <Navbar.Section>
              <NavLink
                label="Manage Bets"
                component={Link}
                to="/manage-bets"
                active={location.pathname === "/manage-bets"}
              />
            </Navbar.Section>
            <Navbar.Section>
              <NavLink
                label="Stacking"
                component={Link}
                to="/stacking"
                active={location.pathname === "/stacking"}
              />
            </Navbar.Section>
          </Navbar>
        }
        header={
          <Header height={60} p="xs">
            <Flex
              justify="space-between"
              align="center"
              direction="row"
              wrap="nowrap"
            >
              <Title order={1}>Stake & Bet</Title>
              {signer && (
                <ClaimRewardsButton
                  signer={signer}
                  betManagerContract={betManagerContract}
                  betPoolContract={betPoolContract}
                  betTokensToClaimFromBetManager={
                    betTokensToClaimFromBetManager
                  }
                  betTokensToClaimFromBetPool={betTokensToClaimFromBetPool}
                />)}
              <ConnectButton />
            </Flex>
          </Header>
        }
      >
        {signer ? (
          <Box sx={{ paddingLeft: 10 }}>
            <Routes>
              <Route path="/" element=
                {<>
                <h2>Welcome !</h2>
                  <Box sx={(theme) => ({
                  backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                  textAlign: 'left',
                  padding: theme.spacing.xl,
                  borderRadius: theme.radius.md,
                  cursor: 'pointer',
                  margin: '10px 0px',
                  '&:hover': {
                    backgroundColor:
                      theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1],
                  },
              })}> Every day earn rewards while your cryto influencers do the job on Twitter !<br></br>
                You bet on the number of their daily tweets.
                
                  <h4>How does it work ?</h4>
                You buy our in house betting chip: SAB, an ERC-20 Token.<br></br>
                You can directly BET on today's topic.<br></br>
                <br></br>
                Anyway, you'll get the result after ONE day.<br></br>
                Simple isn't it ?<br></br>
                <br></br>
                If you want to go further just stake your SAB on the DApp and you'll get your rewards.
                </Box>
                <Box sx={(theme) => ({
                  backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                  textAlign: 'left',
                  padding: theme.spacing.xl,
                  borderRadius: theme.radius.md,
                  cursor: 'pointer',
                  margin: '10px 0px',
                  '&:hover': {
                    backgroundColor:
                      theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1],
                  },
                })}><h4>Swap Token</h4>
                  To use the service you need to buy the SAB Token.  <br></br>
                  We currently only support DAI.

                  <h4>Bet</h4>
                  Consult the Bet of the day on the BET section. <br></br>
                  1 - Guess your number Tweets. <br></br>
                  2 - Lay your wager in SAB. <br></br>
                  3 - Click on the ADD BET button. <br></br>
                  The winners will share the Prize Pool based on their wager weight.  <br></br>

                  <h4>Stake</h4>
                  Stake your SAB and get rewarded.<br></br>
                  Fluid Staking !<br></br>

                  <h4>Terms & conditions</h4>
                  The Stake & Bet service will take a 10% Fee on each bet.<br></br>
                  All operations are secured on chain.<br></br>


                </Box>
                </>} />
              <Route
                path="stable-swap"
                element={
                  <StableSwap
                    signer={signer}
                    betTokenContract={betTokenContract}
                    betStableSwapContract={betStableSwapContract}
                    stableTokenContract={stableTokenContract}
                  />
                }
              />
              <Route
                path="manage-bets"
                element={
                  <ManageBets
                    signer={signer}
                    betTokenContract={betTokenContract}
                    betManagerContract={betManagerContract}
                    betTokenBalance={betTokenBalance}
                  />
                }
              />
              <Route
                path="stacking"
                element={
                  <Stacking
                    signer={signer}
                    betTokenContract={betTokenContract}
                    betPoolContract={betPoolContract}
                    betTokenBalance={betTokenBalance}
                    betTokensToClaimFromBetPool={betTokensToClaimFromBetPool}
                  />
                }
              />
            </Routes>
          </Box>
        ) : (<Box sx={(theme) => ({
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
          textAlign: 'center',
          padding: theme.spacing.xl,
          borderRadius: theme.radius.md,
          cursor: 'pointer',

          '&:hover': {
            backgroundColor:
              theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1],
          },
        })}> Please connect your wallet</Box>)}
      </AppShell>
    </>
  );
}

export default Main;
