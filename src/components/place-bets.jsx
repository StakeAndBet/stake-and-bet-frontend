import { useState, useEffect } from "react";
import { NumberInput, Button, Group, CloseButton, Table } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons";
import { ethers } from "ethers";

function PlaceBets({
  signer,
  betTokenContract,
  betManagerContract,
  betTokenBalance,
  sessionId,
  closeModalCallback,
}) {
  const [inputBet, setInputBet] = useState(0);
  const [inputMultiplier, setInputMultiplier] = useState(1);
  const [bets, setBets] = useState([]);
  const [betRows, setBetRows] = useState(null);

  const [totalTokensBetByUser, setTotalTokensBetByUser] = useState(0);

  const [tokenAmountPerBet, setTokenAmountPerBet] = useState(0);
  const [maxTokensPerSession, setMaxTokensPerSession] = useState(0);

  const [isPlaceBetsButtonLoading, setIsPlaceBetsButtonLoading] =
    useState(false);
  const [isApproveButtonLoading, setIsApproveButtonLoading] = useState(false);

  const [isBetTokenApproved, setIsBetTokenApproved] = useState(false);

  const maxBetsNumber = () => {
    return maxTokensPerSession / tokenAmountPerBet;
  };

  const isTokenApproved = async (token) => {
    const allowance = await token.allowance(
      signer.getAddress(),
      betManagerContract.address
    );
    return allowance > 0;
  };

  const approveToken = async () => {
    setIsApproveButtonLoading(true);
    betTokenContract
      .approve(betManagerContract.address, ethers.constants.MaxUint256)
      .then((tx) => {
        tx.wait()
          .then((receipt) => {
            if (receipt.status === 1) {
              setIsBetTokenApproved(true);
              showNotification({
                icon: <IconCheck />,
                color: "teal",
                title: "Approve success",
              });
            }
          })
          .finally(() => {
            setIsApproveButtonLoading(false);
          });
      })
      .catch((err) => {
        console.log("Approve failed", err);
        setIsApproveButtonLoading(false);
        showNotification({
          icon: <IconX />,
          color: "red",
          title: "Approve failed",
          message: err.message,
        });
      });
  };

  // Add bet to bets array but combine with existing bet if it exists by cumulative multiplier
  const addBets = async () => {
    const totalMultiplier = bets
      .map((bet) => bet.multiplier)
      .reduce((a, b) => a + b, 0);

    // Check if user isn't exceeding max bets per session
    if (
      totalMultiplier +
      inputMultiplier +
      totalTokensBetByUser / tokenAmountPerBet >
      maxBetsNumber()
    ) {
      showNotification({
        icon: <IconX />,
        color: "red",
        title: "Failed to place bets",
        message: "You are exceeding max bets number. Please reduce your bets.",
      });
      return;
    }

    // Check if user has enough balance to place bets
    if (
      (totalMultiplier + inputMultiplier) * tokenAmountPerBet >
      betTokenBalance
    ) {
      showNotification({
        icon: <IconX />,
        color: "red",
        title: "Failed to place bets",
        message: "You don't have enough balance to place these bets.",
      });
      return;
    }

    // Check if bet already exists in bets array and combine if it does
    let bet = bets.find((bet) => bet.tweets === inputBet);
    if (bet) {
      const _bets = bets.map((_bet) => {
        if (_bet.tweets === inputBet) {
          _bet.multiplier += inputMultiplier;
        }
        return _bet;
      });
      setBets(_bets);
    } else {
      setBets([...bets, { tweets: inputBet, multiplier: inputMultiplier }]);
    }
  };

  // Place bets on chain
  const placeBets = async () => {
    setIsPlaceBetsButtonLoading(true);
    // Convert bets array to a flattened array of tweets and multipliers
    const _bets = bets
      .map((bet) => {
        const b = new Array(bet.multiplier).fill(bet.tweets);
        return b;
      })
      .flat();

    betManagerContract
      .placeBets(sessionId, _bets)
      .then((tx) => {
        tx.wait().then((receipt) => {
          // Check if receipt contains BetsPlaced event
          if (receipt.events.find((event) => event.event === "BetsPlaced")) {
            showNotification({
              icon: <IconCheck />,
              color: "teal",
              title: "Bets placed successfully",
            });
            setBets([]);
            setInputBet(0);
            setInputMultiplier(1);
            closeModalCallback();
          }
        })
          .finally(() => {
            setIsPlaceBetsButtonLoading(false);
          })
      })
      .catch((err) => {
        setIsPlaceBetsButtonLoading(false);
        showNotification({
          icon: <IconX />,
          color: "red",
          title: "Failed to place bets",
          message: err.message,
        });
      })
  };

  useEffect(() => {
    const _betRows = bets.map((bet, index) => {
      return (
        <tr key={index}>
          <td>{bet.tweets}</td>
          <td>{bet.multiplier}</td>
          <td>
            <CloseButton
              onClick={() => setBets(bets.filter((b) => b !== bet))}
            />
          </td>
        </tr>
      );
    });
    setBetRows(_betRows);
  }, [bets]);

  useEffect(() => {
    const getBetTokenAmountPerBet = async () => {
      const _tokenAmountPerBet =
        await betManagerContract.TOKEN_AMOUNT_PER_BET();
      setTokenAmountPerBet(_tokenAmountPerBet);
    };
    getBetTokenAmountPerBet();
    const getMaxTokensPerSession = async () => {
      const _maxTokensPerSession =
        await betManagerContract.MAX_TOKENS_PER_SESSION();
      setMaxTokensPerSession(_maxTokensPerSession);
    };
    getMaxTokensPerSession();
  }, []);

  useEffect(() => {
    const getTotalTokensBetByUser = async () => {
      const _totalTokensBetByUser =
        await betManagerContract.totalTokensBetPerSessionIdPerUser(
          sessionId,
          signer.getAddress()
        );
      setTotalTokensBetByUser(_totalTokensBetByUser);
    };
    getTotalTokensBetByUser();
  }, [betTokenBalance]);

  useEffect(() => {
    const checkBetTokenApproval = async () => {
      const _isBetTokenApproved = await isTokenApproved(betTokenContract);
      setIsBetTokenApproved(_isBetTokenApproved);
    };
    checkBetTokenApproval();
  }, []);

  return (
    <>
      <Group align="end" noWrap={true}>
        <NumberInput
          defaultValue={0}
          min={0}
          label="Your bet"
          value={inputBet}
          onChange={(value) => setInputBet(value)}
        />
        <NumberInput
          defaultValue={1}
          min={1}
          label="Multiplier"
          value={inputMultiplier}
          onChange={(value) => setInputMultiplier(value)}
        />
        <Button onClick={() => addBets()}>Add bet</Button>
      </Group>
      {bets.length > 0 && (
        <>
          <Table>
            <thead>
              <tr>
                <th>Tweets</th>
                <th>Multiplier</th>
                <th>Remove</th>
              </tr>
            </thead>
            <tbody>{betRows}</tbody>
          </Table>
          {isBetTokenApproved ? (
            <Button
              fullWidth
              loading={isPlaceBetsButtonLoading}
              onClick={() => placeBets()}
              disabled={bets.length === 0}
            >
              Place bets
            </Button>
          ) : (
            <Button
              loading={isApproveButtonLoading}
              onClick={() => approveToken()}
            >
              Approve
            </Button>
          )}
        </>
      )}
    </>
  );
}

export default PlaceBets;
