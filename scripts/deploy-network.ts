import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const { ethers } = hre;

// ES Module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const networkName = hre.network.name;
  console.log(`\n🚀 Deploying SoulboundLandRegistry to ${networkName}...\n`);

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  if (
    networkName === "sepolia" &&
    parseFloat(ethers.formatEther(balance)) < 0.01
  ) {
    console.error(
      "❌ Insufficient balance! You need at least 0.01 Sepolia ETH.",
    );
    console.log("   Get Sepolia ETH from: https://sepoliafaucet.com/");
    process.exit(1);
  }

  // Deploy the LandRegistry contract
  console.log("📦 Deploying SoulboundLandRegistry contract...");
  const LandRegistry = await ethers.getContractFactory("SoulboundLandRegistry");
  const landRegistry = await LandRegistry.deploy(deployer.address);

  await landRegistry.waitForDeployment();

  const contractAddress = await landRegistry.getAddress();
  console.log("✅ SoulboundLandRegistry deployed to:", contractAddress);

  // Get the ABI from the compiled contract
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/LandRegistry.sol/SoulboundLandRegistry.json",
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  // Save network-specific config
  const config = {
    address: contractAddress,
    network: networkName,
    chainId: hre.network.config.chainId,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    abi: artifact.abi,
  };

  // Save to network-specific config file
  const configDir = path.join(__dirname, "../src/utils");
  const configPath = path.join(configDir, `contractConfig.${networkName}.json`);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`📄 Config saved to: ${configPath}`);

  // Also update the main contractConfig.json
  const mainConfigPath = path.join(configDir, "contractConfig.json");
  fs.writeFileSync(mainConfigPath, JSON.stringify(config, null, 2));
  console.log(`📄 Main config updated: ${mainConfigPath}`);

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment record
  const deploymentRecord = {
    contractAddress,
    network: networkName,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    transactionHash: landRegistry.deploymentTransaction()?.hash,
  };

  const deploymentPath = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentRecord, null, 2));
  console.log(`📁 Deployment record saved: ${deploymentPath}`);

  console.log("\n-----------------------------------");
  console.log("🎉 Deployment successful!");
  console.log("-----------------------------------\n");

  // Auto-update .env.local with contract address
  const envPath = path.join(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf8");
    const envKey =
      networkName === "sepolia"
        ? "NEXT_PUBLIC_SEPOLIA_CONTRACT_ADDRESS"
        : "NEXT_PUBLIC_HARDHAT_CONTRACT_ADDRESS";

    // Update the contract address in .env.local
    const regex = new RegExp(`^${envKey}=.*$`, "m");
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${envKey}=${contractAddress}`);
    } else {
      envContent += `\n${envKey}=${contractAddress}`;
    }
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Auto-updated ${envKey} in .env.local`);
  }

  if (networkName === "sepolia") {
    console.log("📋 Sepolia deployment complete:");
    console.log(`   • Contract: ${contractAddress}`);
    console.log(
      `   • View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`,
    );
    console.log(
      `   • Verify: npx hardhat verify --network sepolia ${contractAddress}`,
    );
  } else {
    console.log("📋 Hardhat deployment complete:");
    console.log(`   • Contract: ${contractAddress}`);
    console.log(
      `   • Run seed: npx hardhat run scripts/seed.ts --network localhost`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
