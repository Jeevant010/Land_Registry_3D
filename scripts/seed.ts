import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { SoulboundLandRegistry } from "../typechain-types";
const { ethers } = hre;

// ES Module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LandData {
  location: string;
  price: string; // in ETH
  surveyNumber: string;
  district: string;
  state: string;
  area: string;
  landType: string;
}

const indianLandData: LandData[] = [
  {
    location: "Plot 45, Sector 62, Noida",
    price: "2.5",
    surveyNumber: "UP/GB/NOI/2024/001",
    district: "Gautam Buddh Nagar",
    state: "Uttar Pradesh",
    area: "250 sq. yards",
    landType: "Residential"
  },
  {
    location: "Survey No. 123, Whitefield, Bangalore",
    price: "4.2",
    surveyNumber: "KA/BLR/WF/2024/002",
    district: "Bangalore Urban",
    state: "Karnataka",
    area: "2400 sq. ft.",
    landType: "Commercial"
  },
  {
    location: "Khasra No. 456, Dwarka Sector 21, New Delhi",
    price: "8.5",
    surveyNumber: "DL/SW/DWK/2024/003",
    district: "South West Delhi",
    state: "Delhi",
    area: "500 sq. yards",
    landType: "Residential"
  },
  {
    location: "RS No. 78, Andheri East, Mumbai",
    price: "12.0",
    surveyNumber: "MH/MUM/AND/2024/004",
    district: "Mumbai Suburban",
    state: "Maharashtra",
    area: "1200 sq. ft.",
    landType: "Commercial"
  },
  {
    location: "Plot 12, DLF Phase 5, Gurugram",
    price: "6.8",
    surveyNumber: "HR/GGN/DLF/2024/005",
    district: "Gurugram",
    state: "Haryana",
    area: "400 sq. yards",
    landType: "Residential"
  },
  {
    location: "Survey No. 234, Rajaji Nagar, Bangalore",
    price: "3.5",
    surveyNumber: "KA/BLR/RN/2024/006",
    district: "Bangalore Urban",
    state: "Karnataka",
    area: "1800 sq. ft.",
    landType: "Mixed Use"
  },
  {
    location: "Khasra No. 89, Banjara Hills, Hyderabad",
    price: "7.2",
    surveyNumber: "TS/HYD/BH/2024/007",
    district: "Hyderabad",
    state: "Telangana",
    area: "3200 sq. ft.",
    landType: "Commercial"
  },
  {
    location: "RS No. 567, Velachery, Chennai",
    price: "2.8",
    surveyNumber: "TN/CHE/VEL/2024/008",
    district: "Chennai",
    state: "Tamil Nadu",
    area: "1500 sq. ft.",
    landType: "Residential"
  },
  {
    location: "Plot 34, Salt Lake Sector V, Kolkata",
    price: "3.2",
    surveyNumber: "WB/KOL/SL/2024/009",
    district: "North 24 Parganas",
    state: "West Bengal",
    area: "2000 sq. ft.",
    landType: "Commercial"
  },
  {
    location: "Survey No. 890, Koregaon Park, Pune",
    price: "5.5",
    surveyNumber: "MH/PUN/KP/2024/010",
    district: "Pune",
    state: "Maharashtra",
    area: "3000 sq. ft.",
    landType: "Residential"
  },
  {
    location: "Khasra No. 112, Vaishali Nagar, Jaipur",
    price: "1.8",
    surveyNumber: "RJ/JAI/VN/2024/011",
    district: "Jaipur",
    state: "Rajasthan",
    area: "300 sq. yards",
    landType: "Residential"
  },
  {
    location: "RS No. 445, Satellite, Ahmedabad",
    price: "4.0",
    surveyNumber: "GJ/AHM/SAT/2024/012",
    district: "Ahmedabad",
    state: "Gujarat",
    area: "2500 sq. ft.",
    landType: "Commercial"
  },
  {
    location: "Plot 78, Aundh, Pune",
    price: "3.8",
    surveyNumber: "MH/PUN/AUN/2024/013",
    district: "Pune",
    state: "Maharashtra",
    area: "1800 sq. ft.",
    landType: "Residential"
  },
  {
    location: "Survey No. 321, Gomti Nagar, Lucknow",
    price: "2.0",
    surveyNumber: "UP/LKO/GN/2024/014",
    district: "Lucknow",
    state: "Uttar Pradesh",
    area: "350 sq. yards",
    landType: "Residential"
  },
  {
    location: "Khasra No. 654, Electronic City, Bangalore",
    price: "5.0",
    surveyNumber: "KA/BLR/EC/2024/015",
    district: "Bangalore Urban",
    state: "Karnataka",
    area: "4000 sq. ft.",
    landType: "Industrial"
  },
  {
    location: "RS No. 223, Powai, Mumbai",
    price: "9.5",
    surveyNumber: "MH/MUM/POW/2024/016",
    district: "Mumbai Suburban",
    state: "Maharashtra",
    area: "1600 sq. ft.",
    landType: "Residential"
  },
  {
    location: "Plot 56, Cyber City, Gurugram",
    price: "11.0",
    surveyNumber: "HR/GGN/CC/2024/017",
    district: "Gurugram",
    state: "Haryana",
    area: "5000 sq. ft.",
    landType: "Commercial"
  },
  {
    location: "Survey No. 789, Madhapur, Hyderabad",
    price: "6.5",
    surveyNumber: "TS/HYD/MAD/2024/018",
    district: "Hyderabad",
    state: "Telangana",
    area: "2800 sq. ft.",
    landType: "Mixed Use"
  },
  {
    location: "Khasra No. 998, Indiranagar, Bangalore",
    price: "7.8",
    surveyNumber: "KA/BLR/IND/2024/019",
    district: "Bangalore Urban",
    state: "Karnataka",
    area: "2200 sq. ft.",
    landType: "Residential"
  },
  {
    location: "RS No. 147, OMR, Chennai",
    price: "4.5",
    surveyNumber: "TN/CHE/OMR/2024/020",
    district: "Chennai",
    state: "Tamil Nadu",
    area: "3500 sq. ft.",
    landType: "Commercial"
  }
];

