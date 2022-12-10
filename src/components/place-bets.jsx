import { useState, useEffect } from "react";
import { NumberInput, Button, Group, CloseButton, Table } from "@mantine/core";

function PlaceBets({ signer, betTokenContract, betManagerContract }) {
  const [betTokenBalance, setBetTokenBalance] = useState(0);

  const [inputBet, setInputBet] = useState(0);
  const [inputMultiplier, setInputMultiplier] = useState(1);
  const [bets, setBets] = useState([]);

  const [betRows, setBetRows] = useState(null);

  const getBetTokenBalance = async () => {
    const balance = await betTokenContract.balanceOf(signer.getAddress());
    console.log("balance", balance.toString());
    setBetTokenBalance(balance);
  };

  // Add bet to bets array but combine with existing bet if it exists by cumulative multiplier
  const addBets = async () => {
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

  useEffect(() => {
    getBetTokenBalance();
  }, []);

  useEffect(() => {
    const _betRows = bets.map((bet, index) => {
      return (
        <tr key={index}>
          <td>{bet.tweets}</td>
          <td>{bet.multiplier}</td>
          <td>
            {
              <CloseButton
                onClick={() => setBets(bets.filter((b) => b !== bet))}
              />
            }
          </td>
        </tr>
      );
    });
    setBetRows(_betRows);
  }, [bets]);

  return (
    <>
      <Group noWrap={true}>
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
      </Group>
      <Button onClick={() => addBets()}>Add bet</Button>
      <Table>
        <thead>
          <tr>
            <th>Tweets</th>
            <th>Multiplier</th>
          </tr>
        </thead>
        <tbody>{betRows}</tbody>
      </Table>
    </>
  );
}

export default PlaceBets;
