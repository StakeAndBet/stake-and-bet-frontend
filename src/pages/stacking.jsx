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


// The purpose of this component is to display the Stacking page.
// This page will allow users to stake their SAB tokens in the SAB pool, and earn more SAB tokens.
// The page will display the following information : 
// - The current SAB in the reward pool
// - The current SAB in the stacking pool
// - The current SAB pool APY
// - The current SAB pool APR
// - The current user SAB reward

// The following buttons will be displayed:
// - Stake SAB (function stake() of the betPoolContract)
// - Unstake SAB (function exit() of the betPoolContract)
// - Claim SAB (function getReward() of the betPoolContract)

// TODO : update user SAB reward every X seconds, aswell as the APR


function Stacking({
    signer,
    betTokenContract,
    betPoolContract,
    betTokenBalance
}) {

    // State variables
    const [totalSabInStackingPool, setTotalSabInStackingPool] = useState(0);
    const [sabPoolRewardPerToken, setSabPoolRewardPerToken] = useState(0);
    const [sabPoolAPR, setSabPoolAPR] = useState(0);
    const [sabInRewardPool, setSabInRewardPool] = useState(0);
    const [sabUserTokenInStackingPool, setSabUserTokenInStackingPool] = useState(0);
    const [sabUserReward, setSabUserReward] = useState(0);
//    const [sabUserBalance, setSabUserBalance] = useState();
    const [sabAmountToStake, setSabAmountToStake] = useState(0);
    const [isButtonLoading, setIsButtonLoading] = useState(false);
    const [isWithdrawButtonLoading, setIsWithdrawButtonLoading] = useState(false);
    const [isTokenInApproved, setIsTokenInApproved] = useState(false);
    const [isUnstakeButtonLoading, setIsUnstakeButtonLoading] = useState(false);
    const [defaultStakingRewardDistributionDuration, setDefaultStakingRewardDistributionDuration] = useState(7);

    const getStakingInfo = async () => {
        const getTotalSabInStackingPool = await betPoolContract.totalSupply();
        setTotalSabInStackingPool(getTotalSabInStackingPool);
        const getSabPoolRewardPerToken = await betPoolContract.rewardPerTokenStored();
        setSabPoolRewardPerToken(getSabPoolRewardPerToken);
        const getSabUserReward = await betPoolContract.earned(signer.getAddress());
        setSabUserReward(getSabUserReward);
        const getSabInRewardPool = await betTokenContract.balanceOf(betPoolContract.address);
        setSabInRewardPool(getSabInRewardPool.sub(getTotalSabInStackingPool));
        const getSabUserTokenInStackingPool = await betPoolContract.balanceOf(signer.getAddress());
        setSabUserTokenInStackingPool(getSabUserTokenInStackingPool);
 //       const balance = await betTokenContract.balanceOf(signer.getAddress());
//        setSabUserBalance(balance);

    };

    // setInterval(() => {
    //     betPoolContract.earned(signer.getAddress()).then((userReward) => {
    //         setSabUserReward(userReward);
    //         console.log("userReward : ", ethers.utils.formatEther(userReward))
    //     });
    // }, 2000);

    // APR = (Total Staking Rewards / Total Staked Tokens) x(365 / Length of Staking Period) x 100
    // Where ‘Total Staking Rewards’ is the total rewards earned from staking, ‘Total Staked Tokens’ is the total amount of tokens staked, and ‘Length of Staking Period’ is the length of time for which the tokens were staked.

    const calculateAPR = () => {
        if (sabInRewardPool === 0 || totalSabInStackingPool === 0) return;
        const totalStakingRewards = ethers.utils.formatEther(sabInRewardPool);
        const totalStakedTokens = ethers.utils.formatEther(totalSabInStackingPool);
        const apr = totalStakingRewards / totalStakedTokens * 365 / defaultStakingRewardDistributionDuration * 100;
        setSabPoolAPR(apr);
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

    const stake = async () => {
        setIsButtonLoading(true);
        betPoolContract.stake(ethers.utils.parseEther(sabAmountToStake.toString()))
            .then((tx) => {
                tx.wait().then((receipt) => {
                    if (receipt.status === 1) {
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
                    if (receipt.status === 1) {
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
                    if (receipt.status === 1) {
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
                    {ethers.utils.formatEther(sabInRewardPool).toString()} SAB
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
                    {ethers.utils.formatEther(totalSabInStackingPool).toString()} SAB
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
                    {sabPoolAPR} %
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
                    {ethers.utils.formatEther(sabUserReward).toString()} SAB
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
                    {ethers.utils.formatEther(sabUserTokenInStackingPool).toString()} SAB
                </Box>
            </Group>
            <Group position="center" spacing="xs">
                <Text>
                    SAB
                </Text>
                <NumberInput
                    label=""
                    precision={6}
                    min={0}
                    type="number"
                    size="md"
                    value={sabAmountToStake}
                    onChange={(value) => setSabAmountToStake(value || 0)}
                    removeTrailingZeros
                    withAsterisk
                    hideControls
                    required
                />
            </Group>
            <Group position="center" spacing="xs">
                <Text ta="bottoms">
                    Your balance : {ethers.utils.formatEther(betTokenBalance).toString()} SAB
                </Text>
            </Group>
            <Group position="center" spacing="xs">
                {isTokenInApproved ? (
                    <Button
                        disabled={
                            sabAmountToStake <= 0 ||
                            ethers.utils.parseEther(sabAmountToStake.toString()).gt(betTokenBalance)
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
                <Button
                    disabled={
                        sabUserReward == 0
                    }
                    loading={isWithdrawButtonLoading}
                    onClick={() => withdrawRewards()}
                >
                    Claim rewards
                </Button>
                <Button
                    disabled={
                        sabUserTokenInStackingPool == 0
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
