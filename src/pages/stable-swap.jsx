import { Button, Group, NumberInput, Switch, Text, SimpleGrid, Grid, Center } from "@mantine/core";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { showNotification } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons";

function StableSwap({
  signer,
  betTokenContract,
  betStableSwapContract,
  stableTokenContract,
  betTokenBalance,
}) {
  // State variables
  const [swapRatio, setSwapRatio] = useState(0);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [isTokenInApproved, setIsTokenInApproved] = useState(false);
  const [tokenIn, setTokenIn] = useState(stableTokenContract);
  const [tokenOut, setTokenOut] = useState(betTokenContract);
  const [tokenInSymbol, setTokenInSymbol] = useState("DAI");
  const [tokenOutSymbol, setTokenOutSymbol] = useState("SAB");
  const [amountIn, setAmountIn] = useState(0);
  const [tokenInBalance, setTokenInBalance] = useState(0);
  const [tokenOutBalance, setTokenOutBalance] = useState(0);
  const [toggleSwapDirection, setToggleSwapDirection] = useState(false);

  // Functions
  const getTokenInBalance = async () => {
    const balance = await tokenIn.balanceOf(signer.getAddress());
    setTokenInBalance(balance);
  };

  const getTokenOutBalance = async () => {
    const balance = await tokenOut.balanceOf(signer.getAddress());
    setTokenOutBalance(balance);
  };

  const getIsTokenInApproved = async () => {
    const isApproved = await isTokenApproved(tokenIn);
    setIsTokenInApproved(isApproved);
  };

  const invertSwapDirection = () => {
    setTokenInSymbol(tokenOutSymbol);
    setTokenOutSymbol(tokenInSymbol);
    setTokenOut(tokenIn);
    setTokenIn(tokenOut);
    setToggleSwapDirection(() => !toggleSwapDirection);
  };

  const isTokenApproved = async (token) => {
    const allowance = await token.allowance(
      signer.getAddress(),
      betStableSwapContract.address
    );
    return allowance > 0;
  };

  const approveToken = async () => {
    setIsButtonLoading(true);
    tokenIn
      .approve(betStableSwapContract.address, ethers.constants.MaxUint256)
      .then((tx) => {
        tx.wait()
          .then((receipt) => {
            if (receipt.status === 1) {
              setIsTokenInApproved(true);
              showNotification({
                icon: <IconCheck />,
                color: "teal",
                title: "Approve success",
              });
            }
          })
          .finally(() => {
            setIsButtonLoading(false);
          });
      })
      .catch((err) => {
        console.log("Approve failed", err);
        setIsButtonLoading(false);
        showNotification({
          icon: <IconX />,
          color: "red",
          title: "Approve failed",
          message: err.message,
        });
      });
  };

  const swap = async () => {
    setIsButtonLoading(true);
    const functionToSend = !toggleSwapDirection
      ? betStableSwapContract.depositStableTokenForBetToken(
        ethers.utils.parseEther(amountIn.toString())
      )
      : betStableSwapContract.burnBetTokenForStableToken(
        ethers.utils.parseEther(amountIn.toString())
      );

    functionToSend
      .then((tx) => {
        tx.wait()
          .then((receipt) => {
            if (receipt.status === 1) {
              showNotification({
                icon: <IconCheck />,
                color: "teal",
                title: "Swap Successful",
              });
              getTokenInBalance();
              getTokenOutBalance();
            }
          })
          .finally(() => {
            setIsButtonLoading(false);
          });
      })
      .catch((err) => {
        console.log("Swap failed", err);
        setIsButtonLoading(false);
        showNotification({
          icon: <IconX />,
          color: "red",
          title: "Swap failed",
          message: err.message,
        });
      });
  };

  useEffect(() => {
    getTokenInBalance();
    getTokenOutBalance();
    getIsTokenInApproved();
  }, [signer, toggleSwapDirection]);

  useEffect(() => {
    const getSwapRatio = async () => {
      const ratio = await betStableSwapContract.SWAP_RATIO();
      setSwapRatio(ratio);
    };
    getSwapRatio();
  }, []);

  return (
    <>
      <Group align="end">
        <NumberInput
          label={tokenInSymbol}
          precision={6}
          min={0}
          type="number"
          size="md"
          value={amountIn}
          onChange={(value) => setAmountIn(value || 0)}
          removeTrailingZeros
          hideControls
          required
          withAsterisk={false}
        />
        <p>
          Your balance : {parseFloat(ethers.utils.formatEther(tokenInBalance).toString()).toFixed(2)}
        </p>
      </Group>
      <Group align="end">
        <NumberInput
          label={tokenOutSymbol}
          precision={6}
          min={0}
          type="number"
          size="md"
          value={
            !toggleSwapDirection ? amountIn * swapRatio : amountIn / swapRatio
          }
          disabled
          removeTrailingZeros
          hideControls
        />
        <p>
          Your balance : {parseFloat(ethers.utils.formatEther(tokenOutBalance).toString()).toFixed(2)}
        </p>
      </Group>
      <Group align="stretch" position="left">
        {isTokenInApproved ? (
          <Button
            style={{ 'margin': "10px 5px 10px 0px" }}
            disabled={
              amountIn <= 0 ||
              ethers.utils.parseEther(amountIn.toString()).gt(tokenInBalance)
            }
            loading={isButtonLoading}
            onClick={() => swap()}
          >
            Swap
          </Button>
        ) : (
          <Button
            style={{ 'margin': "10px 5px 10px 0px" }}
            loading={isButtonLoading}
            onClick={() => approveToken(tokenIn)}
          >
            Approve
          </Button>
        )}
        <Switch
          style={{}}
          label="Invert swap"
          checked={toggleSwapDirection}
          onChange={() => invertSwapDirection()}
        />

      </Group>
    </>
  );
}

export default StableSwap;
