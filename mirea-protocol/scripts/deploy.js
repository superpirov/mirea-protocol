const hre = require("hardhat");

async function main() {
  console.log("Deploying USDM Stablecoin for Mirea Protocol...");
  
  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");
  
  // Deploy USDM contract
  const USDM = await hre.ethers.getContractFactory("USDM");
  const usdm = await USDM.deploy();
  await usdm.waitForDeployment();
  
  const usdmAddress = await usdm.getAddress();
  console.log("USDM deployed to:", usdmAddress);
  
  // Verify deployment
  console.log("\n--- Verification ---");
  console.log("Name:", await usdm.name());
  console.log("Symbol:", await usdm.symbol());
  console.log("Decimals:", await usdm.decimals());
  console.log("Total Supply:", hre.ethers.formatEther(await usdm.totalSupply()), "USDM");
  
  // Verify roles
  const DEFAULT_ADMIN_ROLE = await usdm.DEFAULT_ADMIN_ROLE();
  const MINTER_ROLE = await usdm.MINTER_ROLE();
  const PAUSER_ROLE = await usdm.PAUSER_ROLE();
  const BURNER_ROLE = await usdm.BURNER_ROLE();
  
  console.log("\n--- Roles ---");
  console.log("Deployer has DEFAULT_ADMIN_ROLE:", await usdm.hasRole(DEFAULT_ADMIN_ROLE, deployer.address));
  console.log("Deployer has MINTER_ROLE:", await usdm.hasRole(MINTER_ROLE, deployer.address));
  console.log("Deployer has PAUSER_ROLE:", await usdm.hasRole(PAUSER_ROLE, deployer.address));
  console.log("Deployer has BURNER_ROLE:", await usdm.hasRole(BURNER_ROLE, deployer.address));
  
  console.log("\n--- Initial Test ---");
  // Mint some tokens for testing
  const mintAmount = hre.ethers.parseEther("1000000"); // 1 million USDM
  await usdm.mint(deployer.address, mintAmount);
  
  console.log("Minted:", hre.ethers.formatEther(mintAmount), "USDM");
  console.log("Deployer balance:", hre.ethers.formatEther(await usdm.balanceOf(deployer.address)), "USDM");
  console.log("Total Supply:", hre.ethers.formatEther(await usdm.totalSupply()), "USDM");
  
  console.log("\n✅ USDM Stablecoin deployment successful!");
  console.log("\nContract Address:", usdmAddress);
  console.log("\nRemember to:");
  console.log("1. Verify the contract on Etherscan (if deploying to mainnet/testnet)");
  console.log("2. Transfer appropriate roles to multi-sig or governance contracts");
  console.log("3. Set up collateral management systems");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
