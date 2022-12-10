import {
    Button,
    Center,
    Group,
    NumberInput,
    Text,
    Switch,
    Box,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { BigNumber, ethers } from "ethers";
import { showNotification } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons";

function Stacking({
    signer,
    betTokenContract,
    betPoolContract,
    betTokenBalance,
    betTokensToClaimFromBetPool,
}) {

    // State variables
    const [totalBetTokensInStackingPool, setTotalBetTokensInStackingPool] = useState(0);
    const [betPoolRewardPerToken, setBetPoolRewardPerToken] = useState(0);
    const [betPoolAPR, setBetPoolAPR] = useState(0);
    const [betTokensInRewardPool, setBetTokensInRewardPool] = useState(0);
    const [userBetTokensInStackingPool, setUserbetTokensInStackingPool] = useState(0);
    const [amountToStake, setAmountToStake] = useState(0);
    const [isButtonLoading, setIsButtonLoading] = useState(false);
    const [isWithdrawButtonLoading, setIsWithdrawButtonLoading] = useState(false);
    const [isTokenInApproved, setIsTokenInApproved] = useState(false);
    const [isUnstakeButtonLoading, setIsUnstakeButtonLoading] = useState(false);
    const [defaultStakingRewardDistributionDuration, setDefaultStakingRewardDistributionDuration] = useState(7);

    const getStakingInfo = async () => {
        const getTotalBetTokensInStackingPool = await betPoolContract.totalSupply();
        setTotalBetTokensInStackingPool(getTotalBetTokensInStackingPool);
        const getBetPoolRewardPerToken = await betPoolContract.rewardPerTokenStored();
        setBetPoolRewardPerToken(getBetPoolRewardPerToken);
        const getBetTokensInRewardPool = await betTokenContract.balanceOf(betPoolContract.address);
        setBetTokensInRewardPool(getBetTokensInRewardPool.sub(getTotalBetTokensInStackingPool));
        const getUserbetTokensInStackingPool = await betPoolContract.balanceOf(signer.getAddress());
        setUserbetTokensInStackingPool(getUserbetTokensInStackingPool);
    };

    // APR = (Total Staking Rewards / Total Staked Tokens) x(365 / Length of Staking Period) x 100
    // Where ‘Total Staking Rewards’ is the total rewards earned from staking, ‘Total Staked Tokens’ is the total amount of tokens staked, and ‘Length of Staking Period’ is the length of time for which the tokens were staked.

    const calculateAPR = () => {
        if (betTokensInRewardPool === 0 || totalBetTokensInStackingPool === 0) return;
        const totalStakingRewards = ethers.utils.formatEther(betTokensInRewardPool);
        const totalStakedTokens = ethers.utils.formatEther(totalBetTokensInStackingPool);
        const apr = totalStakingRewards / totalStakedTokens * 365 / defaultStakingRewardDistributionDuration * 100;
        setBetPoolAPR(apr);
    };

    const getIsTokenInApproved = async () => {
        const isApproved = await isTokenApproved(betTokenContract);
        setIsTokenInApproved(isApproved);
    };

    const isTokenApproved = async (token) => {
        const allowance = await token.allowance(
            signer.getAddress(),
            betPoolContract.address
        );
        return allowance > 0;
    };

    const approveToken = async () => {
        setIsButtonLoading(true);
        betTokenContract
            .approve(betPoolContract.address, ethers.constants.MaxUint256)
            .then((tx) => {
                tx.wait().then((receipt) => {
                    if (receipt.status === 1) {
                        setIsTokenInApproved(true);
                        showNotification({
                            icon: <IconCheck />,
                            color: "teal",
                            title: "Approve success",
                        });
                    }
                });
            })
            .catch((err) => {
                console.log("Approve failed", err);
                showNotification({
                    icon: <IconX />,
                    color: "red",
                    title: "Approve failed",
                    message: err.message,
                });
            })
            .finally(() => {
                setIsButtonLoading(false);
            });
    };
    // Event "Staked"
    const stake = async () => {
        setIsButtonLoading(true);
        betPoolContract.stake(ethers.utils.parseEther(amountToStake.toString()))
            .then((tx) => {
                tx.wait().then((receipt) => {
                    //Check if receipt contains Staked event
                    if (receipt.events.find((event) => event.event === "Staked")) {
                        showNotification({
                            icon: <IconCheck />,
                            color: "teal",
                            title: "Stake Successful",
                        });
                        getStakingInfo();
                        calculateAPR();
                    }
                });
            })
            .catch((err) => {
                console.log("Stake failed", err);
                showNotification({
                    icon: <IconX />,
                    color: "red",
                    title: "Stake failed",
                    message: err.message,
                });
            })
            .finally(() => {
                setIsButtonLoading(false);
            });
    };

    const withdrawRewards = async () => {
        setIsWithdrawButtonLoading(true);
        betPoolContract.getReward()
            .then((tx) => {
                tx.wait().then((receipt) => {
                    //Check if receipt contains RewardPaid event
                    if (receipt.events.find((event) => event.event === "RewardPaid")) {
                        showNotification({
                            icon: <IconCheck />,
                            color: "teal",
                            title: "Withdraw Successful",
                        });
                        getStakingInfo();
                        calculateAPR();
                    }
                });
            })
            .catch((err) => {
                console.log("Stake failed", err);
                showNotification({
                    icon: <IconX />,
                    color: "red",
                    title: "Withdraw failed",
                    message: err.message,
                });
            })
            .finally(() => {
                setIsWithdrawButtonLoading(false);
            });
    };

    const unstake = async () => {
        setIsUnstakeButtonLoading(true);
        betPoolContract.exit()
            .then((tx) => {
                tx.wait().then((receipt) => {
                    //Check if receipt contains Withdrawn event
                    if (receipt.events.find((event) =>
                        event.event === "Withdrawn")) {
                        showNotification({
                            icon: <IconCheck />,
                            color: "teal",
                            title: "Unstake Successful",
                        });
                        getStakingInfo();
                        calculateAPR();
                    }
                });
            })
            .catch((err) => {
                console.log("Unstake failed", err);
                showNotification({
                    icon: <IconX />,
                    color: "red",
                    title: "Unstake failed",
                    message: err.message,
                });
            })
            .finally(() => {
                setIsUnstakeButtonLoading(false);
            });
    };


    useEffect(() => {
        getStakingInfo();
        getIsTokenInApproved();
        calculateAPR();
    }, [signer]);

    return (
        <>
            <Group position="center" spacing="xs">
                <Box
                    sx={(theme) => ({
                        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                        textAlign: 'center',
                        padding: theme.spacing.xl,
                        borderRadius: theme.radius.md,
                        cursor: 'pointer',

                        '&:hover': {
                            backgroundColor:
                                theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1],
                        },
                    })}
                >
                    Reward pool :
                    <br></br>
                    {ethers.utils.formatEther(betTokensInRewardPool).toString()} SAB
                </Box>
                <Box
                    sx={(theme) => ({
                        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                        textAlign: 'center',
                        padding: theme.spacing.xl,
                        borderRadius: theme.radius.md,
                        cursor: 'pointer',

                        '&:hover': {
                            backgroundColor:
                                theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1],
                        },
                    })}
                >
                    Total stacked :
                    <br></br>
                    {ethers.utils.formatEther(totalBetTokensInStackingPool).toString()} SAB
                </Box>
                <Box
                    sx={(theme) => ({
                        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                        textAlign: 'center',
                        padding: theme.spacing.xl,
                        borderRadius: theme.radius.md,
                        cursor: 'pointer',

                        '&:hover': {
                            backgroundColor:
                                theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1],
                        },
                    })}
                >
                    APR :
                    <br></br>
                    {betPoolAPR} %
                </Box>
                <Box
                    sx={(theme) => ({
                        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                        textAlign: 'center',
                        padding: theme.spacing.xl,
                        borderRadius: theme.radius.md,
                        cursor: 'pointer',

                        '&:hover': {
                            backgroundColor:
                                theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1],
                        },
                    })}
                >
                    Earned :
                    <br></br>
                    {ethers.utils.formatEther(betTokensToClaimFromBetPool).toString()} SAB
                </Box>
                <Box
                    sx={(theme) => ({
                        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                        textAlign: 'center',
                        padding: theme.spacing.xl,
                        borderRadius: theme.radius.md,
                        cursor: 'pointer',

                        '&:hover': {
                            backgroundColor:
                                theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1],
                        },
                    })}
                >
                    Staked :
                    <br></br>
                    {ethers.utils.formatEther(userBetTokensInStackingPool).toString()} SAB
                </Box>
            </Group>
            <Group position="center" spacing="xs">
                <Text style={{ padding: "5px 5px 0px 5px" }}>
                    Your balance : {ethers.utils.formatEther(betTokenBalance).toString()} SAB
                </Text>
            </Group>
            <Group position="center" spacing="xs">
                <Text>
                    SAB
                </Text>
                <NumberInput style={{ padding: "10px 5px 10px 5px" }}
                    label=""
                    precision={6}
                    min={0}
                    type="number"
                    size="md"
                    value={amountToStake}
                    onChange={(value) => setAmountToStake(value || 0)}
                    removeTrailingZeros
                    withAsterisk
                    hideControls
                    required
                />
                {isTokenInApproved ? (
                    <Button
                        disabled={
                            amountToStake <= 0 ||
                            ethers.utils.parseEther(amountToStake.toString()).gt(betTokenBalance)
                        }
                        loading={isButtonLoading}
                        onClick={() => stake()}
                    >
                        Stake
                    </Button>
                ) : (
                    <Button
                        loading={isButtonLoading}
                        onClick={() => approveToken(betTokenContract)}
                    >
                        Approve
                    </Button>
                )}
            </Group>
            <Group position="center" spacing="xs">

                <Button
                    disabled={
                        BigNumber.from(betTokensToClaimFromBetPool).eq(0)
                    }
                    loading={isWithdrawButtonLoading}
                    onClick={() => withdrawRewards()}
                >
                    Claim rewards
                </Button>
                <Button
                    disabled={
                        BigNumber.from(userBetTokensInStackingPool).eq(0)
                    }
                    loading={isUnstakeButtonLoading}
                    onClick={() => unstake()}
                >
                    Unstake
                </Button>


            </Group>
        </>
    )


}

export default Stacking;
