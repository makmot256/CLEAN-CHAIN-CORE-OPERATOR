// Payment Handler Contract ABI - For receiving payments (education, analytics, products)
export const PaymentHandlerABI = [
  { "type": "constructor", "inputs": [{ "name": "_appWallet", "type": "address", "internalType": "address" }], "stateMutability": "nonpayable" },
  { "type": "receive", "stateMutability": "payable" },
  { "type": "function", "name": "addProductWithPayment", "inputs": [{ "name": "productName", "type": "string", "internalType": "string" }, { "name": "price", "type": "uint256", "internalType": "uint256" }], "outputs": [], "stateMutability": "payable" },
  { "type": "function", "name": "appWallet", "inputs": [], "outputs": [{ "name": "", "type": "address", "internalType": "address" }], "stateMutability": "view" },
  { "type": "function", "name": "emergencyWithdraw", "inputs": [], "outputs": [], "stateMutability": "nonpayable" },
  { "type": "function", "name": "owner", "inputs": [], "outputs": [{ "name": "", "type": "address", "internalType": "address" }], "stateMutability": "view" },
  { "type": "function", "name": "receiveLogisticsPayment", "inputs": [], "outputs": [], "stateMutability": "payable" },
  { "type": "function", "name": "receiveUserPayment", "inputs": [], "outputs": [], "stateMutability": "payable" },
  { "type": "function", "name": "updateAppWallet", "inputs": [{ "name": "_newWallet", "type": "address", "internalType": "address" }], "outputs": [], "stateMutability": "nonpayable" },
  { "type": "event", "name": "LogisticsPaymentReceived", "inputs": [{ "name": "org", "type": "address", "indexed": true, "internalType": "address" }, { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" }], "anonymous": false },
  { "type": "event", "name": "ProductAddedWithPayment", "inputs": [{ "name": "org", "type": "address", "indexed": true, "internalType": "address" }, { "name": "productName", "type": "string", "indexed": false, "internalType": "string" }, { "name": "price", "type": "uint256", "indexed": false, "internalType": "uint256" }, { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" }], "anonymous": false },
  { "type": "event", "name": "UserPaymentReceived", "inputs": [{ "name": "user", "type": "address", "indexed": true, "internalType": "address" }, { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" }], "anonymous": false }
];

export default PaymentHandlerABI;
