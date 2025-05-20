"use client"

import { ethers } from "ethers"
import VotesABI from "./VotesABI.json"

// Function to get an Ethereum provider
export const getProvider = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum)
  }

  // Fallback to a read-only provider
  return new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_ETHEREUM_PROVIDER_URL)
}

// Function to get the votes contract
export const getVotesContract = (providerOrSigner: any) => {
  const contractAddress = process.env.NEXT_PUBLIC_VOTES_CONTRACT_ADDRESS
  if (!contractAddress) {
    throw new Error("Votes contract address not configured")
  }

  return new ethers.Contract(contractAddress, VotesABI, providerOrSigner)
}

// Vote on a post (upvote or downvote)
export const voteOnPost = async (postId: string, isUpvote: boolean, walletAddress: string) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner(walletAddress)
    const contract = getVotesContract(signer)

    const tx = await contract.vote(postId, isUpvote)
    await tx.wait()

    return { success: true }
  } catch (error) {
    console.error("Error voting on blockchain:", error)
    return { success: false, error }
  }
}

// Get vote count for a post from the blockchain
export const getVoteCount = async (postId: string) => {
  try {
    const provider = getProvider()
    const contract = getVotesContract(provider)

    const voteCount = await contract.getVote(postId)
    return Number(voteCount)
  } catch (error) {
    console.error("Error getting vote count from blockchain:", error)
    return 0
  }
}

// Get user's vote on a post from the blockchain
export const getUserVote = async (postId: string, userAddress: string) => {
  try {
    const provider = getProvider()
    const contract = getVotesContract(provider)

    const voteType = await contract.getVoted(postId, userAddress)

    // Convert the string vote type to a number
    if (voteType === "upvote") return 1
    if (voteType === "downvote") return -1
    return 0
  } catch (error) {
    console.error("Error getting user vote from blockchain:", error)
    return 0
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
