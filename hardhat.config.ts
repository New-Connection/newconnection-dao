import * as dotenv from "dotenv";

import {HardhatUserConfig} from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import "solidity-coverage";

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
            url: "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
            chainId: 4,
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
            goerli: process.env.ETHERSCAN_API_KEY || "",
        },
    },
};

export default config;
