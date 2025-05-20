"use client"

import { ethers } from "ethers"
import ICOABI from "./ICOABI.json"

// Function to get an Ethereum provider
export const getProvider = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum)
  }

  // Fallback to a read-only provider
  return new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_ETHEREUM_PROVIDER_URL)
}

// Function to get the ICO contract
export const getICOContract = (providerOrSigner: any) => {
  const contractAddress = process.env.NEXT_PUBLIC_ICO_CONTRACT_ADDRESS
  if (!contractAddress) {
    throw new Error("ICO contract address not configured")
  }

  return new ethers.Contract(contractAddress, ICOABI, providerOrSigner)
}

// Buy tokens from the ICO
export const buyTokens = async (amount: number, walletAddress: string) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner(walletAddress)
    const contract = getICOContract(signer)

    const tx = await contract.buyTokens(amount)
    await tx.wait()

    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error buying tokens:", error)
    return { success: false, error }
  }
}

// Get token price fraction
export const getTokenPriceFraction = async () => {
  try {
    const provider = getProvider()
    const contract = getICOContract(provider)

    const priceFraction = await contract.priceFraction()
    return Number(priceFraction)
  } catch (error) {
    console.error("Error getting token price fraction:", error)
    return 0
  }
}

// Get token address
export const getTokenAddress = async () => {
  try {
    const provider = getProvider()
    const contract = getICOContract(provider)

    return await contract.tokenAddress()
  } catch (error) {
    console.error("Error getting token address:", error)
    return null
  }
}

// Get USDT address
export const getUSDTAddress = async () => {
  try {
    const provider = getProvider()
    const contract = getICOContract(provider)

    return await contract.usdtAddress()
  } catch (error) {
    console.error("Error getting USDT address:", error)
    return null
  }
}

// Check if a wallet is connected
export const isWalletConnected = async () => {
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      return false
    }

    const provider = new ethers.BrowserProvider(window.ethereum)
    const accounts = await provider.listAccounts()

    return accounts.length > 0
  } catch (error) {
    console.error("Error checking wallet connection:", error)
    return false
  }
}

// Connect wallet
export const connectWallet = async () => {
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask is not installed")
    }

    const provider = new ethers.BrowserProvider(window.ethereum)
    await provider.send("eth_requestAccounts", [])

    const signer = await provider.getSigner()
    const address = await signer.getAddress()

    return { success: true, address }
  } catch (error) {
    console.error("Error connecting wallet:", error)
    return { success: false, error }
  }
}

// Get wallet balance
export const getWalletBalance = async (address: string) => {
  try {
    const provider = getProvider()
    const balance = await provider.getBalance(address)

    return ethers.formatEther(balance)
  } catch (error) {
    console.error("Error getting wallet balance:", error)
    return "0"
  }
}
