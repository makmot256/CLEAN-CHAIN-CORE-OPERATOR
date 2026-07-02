// Centralized contract configuration
export const CONTRACTS = {
  // PlasticPenny Token (PPEN) - ERC20 token for rewards
  PLASTIC_PENNY: '0xd975232a55C083f30598EEacA02E71DB4FE04822',
  
  // Redemption Contract - For redeeming PPEN tokens for ETH
  REDEMPTION: '0x72abb9a7f252B755a9E1d6f2411835a3Ef167a46',
  
  // Payment Handler - For receiving payments (education, analytics, products)
  PAYMENT_HANDLER: '0xdef685F9C502D055343BAC1A1d635AfDE808888b',
} as const;

// Supported chain configuration
export const CHAIN_CONFIG = {
  BASE_SEPOLIA: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
  },
} as const;

// Token configuration
export const TOKEN_CONFIG = {
  DECIMALS: 18,
  SYMBOL: 'PPEN',
  NAME: 'PlasticPenny',
  // Reward rate: tokens per kg of waste collected
  REWARD_RATE_PER_KG: 0.1,
} as const;
