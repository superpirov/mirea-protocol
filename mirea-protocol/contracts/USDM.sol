// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title USDM - Native Stablecoin of Mirea Protocol
 * @dev Fully collateralized stablecoin pegged to USD with mint/burn mechanism
 */
contract USDM is ERC20, ERC20Burnable, ERC20Permit, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    
    // Events
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event CollateralDeposited(address indexed depositor, uint256 amount);
    event CollateralWithdrawn(address indexed withdrawer, uint256 amount);
    
    // Collateral tracking (for transparency)
    mapping(address => uint256) public collateralBalances;
    uint256 public totalCollateral;
    
    constructor() 
        ERC20("USDM", "USDM")
        ERC20Permit("USDM")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
    }
    
    /**
     * @dev Mint new USDM tokens (only for addresses with MINTER_ROLE)
     * Used when users deposit collateral
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(to != address(0), "USDM: mint to zero address");
        require(amount > 0, "USDM: mint amount must be greater than 0");
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    /**
     * @dev Burn USDM tokens from caller's balance
     * Used when users want to redeem collateral
     */
    function burn(uint256 amount) public override onlyRole(BURNER_ROLE) whenNotPaused {
        super.burn(amount);
        emit TokensBurned(msg.sender, amount);
    }
    
    /**
     * @dev Burn USDM tokens from a specific account
     * Used by authorized burners (e.g., for redemptions)
     */
    function burnFrom(address account, uint256 amount) public override onlyRole(BURNER_ROLE) whenNotPaused {
        super.burnFrom(account, amount);
        emit TokensBurned(account, amount);
    }
    
    /**
     * @dev Deposit collateral and mint corresponding USDM
     * This is a simplified model - in production, you'd integrate with actual collateral mechanisms
     */
    function depositCollateralAndMint(uint256 collateralAmount) external whenNotPaused returns (uint256) {
        require(collateralAmount > 0, "USDM: collateral amount must be greater than 0");
        
        // In a real implementation, this would handle actual collateral (e.g., ETH, other tokens)
        // For now, we track it internally and mint 1:1 USDM
        collateralBalances[msg.sender] += collateralAmount;
        totalCollateral += collateralAmount;
        
        // Mint equivalent USDM (1:1 ratio for simplicity)
        uint256 usdmAmount = collateralAmount;
        _mint(msg.sender, usdmAmount);
        
        emit CollateralDeposited(msg.sender, collateralAmount);
        emit TokensMinted(msg.sender, usdmAmount);
        
        return usdmAmount;
    }
    
    /**
     * @dev Burn USDM and withdraw collateral
     */
    function burnAndWithdrawCollateral(uint256 usdmAmount) external whenNotPaused returns (uint256) {
        require(usdmAmount > 0, "USDM: amount must be greater than 0");
        require(collateralBalances[msg.sender] >= usdmAmount, "USDM: insufficient collateral balance");
        
        // Burn USDM
        _burn(msg.sender, usdmAmount);
        
        // Withdraw collateral
        collateralBalances[msg.sender] -= usdmAmount;
        totalCollateral -= usdmAmount;
        
        emit TokensBurned(msg.sender, usdmAmount);
        emit CollateralWithdrawn(msg.sender, usdmAmount);
        
        return usdmAmount;
    }
    
    /**
     * @dev Pause all token transfers and operations
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause all token transfers and operations
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Get collateral balance for an address
     */
    function getCollateralBalance(address account) external view returns (uint256) {
        return collateralBalances[account];
    }
    
    /**
     * @dev Override transfer to add pause functionality
     */
    function transfer(address to, uint256 amount) public override whenNotPaused returns (bool) {
        return super.transfer(to, amount);
    }
    
    /**
     * @dev Override transferFrom to add pause functionality
     */
    function transferFrom(address from, address to, uint256 amount) public override whenNotPaused returns (bool) {
        return super.transferFrom(from, to, amount);
    }
}
