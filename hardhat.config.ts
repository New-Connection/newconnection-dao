import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "./tasks";

dotenv.config();

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.9",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    defaultNetwork: "hardhat",
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
    networks: {
        hardhat: {
            chainId: 37337,
        },
        localhost: {
            chainId: 37337,
        },
        rinkeby: {
            url: process.env.RINKEBY_URL,
            chainId: 4,
            accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
        },
        "bsc-testnet": {
            url: process.env.BSCTEST_URL || "",
            chainId: 97,
            accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
        },
        ropsten: {
            url: process.env.ROPSTEN_URL || "",
            accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
        },
        goerli: {
            url: process.env.GOERLI_URL || "",
            accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
        },
    },

    gasReporter: {
        enabled: process.env.REPORT_GAS !== undefined,
        currency: "USD",
    },

    etherscan: {
        apiKey: {
            mainnet: process.env.ETHERSCAN_API_KEY || "",
            bsc: process.env.BSCSCAN_API_KEY || "",
            avalanche: process.env.AVAXSCAN_API_KEY || "",
            polygon: process.env.POLSCAN_API_KEY || "",
            arbitrumOne: process.env.ARBISCAN_API_KEY || "",
            optimisticEthereum: process.env.OPTSCAN_API_KEY || "",
            opera: process.env.OPERASCAN_API_KEY || "",

            bscTestnet: process.env.BSCSCAN_API_KEY || "",
            rinkeby: process.env.ETHERSCAN_API_KEY || "",
        },
    },
};

export default config;
