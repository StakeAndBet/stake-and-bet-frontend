import { useEffect, useState } from "react";
import {
  Button,
  Group,
  Box,
  Select,
  Progress,
  Table,
  Modal,
} from "@mantine/core";
import { BigNumber, ethers } from "ethers";
import PlaceBets from "../components/place-bets";

function ManageBets({ signer, betTokenContract, betManagerContract }) {
  const [bettingSessions, setBettingSessions] = useState([]);
  const [isFetchingBettingSessions, setIsFetchingBettingSessions] =
    useState(false);
  const [fetchingBettingSessionsProgress, setFetchingBettingSessionsProgress] =
    useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const convertTimestampToDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  const convertSessionStateToString = (state, startTimestamp) => {
    switch (state) {
      case 0:
        return startTimestamp > Date.now() / 1000 ? "Open" : "Closed";
      case 1:
        return "Result Requested";
      case 2:
        return "Settled";
      default:
        return "Unknown";
    }
  };

  const fetchBettingSessions = async () => {
    setIsFetchingBettingSessions(true);
    const bettingSessionsCount = await betManagerContract.getSessionIdsLength();
    const SLICE_SIZE = 100;
    let _bettingSessionsIds = [];
    let _bettingSessions = [];
    let start = 0;
    let end = SLICE_SIZE;

    if (bettingSessionsCount != 0) {
      // Fetching betting sessions in batches of 100
      // to avoid hitting the block gas limit and to avoid hitting the max call stack size

      if (end > bettingSessionsCount) {
        _bettingSessionsIds =
          await betManagerContract.getBettingSessionIdsBySlice(
            start,
            bettingSessionsCount
          );
        setFetchingBettingSessionsProgress(100);
      } else {
        while (true) {
          const _bettingSessionsIdsSlice =
            await betManagerContract.getBettingSessionIdsBySlice(start, end);
          _bettingSessionsIds.push(..._bettingSessionsIdsSlice);
          start = end;
          end += SLICE_SIZE;
          setFetchingBettingSessionsProgress(
            (_bettingSessionsIds.length / bettingSessionsCount) * 100
          );
          if (end > bettingSessionsCount) {
            end = bettingSessionsCount;
          }
          if (start >= bettingSessionsCount) {
            setFetchingBettingSessionsProgress(100);
            break;
          }
        }
      }

      // Fetching betting session details
      // and adding them to the bettingSessions state
      _bettingSessions = await Promise.all(
        _bettingSessionsIds.map(async (bettingSessionId) => {
          const bettingSession = await betManagerContract.bettingSessions(
            bettingSessionId
          );
          return {
            id: bettingSessionId,
            startTimestamp: bettingSession.startTimestamp,
            endTimestamp: bettingSession.endTimestamp,
            twitterUserId: bettingSession.twitterUserId,
            betResult: bettingSession.betResult,
            totalTokensBet: bettingSession.totalTokensBet,
            state: bettingSession.state,
          };
        })
      );
    }
    setBettingSessions(_bettingSessions);
    setIsFetchingBettingSessions(false);
  };

  useEffect(() => {
    fetchBettingSessions();
  }, []);

  const rows = bettingSessions.map((bettingSession) => {
    const startDate = convertTimestampToDate(bettingSession.startTimestamp);
    const endDate = convertTimestampToDate(bettingSession.endTimestamp);
    const state = convertSessionStateToString(
      bettingSession.state,
      bettingSession.startTimestamp
    );
    const totalTokensBet = ethers.utils.formatEther(
      bettingSession.totalTokensBet
    );
    const betResult = ethers.utils.formatEther(bettingSession.betResult);

    return (
      <tr key={bettingSession.id}>
        <td>{bettingSession.twitterUserId}</td>
        <td>{startDate}</td>
        <td>{endDate}</td>
        <td>{betResult}</td>
        <td>{totalTokensBet}</td>
        <td>{state}</td>
        <td>
          {
            <Button
              disabled={state === "Closed"}
              onClick={() => setIsModalOpen(true)}
            >
              Place Bets
            </Button>
          }
        </td>
      </tr>
    );
  });

  return (
    <>
      <Modal
        title="Placing bets"
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <PlaceBets
          signer={signer}
          betTokenContract={betTokenContract}
          betManagerContract={betManagerContract}
        />
      </Modal>
      {isFetchingBettingSessions ? (
        <div>
          <p>Fetching betting sessions...</p>
          <Progress value={fetchingBettingSessionsProgress} />
        </div>
      ) : (
        <Table withBorder withColumnBorders highlightOnHover>
          <thead>
            <tr>
              <th>Twitter User Id</th>
              <th>Start</th>
              <th>End</th>
              <th>Bet Result</th>
              <th>Total Tokens Bet</th>
              <th>Session State</th>
              <th>Bet</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </Table>
      )}
    </>
  );
}

export default ManageBets;