async function main() {
  console.log("🌱 Starting seed script...\n");

  // Get the deployed contract (use the new contract address from deploy)
  let contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  try {
    const deploymentRecord = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "../deployments/localhost.json"),
        "utf8",
      ),
    );
    if (deploymentRecord.contractAddress) {
      contractAddress = deploymentRecord.contractAddress;
    }
  } catch {
    // Fall back to the default first-deploy address
  }
  const LandRegistry = await ethers.getContractFactory("SoulboundLandRegistry");
  const landRegistry = (await LandRegistry.attach(
    contractAddress,
  )) as unknown as SoulboundLandRegistry;

  // Get signers
  // The contract deployer is the "Government" (only account allowed to mint)
  const [owner, govt, ...users] = await ethers.getSigners();

  console.log("📋 Contract Address:", contractAddress);
  console.log("👑 Government (Owner) Address:", owner.address);
  console.log("\n-----------------------------------\n");

  console.log("\n-----------------------------------\n");
  console.log("🏗️ Registering land parcels...\n");

  // Register lands using different accounts to simulate different owners
  for (let i = 0; i < indianLandData.length; i++) {
    const land = indianLandData[i];
    const signerIndex = i % (users.length > 5 ? 5 : users.length); // Rotate through first 5 users
    const signer = users[signerIndex] || owner;

    // For simplicity, using a placeholder IPFS URI (in production, upload to Pinata first)
    const tokenURI = `ipfs://placeholder/${land.surveyNumber}`;

    try {
      console.log(`${i + 1}. Registering: ${land.location}`);
      console.log(`   📍 ${land.district}, ${land.state}`);
      console.log(`   💰 Price: ${land.price} ETH | Area: ${land.area}`);
      console.log(`   📄 Survey: ${land.surveyNumber}`);

      const tx = await landRegistry
        .connect(owner)
        .mintLandRecord(signer.address, tokenURI);
      const receipt = await tx.wait();
      console.log(`   ✅ Registered! Owner: ${signer.address.slice(0, 10)}...`);
      console.log("");
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message?.slice(0, 80)}`);
      console.log("");
    }
  }

  console.log("-----------------------------------\n");

  // Verify lands are registered
  console.log("📊 Verifying registered lands...\n");
  const totalProperties = await landRegistry.getTotalProperties();
  console.log(`Total lands registered: ${totalProperties}`);

  console.log("\n-----------------------------------");
  console.log("🎉 Seed script completed successfully!");
  console.log("-----------------------------------\n");

  console.log("ℹ️ Quick Reference:");
  console.log("   • Contract Owner (Government):", owner.address);
  console.log("   • Total Properties:", totalProperties.toString());
  console.log("\n   To transfer a land:");
  console.log("   1. Government (owner) calls transferLand(from, to, tokenId)");
  console.log("   2. Citizens cannot transfer tokens themselves (soulbound)\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
