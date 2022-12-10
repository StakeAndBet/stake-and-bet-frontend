import { Routes, Route, Link, useLocation } from "react-router-dom";
import {
  Title,
  Box,
  AppShell,
  Navbar,
  Header,
  NavLink,
  Flex,
  Footer,
  Aside,
} from "@mantine/core";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { getContract } from "@wagmi/core";
import { useSigner, erc20ABI } from "wagmi";
import StableSwap from "./pages/stable-swap";
import ManageBets from "./pages/manage-bets";
import Stacking from "./pages/stacking";
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

  // useEffect(() => {
  //   if (signer) {
  //     console.log("update signer", signer);
  //     betTokenContract.balanceOf(signer.getAddress()).then((balance) => {
  //       console.log("betTokenContract.balanceOf", balance.toString());
  //     });
  //   }
  // }, [signer]);
  return (
    <>
      {signer && (
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
                <ConnectButton />
              </Flex>
            </Header>
          }
        >
          <Box sx={{ paddingLeft: 10 }}>
            <Routes>
              <Route path="/" element={<h1>Home</h1>} />
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
                  />
                }
              />
            </Routes>
          </Box>
        </AppShell>
      )}
    </>
  );
}

export default Main;
