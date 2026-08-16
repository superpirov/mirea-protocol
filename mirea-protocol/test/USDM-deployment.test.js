const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("USDM Stablecoin - Deployment Script Test", function () {
  let usdm;
  let owner, addr1;
  
  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    const USDM = await ethers.getContractFactory("USDM");
    usdm = await USDM.deploy();
    await usdm.waitForDeployment();
  });
  
  it("Should deploy successfully and have correct properties", async function () {
    expect(await usdm.name()).to.equal("USDM");
    expect(await usdm.symbol()).to.equal("USDM");
    expect(await usdm.decimals()).to.equal(18);
    expect(await usdm.totalSupply()).to.equal(0);
  });
  
  it("Should allow minting after deployment", async function () {
    const mintAmount = ethers.parseEther("10000");
    await usdm.connect(owner).mint(addr1.address, mintAmount);
    
    expect(await usdm.balanceOf(addr1.address)).to.equal(mintAmount);
  });
});
