import { ethers } from 'ethers';
import { MantlememoContract } from '../contracts/MantlememoContract';

export interface PaymentResult {
  hash: string;
  success: boolean;
  error?: string;
}

export interface ContractQueryResult {
  hash: string;
  success: boolean;
  error?: string;
}

// Legacy direct payment function (for backward compatibility)
export async function sendPayment(
  signer: ethers.JsonRpcSigner,
  recipientAddress: string,
  amountETH: number
): Promise<PaymentResult> {
  try {
    if (amountETH <= 0) {
      return {
        hash: '',
        success: false,
        error: 'Payment amount must be greater than 0'
      };
    }

    // Validate recipient address
    if (!ethers.isAddress(recipientAddress)) {
      return {
        hash: '',
        success: false,
        error: 'Invalid recipient wallet address'
      };
    }

    // Convert ETH to Wei
    const amountWei = ethers.parseEther(amountETH.toString());

    // Create transaction
    const transaction = {
      to: recipientAddress,
      value: amountWei,
    };

    // Send transaction
    const txResponse = await signer.sendTransaction(transaction);

    // Wait for confirmation
    const receipt = await txResponse.wait();

    if (!receipt) {
      throw new Error('Transaction failed');
    }

    return {
      hash: txResponse.hash,
      success: true
    };
  } catch (error) {
    console.error('Payment error:', error);

    let errorMessage = 'Payment failed';
    if (error instanceof Error) {
      if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient ETH balance';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      hash: '',
      success: false,
      error: errorMessage
    };
  }
}

export function getMantleExplorerUrl(hash: string): string {
  return `https://explorer.sepolia.mantle.xyz/tx/${hash}`;
}

// Smart contract-based capsule query payment
export async function queryCapsuleWithContract(
  signer: ethers.JsonRpcSigner,
  creatorAddress: string,
  capsuleId: string,
  priceInEther: string
): Promise<ContractQueryResult> {
  try {
    const contract = new MantlememoContract(signer);
    
    // Execute the queryCapsule function on the smart contract
    const txResponse = await contract.queryCapsule(creatorAddress, capsuleId, priceInEther);
    
    // Wait for confirmation
    const receipt = await txResponse.wait();
    
    if (!receipt) {
      throw new Error('Transaction failed');
    }

    return {
      hash: txResponse.hash,
      success: true
    };
  } catch (error) {
    console.error('Contract query error:', error);

    let errorMessage = 'Query payment failed';
    if (error instanceof Error) {
      if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled by user';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient ETH balance';
      } else if (error.message.includes('CapsuleNotFound')) {
        errorMessage = 'Capsule not found on blockchain';
      } else if (error.message.includes('InsufficientPayment')) {
        errorMessage = 'Payment amount is too low';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      hash: '',
      success: false,
      error: errorMessage
    };
  }
}

// Smart contract-based staking
export async function stakeOnCapsule(
  signer: ethers.JsonRpcSigner,
  capsuleId: string,
  amountInEther: string
): Promise<ContractQueryResult> {
  try {
    const contract = new MantlememoContract(signer);
    
    // Execute the stake function on the smart contract
    const txResponse = await contract.stake(capsuleId, amountInEther);
    
    // Wait for confirmation
    const receipt = await txResponse.wait();
    
    if (!receipt) {
      throw new Error('Transaction failed');
    }

    return {
      hash: txResponse.hash,
      success: true
    };
  } catch (error) {
    console.error('Staking error:', error);

    let errorMessage = 'Staking failed';
    if (error instanceof Error) {
      if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled by user';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient ETH balance';
      } else if (error.message.includes('StakeTooHigh')) {
        errorMessage = 'Stake amount exceeds maximum limit';
      } else if (error.message.includes('Unauthorized')) {
        errorMessage = 'Only capsule owner can stake';
      } else if (error.message.includes('CapsuleNotFound')) {
        errorMessage = 'Capsule not found on blockchain';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      hash: '',
      success: false,
      error: errorMessage
    };
  }
}