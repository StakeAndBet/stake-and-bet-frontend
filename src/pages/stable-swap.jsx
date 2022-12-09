import { Button, Center, Group, NumberInput, Text } from "@mantine/core";
import { BET_TOKEN_ABI, BET_STABLE_SWAP_ABI } from "../ressources/abi";
import {
  erc20ABI,
  useAccount,
  useContract,
  useContractRead,
  usePrepareContractWrite,
  useContractWrite,
  useSigner,
  useToken,
  useProvider,
} from "wagmi";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

function StableSwap({
  signer,
  betTokenContract,
  betStableSwapContract,
  stableTokenContract,
}) {
  betTokenContract.balanceOf(signer.getAddress()).then((balance) => {
    console.log("betTokenContract.balanceOf", balance.toString());
  });
  return (
    <>
      <p>Stable swap</p>
      {/* <Group>
        <NumberInput
          label={stableTokenData?.symbol}
          precision={6}
          min={0}
          type="number"
          size="md"
          value={amountIn}
          removeTrailingZeros
          withAsterisk
          hideControls
          required
        />
        <p>Your balance: {stableTokenBalance?.toString()}</p>
      </Group>
      <Group>
        <NumberInput
          label={betTokenData?.symbol}
          precision={6}
          min={0}
          type="number"
          size="md"
          value={amountOut}
          disabled
          removeTrailingZeros
          withAsterisk
          hideControls
          required
        />
        <p>Your balance: {betTokenBalance?.toString()}</p>
      </Group>
      <Button>Swap</Button> */}
    </>
  );
}

export default StableSwap;
