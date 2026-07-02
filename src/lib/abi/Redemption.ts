// Redemption Contract ABI - For redeeming PPEN tokens for ETH
export const RedemptionABI = [
  { "type": "constructor", "inputs": [{ "name": "_token", "type": "address", "internalType": "address" }], "stateMutability": "nonpayable" },
  { "type": "receive", "stateMutability": "payable" },
  { "type": "function", "name": "EXCHANGE_RATE_WEI_PER_PENNY", "inputs": [], "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }], "stateMutability": "view" },
  { "type": "function", "name": "FIXED_PAYOUT_WEI", "inputs": [], "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }], "stateMutability": "view" },
  { "type": "function", "name": "getEthForPPEN", "inputs": [{ "name": "ppenAmount", "type": "uint256", "internalType": "uint256" }], "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }], "stateMutability": "pure" },
  { "type": "function", "name": "owner", "inputs": [], "outputs": [{ "name": "", "type": "address", "internalType": "address" }], "stateMutability": "view" },
  { "type": "function", "name": "redeem", "inputs": [{ "name": "ppenAmount", "type": "uint256", "internalType": "uint256" }], "outputs": [], "stateMutability": "nonpayable" },
  { "type": "function", "name": "renounceOwnership", "inputs": [], "outputs": [], "stateMutability": "nonpayable" },
  { "type": "function", "name": "token", "inputs": [], "outputs": [{ "name": "", "type": "address", "internalType": "contract IERC20Burnable" }], "stateMutability": "view" },
  { "type": "function", "name": "transferOwnership", "inputs": [{ "name": "newOwner", "type": "address", "internalType": "address" }], "outputs": [], "stateMutability": "nonpayable" },
  { "type": "function", "name": "withdrawETH", "inputs": [{ "name": "amount", "type": "uint256", "internalType": "uint256" }], "outputs": [], "stateMutability": "nonpayable" },
  { "type": "event", "name": "OwnershipTransferred", "inputs": [{ "name": "previousOwner", "type": "address", "indexed": true, "internalType": "address" }, { "name": "newOwner", "type": "address", "indexed": true, "internalType": "address" }], "anonymous": false },
  { "type": "event", "name": "Redeemed", "inputs": [{ "name": "user", "type": "address", "indexed": true, "internalType": "address" }, { "name": "ppenAmount", "type": "uint256", "indexed": false, "internalType": "uint256" }, { "name": "ethPaid", "type": "uint256", "indexed": false, "internalType": "uint256" }], "anonymous": false },
  { "type": "error", "name": "OwnableInvalidOwner", "inputs": [{ "name": "owner", "type": "address", "internalType": "address" }] },
  { "type": "error", "name": "OwnableUnauthorizedAccount", "inputs": [{ "name": "account", "type": "address", "internalType": "address" }] }
];

export default RedemptionABI;
