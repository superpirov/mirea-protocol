const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("USDM Stablecoin", function () {
  let usdm;
  let owner, addr1, addr2, minter, pauser;
  
  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1 million USDM
  
  beforeEach(async function () {
    [owner, addr1, addr2, minter, pauser] = await ethers.getSigners();
    
    const USDM = await ethers.getContractFactory("USDM");
    usdm = await USDM.deploy();
    await usdm.waitForDeployment();
  });
  
  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await usdm.name()).to.equal("USDM");
      expect(await usdm.symbol()).to.equal("USDM");
      expect(await usdm.decimals()).to.equal(18);
    });
    
    it("Should assign initial roles to deployer", async function () {
      expect(await usdm.hasRole(await usdm.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
      expect(await usdm.hasRole(await usdm.MINTER_ROLE(), owner.address)).to.be.true;
      expect(await usdm.hasRole(await usdm.PAUSER_ROLE(), owner.address)).to.be.true;
      expect(await usdm.hasRole(await usdm.BURNER_ROLE(), owner.address)).to.be.true;
    });
    
    it("Should have zero initial supply", async function () {
      expect(await usdm.totalSupply()).to.equal(0);
    });
  });
  
  describe("Minting", function () {
    it("Should allow minter to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      
      await usdm.connect(owner).mint(addr1.address, mintAmount);
      
      expect(await usdm.balanceOf(addr1.address)).to.equal(mintAmount);
      expect(await usdm.totalSupply()).to.equal(mintAmount);
    });
    
    it("Should not allow non-minter to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      
      await expect(usdm.connect(addr1).mint(addr1.address, mintAmount))
        .to.be.revertedWithCustomError(usdm, "AccessControlUnauthorizedAccount");
    });
    
    it("Should emit TokensMinted event", async function () {
      const mintAmount = ethers.parseEther("500");
      
      await expect(usdm.connect(owner).mint(addr1.address, mintAmount))
        .to.emit(usdm, "TokensMinted")
        .withArgs(addr1.address, mintAmount);
    });
    
    it("Should fail to mint to zero address", async function () {
      const mintAmount = ethers.parseEther("100");
      
      await expect(usdm.connect(owner).mint(ethers.ZeroAddress, mintAmount))
        .to.be.revertedWith("USDM: mint to zero address");
    });
  });
  
  describe("Burning", function () {
    beforeEach(async function () {
      const mintAmount = ethers.parseEther("1000");
      await usdm.connect(owner).mint(addr1.address, mintAmount);
    });
    
    it("Should allow burner to burn tokens", async function () {
      const burnAmount = ethers.parseEther("100");
      
      await usdm.connect(owner).connect(addr1).approve(owner.address, burnAmount);
      await usdm.connect(owner).burnFrom(addr1.address, burnAmount);
      
      expect(await usdm.balanceOf(addr1.address)).to.equal(ethers.parseEther("900"));
      expect(await usdm.totalSupply()).to.equal(ethers.parseEther("900"));
    });
    
    it("Should emit TokensBurned event", async function () {
      const burnAmount = ethers.parseEther("50");
      
      await usdm.connect(owner).connect(addr1).approve(owner.address, burnAmount);
      
      await expect(usdm.connect(owner).burnFrom(addr1.address, burnAmount))
        .to.emit(usdm, "TokensBurned")
        .withArgs(addr1.address, burnAmount);
    });
  });
  
  describe("Collateral Operations", function () {
    it("Should allow depositing collateral and minting USDM", async function () {
      const collateralAmount = ethers.parseEther("1000");
      
      await expect(usdm.connect(addr1).depositCollateralAndMint(collateralAmount))
        .to.emit(usdm, "CollateralDeposited")
        .withArgs(addr1.address, collateralAmount)
        .to.emit(usdm, "TokensMinted")
        .withArgs(addr1.address, collateralAmount);
      
      expect(await usdm.balanceOf(addr1.address)).to.equal(collateralAmount);
      expect(await usdm.collateralBalances(addr1.address)).to.equal(collateralAmount);
      expect(await usdm.totalCollateral()).to.equal(collateralAmount);
    });
    
    it("Should allow burning USDM and withdrawing collateral", async function () {
      const collateralAmount = ethers.parseEther("1000");
      const withdrawAmount = ethers.parseEther("300");
      
      // First deposit collateral
      await usdm.connect(addr1).depositCollateralAndMint(collateralAmount);
      
      // Then burn and withdraw
      await expect(usdm.connect(addr1).burnAndWithdrawCollateral(withdrawAmount))
        .to.emit(usdm, "TokensBurned")
        .withArgs(addr1.address, withdrawAmount)
        .to.emit(usdm, "CollateralWithdrawn")
        .withArgs(addr1.address, withdrawAmount);
      
      expect(await usdm.balanceOf(addr1.address)).to.equal(ethers.parseEther("700"));
      expect(await usdm.collateralBalances(addr1.address)).to.equal(ethers.parseEther("700"));
      expect(await usdm.totalCollateral()).to.equal(ethers.parseEther("700"));
    });
    
    it("Should fail to withdraw more collateral than deposited", async function () {
      const collateralAmount = ethers.parseEther("500");
      const withdrawAmount = ethers.parseEther("600");
      
      await usdm.connect(addr1).depositCollateralAndMint(collateralAmount);
      
      await expect(usdm.connect(addr1).burnAndWithdrawCollateral(withdrawAmount))
        .to.be.revertedWith("USDM: insufficient collateral balance");
    });
  });
  
  describe("Pause/Unpause", function () {
    beforeEach(async function () {
      const mintAmount = ethers.parseEther("1000");
      await usdm.connect(owner).mint(addr1.address, mintAmount);
    });
    
    it("Should allow pauser to pause contract", async function () {
      await usdm.connect(owner).pause();
      expect(await usdm.paused()).to.be.true;
    });
    
    it("Should prevent transfers when paused", async function () {
      await usdm.connect(owner).pause();
      
      const transferAmount = ethers.parseEther("100");
      await expect(usdm.connect(addr1).transfer(addr2.address, transferAmount))
        .to.be.revertedWithCustomError(usdm, "EnforcedPause");
    });
    
    it("Should prevent minting when paused", async function () {
      await usdm.connect(owner).pause();
      
      const mintAmount = ethers.parseEther("100");
      await expect(usdm.connect(owner).mint(addr1.address, mintAmount))
        .to.be.revertedWithCustomError(usdm, "EnforcedPause");
    });
    
    it("Should allow pauser to unpause contract", async function () {
      await usdm.connect(owner).pause();
      await usdm.connect(owner).unpause();
      
      expect(await usdm.paused()).to.be.false;
      
      // Transfers should work again
      const transferAmount = ethers.parseEther("100");
      await usdm.connect(addr1).transfer(addr2.address, transferAmount);
      expect(await usdm.balanceOf(addr2.address)).to.equal(transferAmount);
    });
    
    it("Should not allow non-pauser to pause", async function () {
      await expect(usdm.connect(addr1).pause())
        .to.be.revertedWithCustomError(usdm, "AccessControlUnauthorizedAccount");
    });
  });
  
  describe("Transfers", function () {
    beforeEach(async function () {
      const mintAmount = ethers.parseEther("1000");
      await usdm.connect(owner).mint(addr1.address, mintAmount);
    });
    
    it("Should allow token transfers", async function () {
      const transferAmount = ethers.parseEther("100");
      
      await usdm.connect(addr1).transfer(addr2.address, transferAmount);
      
      expect(await usdm.balanceOf(addr1.address)).to.equal(ethers.parseEther("900"));
      expect(await usdm.balanceOf(addr2.address)).to.equal(transferAmount);
    });
    
    it("Should allow approve and transferFrom", async function () {
      const approveAmount = ethers.parseEther("200");
      const transferAmount = ethers.parseEther("100");
      
      await usdm.connect(addr1).approve(owner.address, approveAmount);
      await usdm.connect(owner).transferFrom(addr1.address, addr2.address, transferAmount);
      
      expect(await usdm.balanceOf(addr1.address)).to.equal(ethers.parseEther("900"));
      expect(await usdm.balanceOf(addr2.address)).to.equal(transferAmount);
      expect(await usdm.allowance(addr1.address, owner.address)).to.equal(ethers.parseEther("100"));
    });
    
    it("Should fail to transfer to zero address", async function () {
      const transferAmount = ethers.parseEther("100");
      
      await expect(usdm.connect(addr1).transfer(ethers.ZeroAddress, transferAmount))
        .to.be.revertedWithCustomError(usdm, "ERC20InvalidReceiver");
    });
  });
  
  describe("Role Management", function () {
    it("Should allow admin to grant minter role", async function () {
      await usdm.connect(owner).grantRole(await usdm.MINTER_ROLE(), minter.address);
      
      expect(await usdm.hasRole(await usdm.MINTER_ROLE(), minter.address)).to.be.true;
      
      const mintAmount = ethers.parseEther("500");
      await usdm.connect(minter).mint(addr1.address, mintAmount);
      expect(await usdm.balanceOf(addr1.address)).to.equal(mintAmount);
    });
    
    it("Should allow admin to revoke minter role", async function () {
      await usdm.connect(owner).grantRole(await usdm.MINTER_ROLE(), minter.address);
      await usdm.connect(owner).revokeRole(await usdm.MINTER_ROLE(), minter.address);
      
      expect(await usdm.hasRole(await usdm.MINTER_ROLE(), minter.address)).to.be.false;
      
      const mintAmount = ethers.parseEther("500");
      await expect(usdm.connect(minter).mint(addr1.address, mintAmount))
        .to.be.revertedWithCustomError(usdm, "AccessControlUnauthorizedAccount");
    });
    
    it("Should not allow non-admin to grant roles", async function () {
      await expect(usdm.connect(addr1).grantRole(await usdm.MINTER_ROLE(), minter.address))
        .to.be.revertedWithCustomError(usdm, "AccessControlUnauthorizedAccount");
    });
  });
});
