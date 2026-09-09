export {};

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const ethers = hre.ethers;

async function main() {
  const networkName = hre.network.name;
  console.log(`Deploying LandRegistry contract to ${networkName}...`);

  // Check for private key on non-local networks
  if (networkName !== "localhost" && networkName !== "hardhat") {
    if (!process.env.PRIVATE_KEY) {
      console.error("\n❌ ERROR: PRIVATE_KEY is not set in .env.local");
      console.error("To deploy to Sepolia, you must:");
      console.error("1. Open .env.local file");
      console.error("2. Add your wallet's private key to PRIVATE_KEY=");
      console.error(
        "   (Export from MetaMask: Account Details > Export Private Key)",
      );
      console.error("3. Ensure your wallet has Sepolia ETH from a faucet");
      console.error(
        "\nFaucets: https://sepoliafaucet.com or https://www.alchemy.com/faucets/ethereum-sepolia",
      );
      process.exit(1);
    }
    if (!process.env.SEPOLIA_RPC_URL) {
      console.error("\n❌ ERROR: SEPOLIA_RPC_URL is not set in .env.local");
      process.exit(1);
    }
  }

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Deploying contracts with the account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy the LandRegistry contract
  const LandRegistry = await ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();

  await landRegistry.waitForDeployment();

  const contractAddress = await landRegistry.getAddress();
  console.log("LandRegistry deployed to:", contractAddress);

  // Get the ABI from the compiled contract
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/LandRegistry.sol/LandRegistry.json",
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  // Save the contract address and ABI to a config file for the frontend
  const isLocal = networkName === "localhost" || networkName === "hardhat";
  const config = {
    address: contractAddress,
    network: networkName,
    chainId: isLocal ? 31337 : 11155111,
    abi: artifact.abi,
  };

  const configPath = path.join(__dirname, "../src/utils/contractConfig.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("Contract config saved to:", configPath);

  // Auto-update .env.local with the new contract address
  const envPath = path.join(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf8");

    if (isLocal) {
      // Update Hardhat contract address
      envContent = envContent.replace(
        /NEXT_PUBLIC_HARDHAT_CONTRACT_ADDRESS=.*/,
        `NEXT_PUBLIC_HARDHAT_CONTRACT_ADDRESS=${contractAddress}`,
      );
    } else {
      // Update Sepolia contract address
      envContent = envContent.replace(
        /NEXT_PUBLIC_SEPOLIA_CONTRACT_ADDRESS=.*/,
        `NEXT_PUBLIC_SEPOLIA_CONTRACT_ADDRESS=${contractAddress}`,
      );
    }

    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Updated .env.local with ${networkName} contract address`);
  }

  console.log("\n🎉 Deployment complete!");
  console.log(`   Network: ${networkName}`);
  console.log(`   Contract: ${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
