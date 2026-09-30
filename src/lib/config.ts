// Centralized contract configuration
export const CONTRACTS = {
  // PlasticPenny Token (PPEN) - ERC20 token for rewards
  PLASTIC_PENNY: "0xd975232a55C083f30598EEacA02E71DB4FE04822",

  // Redemption Contract - For redeeming PPEN tokens for ETH
  REDEMPTION: "0x72abb9a7f252B755a9E1d6f2411835a3Ef167a46",

  // Payment Handler - For receiving payments (education, analytics, products)
  PAYMENT_HANDLER: "0xdef685F9C502D055343BAC1A1d635AfDE808888b",
} as const;

// Supported chain configuration
export const CHAIN_CONFIG = {
  BASE_SEPOLIA: {
    chainId: 84532,
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
  },
} as const;

// Token configuration (legacy on-chain PPEN, still used by the redemption marketplace)
export const TOKEN_CONFIG = {
  DECIMALS: 18,
  SYMBOL: "PPEN",
  NAME: "PlasticPenny",
  // Reward rate: tokens per kg of waste collected
  REWARD_RATE_PER_KG: 0.1,
} as const;

// Blink (Bitcoin Lightning wallet) configuration — PPEN rewards are paid as sats
export const BLINK_CONFIG = {
  // Domain used to build a recipient's Lightning Address: <username>@<domain>
  DOMAIN: (import.meta.env.VITE_BLINK_DOMAIN as string) || "blink.sv",
  // Reward rate: sats per kg of waste collected
  SATS_PER_KG: Number(import.meta.env.VITE_SATS_PER_KG) || 10,
} as const;

// Comma-separated admin Blink usernames can also be set via VITE_ADMIN_BLINK_USERNAMES in .env
export const ADMIN_BLINK_USERNAMES: string[] = [];

// Nearby submissions within this radius are flagged as possible duplicates
export const DUPLICATE_RADIUS_METERS = 75;
