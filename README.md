# Stake & Bet frontend

## Environment Variables

To run this project, you will need to add the following environment variables to your `.env*` file

* `REACT_APP_BET_TOKEN` : BetToken contract address
* `REACT_APP_STABLE_TOKEN` : Stable Token contract address (DAI)
* `REACT_APP_BET_STABLE_SWAP` : BetStableSwap contract address
* `REACT_APP_BET_MANAGER` : BetManager contract address
* `REACT_APP_BET_POOL` : BetPool contract address

## Installation

```bash
  npm install
```
## Deployment

* `.env*` needs to contains variables cited above

Run the following command for development environment

```bash
  npm start
```

Or to deploy in production :

```bash
  npm run build
```
