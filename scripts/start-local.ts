import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const { ethers } = hre;

// ES Module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This script deploys and seeds in-process, perfect for development
async function main() {
  console.log("\n🚀 Starting LandTrust Local Development Setup...\n");

  // Deploy Contract
  console.log("📦 Deploying SoulboundLandRegistry contract...");
  const [deployer, governmentOfficial] = await ethers.getSigners();
  console.log(`   Deployer (Government): ${deployer.address}`);
  console.log(`   Sample citizen: ${governmentOfficial.address}`);

  const LandRegistry = await ethers.getContractFactory("SoulboundLandRegistry");
  const landRegistry = await LandRegistry.deploy(deployer.address);
  await landRegistry.waitForDeployment();

  const contractAddress = await landRegistry.getAddress();
  console.log(`\n✅ SoulboundLandRegistry deployed to: ${contractAddress}`);

  // Save config
  const configPath = path.join(
    __dirname,
    "..",
    "src",
    "utils",
    "contractConfig.json",
  );
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "LandRegistry.sol",
    "SoulboundLandRegistry.json",
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

  const config = {
    address: contractAddress,
    abi: artifact.abi,
    network: "hardhat",
    chainId: 31337,
    deployedAt: new Date().toISOString(),
    governmentOfficial: deployer.address,
    deployer: deployer.address,
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`\n📄 Config saved to: ${configPath}`);

  // Auto-update .env.local with contract address
  const envPath = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf-8");
    const envKey = "NEXT_PUBLIC_HARDHAT_CONTRACT_ADDRESS";
    const regex = new RegExp(`^${envKey}=.*$`, "m");
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${envKey}=${contractAddress}`);
    } else {
      envContent += `\n${envKey}=${contractAddress}`;
    }
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Auto-updated ${envKey} in .env.local`);
  }

  // Seed Data - 20 Indian lands
  console.log("\n🌱 Seeding 20 land parcels...");

  const indianLands = [
    {
      location: "Survey No. 123, Koramangala, Bangalore, Karnataka - 560034",
      price: "25",
      lat: 12.9352,
      lng: 77.6245,
    },
    {
      location: "Plot No. 45, Banjara Hills, Hyderabad, Telangana - 500034",
      price: "35",
      lat: 17.4156,
      lng: 78.4347,
    },
    {
      location: "Khasra No. 789, Sector 62, Noida, Uttar Pradesh - 201301",
      price: "18",
      lat: 28.627,
      lng: 77.3732,
    },
    {
      location: "Survey No. 456, Whitefield, Bangalore, Karnataka - 560066",
      price: "28",
      lat: 12.9698,
      lng: 77.75,
    },
    {
      location: "Plot No. 78, Powai, Mumbai, Maharashtra - 400076",
      price: "45",
      lat: 19.1176,
      lng: 72.906,
    },
    {
      location: "Khasra No. 234, DLF Phase 5, Gurgaon, Haryana - 122002",
      price: "55",
      lat: 28.4436,
      lng: 77.086,
    },
    {
      location: "Survey No. 567, OMR Road, Chennai, Tamil Nadu - 600119",
      price: "22",
      lat: 12.901,
      lng: 80.2279,
    },
    {
      location: "Plot No. 89, Salt Lake, Kolkata, West Bengal - 700091",
      price: "20",
      lat: 22.58,
      lng: 88.42,
    },
    {
      location: "Khasra No. 345, Hinjewadi, Pune, Maharashtra - 411057",
      price: "30",
      lat: 18.5912,
      lng: 73.738,
    },
    {
      location: "Survey No. 678, GIFT City, Gandhinagar, Gujarat - 382355",
      price: "40",
      lat: 23.1547,
      lng: 72.64,
    },
    {
      location: "Plot No. 12, Cyber City, Gurgaon, Haryana - 122001",
      price: "60",
      lat: 28.494,
      lng: 77.0887,
    },
    {
      location:
        "Survey No. 890, Electronic City, Bangalore, Karnataka - 560100",
      price: "20",
      lat: 12.8456,
      lng: 77.6603,
    },
    {
      location: "Khasra No. 456, Sector 44, Chandigarh - 160047",
      price: "32",
      lat: 30.7247,
      lng: 76.7536,
    },
    {
      location: "Plot No. 34, Hitech City, Hyderabad, Telangana - 500081",
      price: "38",
      lat: 17.4435,
      lng: 78.3772,
    },
    {
      location: "Survey No. 123, Siruseri, Chennai, Tamil Nadu - 603103",
      price: "19",
      lat: 12.8231,
      lng: 80.2198,
    },
    {
      location: "Khasra No. 567, Magarpatta, Pune, Maharashtra - 411028",
      price: "27",
      lat: 18.5143,
      lng: 73.9318,
    },
    {
      location: "Plot No. 56, Navi Mumbai, Maharashtra - 400703",
      price: "33",
      lat: 19.0368,
      lng: 73.0158,
    },
    {
      location: "Survey No. 234, Sarjapur Road, Bangalore, Karnataka - 560035",
      price: "24",
      lat: 12.9103,
      lng: 77.686,
    },
    {
      location: "Khasra No. 789, Greater Noida, Uttar Pradesh - 201308",
      price: "15",
      lat: 28.4744,
      lng: 77.504,
    },
    {
      location: "Plot No. 90, Andheri East, Mumbai, Maharashtra - 400069",
      price: "50",
      lat: 19.1136,
      lng: 72.8697,
    },
  ];

  let landCount = 0;
  for (const land of indianLands) {
    try {
      const metadataURI = JSON.stringify({
        latitude: land.lat,
        longitude: land.lng,
        area: Math.floor(Math.random() * 5000) + 1000,
        unit: "sq.ft",
        description: `Prime property at ${land.location.split(",")[0]}`,
      });

      // Rotate through the first 5 citizen accounts as land owners
      const signers = await ethers.getSigners();
      const citizen = signers[1 + (landCount % 5)];

      const tx = await landRegistry.mintLandRecord(
        citizen.address,
        metadataURI,
      );
      await tx.wait();
      landCount++;
      console.log(
        `   ✅ Registered land ${landCount}/20: ${land.location.substring(0, 40)}...`,
      );
    } catch (error) {
      console.error(
        `   ❌ Failed to register: ${land.location.substring(0, 40)}...`,
      );
    }
  }

  console.log(`\n🎉 Setup complete! ${landCount} lands registered.`);
  console.log("\n📋 Summary:");
  console.log(`   Contract Address: ${contractAddress}`);
  console.log(`   Government (Owner): ${deployer.address}`);
  console.log(`   Lands Registered: ${landCount}`);
  console.log(
    "\n⚠️  Note: This runs in-process. For persistent local testing,",
  );
  console.log("   you need to run 'npx hardhat node' in a separate terminal");
  console.log(
    "   and then deploy with 'npx hardhat run scripts/deploy-network.ts --network localhost'\n",
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
