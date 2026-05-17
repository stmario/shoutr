// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract ShoutrICO is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;

    uint256 public constant TOKENS_PER_ETH = 10_000;
    uint256 public constant HARD_CAP = 90_000 ether;
    uint256 public constant END_DATE = 1_798_847_999;

    uint256 public totalETHCollected;
    uint256 public totalTokensSold;

    event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokenAmount);
    event ETHWithdrawn(address indexed wallet, uint256 amount);
    event UnsoldTokensWithdrawn(address indexed wallet, uint256 amount);

    constructor(address _tokenAddress) Ownable(msg.sender) {
        require(_tokenAddress != address(0), "Invalid token");
        token = IERC20(_tokenAddress);
    }

    function buyTokens() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Send ETH");
        require(block.timestamp < END_DATE, "ICO ended");
        require(totalETHCollected + msg.value <= HARD_CAP, "Hard cap reached");

        uint256 tokens = msg.value * TOKENS_PER_ETH;
        require(tokens > 0, "ETH amount too small");
        require(token.balanceOf(address(this)) >= tokens, "Not enough tokens");

        totalETHCollected += msg.value;
        totalTokensSold += tokens;

        token.safeTransfer(msg.sender, tokens);

        emit TokensPurchased(msg.sender, msg.value, tokens);
    }

    function withdrawETH(address payable wallet) external onlyOwner nonReentrant {
        require(wallet != address(0), "Invalid wallet");

        uint256 amount = address(this).balance;
        require(amount > 0, "No ETH");

        (bool sent, ) = wallet.call{value: amount}("");
        require(sent, "ETH withdrawal failed");

        emit ETHWithdrawn(wallet, amount);
    }

    function withdrawUnsoldTokens(address wallet) external onlyOwner {
        require(block.timestamp >= END_DATE, "ICO not ended");
        require(wallet != address(0), "Invalid wallet");

        uint256 amount = token.balanceOf(address(this));
        require(amount > 0, "No tokens");

        token.safeTransfer(wallet, amount);

        emit UnsoldTokensWithdrawn(wallet, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
