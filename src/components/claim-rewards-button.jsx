import { useState, useEffect } from "react";
import { BigNumber, ethers } from "ethers";
import { Button, Group, Text, Flex } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons";

function ClaimRewardsButton({
  signer,
  betManagerContract,
  betPoolContract,
  betTokensToClaimFromBetManager,
  betTokensToClaimFromBetPool,
}) {
  const [isBetRewardsButtonLoading, setIsBetRewardsButtonLoading] =
    useState(false);
  const [isStackingRewardsButtonLoading, setIsStackingRewardsButtonLoading] =
    useState(false);

  const claimRewardsFromBetManager = async () => {
    setIsBetRewardsButtonLoading(true);
    betManagerContract
      .claimTokens()
      .then((tx) => {
        tx.wait()
          .then((receipt) => {
            //Check if receipt contains TokenClaimed event
            if (
              receipt.events.find((event) => event.event === "TokenClaimed")
            ) {
              showNotification({
                icon: <IconCheck />,
                color: "teal",
                title: "Claim success",
              });
            }
          })
          .finally(() => {
            setIsBetRewardsButtonLoading(false);
          });
      })
      .catch((err) => {
        setIsBetRewardsButtonLoading(false);
        showNotification({
          icon: <IconX />,
          color: "red",
          title: "Claim failed",
          message: err.message,
        });
      });
  };

  const claimRewardsFromBetPool = async () => {
    setIsStackingRewardsButtonLoading(true);
    betPoolContract
      .getReward()
      .then((tx) => {
        tx.wait()
          .then((receipt) => {
            //Check if receipt contains RewardPaid event
            if (receipt.events.find((event) => event.event === "RewardPaid")) {
              showNotification({
                icon: <IconCheck />,
                color: "teal",
                title: "Claim success",
              });
            }
          })
          .finally(() => {
            setIsStackingRewardsButtonLoading(false);
          });
      })
      .catch((err) => {
        console.log("Claim failed", err);
        setIsStackingRewardsButtonLoading(false);
        showNotification({
          icon: <IconX />,
          color: "red",
          title: "Claim failed",
          message: err.message,
        });
      });
  };

  return (
    <Group noWrap={true}>
      <Button
        radius="md"
        color="dark.4"
        onClick={claimRewardsFromBetManager}
        loading={isBetRewardsButtonLoading}
        disabled={BigNumber.from(betTokensToClaimFromBetManager).eq(0)}
      >
        {BigNumber.from(betTokensToClaimFromBetManager).eq(0) ? (
          <Text>No bet rewards</Text>
        ) : (
          <Flex justify="center" align="center" direction="column">
            <Text ta="center" inline="true">
              Claim bet rewards <br></br>
              {parseFloat(ethers.utils
                .formatEther(betTokensToClaimFromBetManager)
                  .toString()).toFixed(2)}{" "}
              SAB
            </Text>
          </Flex>
        )}
      </Button>
      <Button
        radius="md"
        color="dark.4"
        onClick={claimRewardsFromBetPool}
        loading={isStackingRewardsButtonLoading}
        disabled={BigNumber.from(betTokensToClaimFromBetPool).eq(0)}
      >
        {BigNumber.from(betTokensToClaimFromBetPool).eq(0) ? (
          <Text>No stacking rewards</Text>
        ) : (
          <Flex justify="center" align="center" direction="column">
            <Text ta="center" inline="true">
              Claim stacking rewards <br></br>
              {parseFloat(ethers.utils.formatEther(betTokensToClaimFromBetPool).toString()).toFixed(2)}{" "}
              SAB
            </Text>
          </Flex>
        )}
      </Button>
    </Group>
  );
}

export default ClaimRewardsButton;
