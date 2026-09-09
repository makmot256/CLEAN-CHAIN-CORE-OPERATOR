# 🌍 CleanChain Core Operator

<div align="center">

![CleanChain Logo](https://img.shields.io/badge/CleanChain-Core_Operator-00C853?style=for-the-badge&logo=recycle&logoColor=white)

**Turn Plastic Waste Into Digital Wealth**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Ethereum](https://img.shields.io/badge/Base_Sepolia-Blockchain-627EEA?style=flat-square&logo=ethereum)](https://base.org/)

[Live Demo](https://dev-fest.onrender.com/) • [Report Bug](../../issues) • [Request Feature](../../issues)

</div>

---

## 📖 About The Project

CleanChain Core Operator is a revolutionary blockchain-powered ecosystem that transforms plastic waste collection into economic opportunities. Users collect plastic waste, earn **PPEN (Plastic Penny)** tokens, and can redeem them for cryptocurrency or biodegradable products.

### 🎯 The Problem
- Millions of tons of plastic waste pollute our environment daily
- Informal waste collectors lack economic incentives and recognition
- No transparent system to track and verify waste collection

### 💡 Our Solution
- **Tokenized Rewards**: Earn PPEN tokens for every kg of plastic collected
- **GPS Verification**: Submit waste with location data for transparency
- **Blockchain Security**: All transactions are verified on Base Sepolia
- **Marketplace Economy**: Redeem tokens for goods or cryptocurrency

---

## ✨ Features

### 👤 For Users (Waste Collectors)
- 📍 Submit collected waste with GPS coordinates
- 📸 Upload photos as proof of collection
- 💰 Earn PPEN tokens (0.1 PPEN per kg)
- 🛒 Redeem tokens in the marketplace
- 📚 Access educational content

### 🗺️ For Waste Trackers
- 🗺️ View waste locations on interactive map
- ✅ Accept and complete pickup jobs
- 💎 Earn tokens for verification services
- 📊 Optimize collection routes

### 🏢 For Logistics Organizations
- 📈 Access analytics and insights
- 🏪 List biodegradable products in marketplace
- 📊 Purchase environmental data reports
- 🤝 Connect with recyclers and processors

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **UI Components** | Shadcn/ui, Radix UI, Lucide Icons |
| **Blockchain** | Ethers.js v6, Web3-React, MetaMask |
| **Backend** | Supabase (PostgreSQL, Auth, Storage) |
| **Maps** | Leaflet, React-Leaflet |
| **Charts** | Recharts |
| **Network** | Base Sepolia Testnet |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MetaMask](https://metamask.io/) browser extension
- [Supabase](https://supabase.com/) account (free tier works)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/makmot256/CLEAN-CHAIN-CORE-OPERATOR.git
   cd CLEAN-CHAIN-CORE-OPERATOR
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   
   Run this SQL in your Supabase SQL Editor:
   ```sql
   -- Waste submissions table
   CREATE TABLE waste_table (
     id SERIAL PRIMARY KEY,
     waste_type TEXT NOT NULL,
     weight NUMERIC NOT NULL,
     description TEXT,
     latitude TEXT,
     longitude TEXT,
     submitted_by TEXT NOT NULL,
     status TEXT DEFAULT 'submitted',
     image_url TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Map markers table
   CREATE TABLE markers (
     id SERIAL PRIMARY KEY,
     latitude NUMERIC NOT NULL,
     longitude NUMERIC NOT NULL,
     waste_type TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Marketplace products table
   CREATE TABLE products (
     id SERIAL PRIMARY KEY,
     name TEXT NOT NULL,
     price NUMERIC NOT NULL,
     description TEXT,
     image_url TEXT,
     category TEXT,
     added_by TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable Row Level Security
   ALTER TABLE waste_table ENABLE ROW LEVEL SECURITY;
   ALTER TABLE markers ENABLE ROW LEVEL SECURITY;
   ALTER TABLE products ENABLE ROW LEVEL SECURITY;

   -- Allow public access (for development)
   CREATE POLICY "Enable all access" ON waste_table FOR ALL USING (true) WITH CHECK (true);
   CREATE POLICY "Enable all access" ON markers FOR ALL USING (true) WITH CHECK (true);
   CREATE POLICY "Enable all access" ON products FOR ALL USING (true) WITH CHECK (true);
   ```

   Then also run `supabase/admin-setup.sql` to add the admin hub tables (`app_users`, `user_wallet`) and verification columns.

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:8081
   ```

---

## 🔗 Smart Contracts

Deployed on **Base Sepolia Testnet**:

| Contract | Address | Description |
|----------|---------|-------------|
| **PlasticPenny (PPEN)** | `0xd975232a55C083f30598EEacA02E71DB4FE04822` | ERC-20 reward token |
| **Redemption** | `0x72abb9a7f252B755a9E1d6f2411835a3Ef167a46` | Token-to-ETH redemption |
| **Payment Handler** | `0xdef685F9C502D055343BAC1A1d635AfDE808888b` | Payment processing |

### Adding Base Sepolia to MetaMask

| Setting | Value |
|---------|-------|
| Network Name | Base Sepolia |
| RPC URL | `https://sepolia.base.org` |
| Chain ID | `84532` |
| Currency Symbol | ETH |
| Block Explorer | `https://sepolia.basescan.org` |

---

## 📁 Project Structure

```
clean-chain-core-operator/
├── src/
│   ├── components/          # React components
│   │   ├── admin/           # Admin hub (analytics, verification, users)
│   │   ├── UserDashboard.tsx
│   │   ├── WasteTrackerDashboard.tsx
│   │   ├── LogisticsOrgDashboard.tsx
│   │   ├── Marketplace.tsx
│   │   ├── WasteMap.tsx
│   │   └── ui/              # Shadcn UI components
│   ├── hooks/               # Custom React hooks
│   │   ├── useWallet.ts     # MetaMask connection
│   │   └── useTokenBalance.ts
│   ├── lib/                 # Utilities and config
│   │   ├── config.ts        # Contract addresses
│   │   ├── admin.ts         # Verification + token grant helpers
│   │   ├── supabaseClient.ts
│   │   └── abi/             # Smart contract ABIs
│   ├── pages/
│   │   ├── Index.tsx        # Main landing page
│   │   └── Admin.tsx        # Admin gate + hub
│   └── types/               # TypeScript definitions
├── supabase/
│   └── admin-setup.sql      # Users + verification columns
├── public/                  # Static assets
└── .env.example            # Environment template
```

---

## 🎮 Usage

### Connect Wallet
1. Install MetaMask and add Base Sepolia network
2. Get test ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
3. Click "Enter as User/Tracker/Organization"
4. Approve the connection in MetaMask

### Submit Waste (User)
1. Enter waste weight in kg
2. Select waste type
3. Add GPS coordinates (or use "Get Current Location")
4. Optionally add photo and description
5. Click "Submit Waste"

### Earn & Redeem Tokens
- Earn 0.1 PPEN per kg of waste **after admin verification**
- Visit Marketplace to redeem for products
- Or exchange PPEN for ETH

### Admin Hub
1. Run `supabase/admin-setup.sql` in the Supabase SQL Editor
2. Add your wallet to `.env`:
   ```env
   VITE_ADMIN_WALLETS=0xYourAdminWalletHere
   ```
3. Restart the app, then open [Admin Hub](/admin) (`/admin`)
4. Review each submission:
   - Grant tokens only if it is **not a duplicate** and is at a **prominent waste-disposal location**
   - Otherwise reject with no tokens
5. Manage users (create, edit, suspend, delete) and inspect connected wallets

The admin wallet that approves a report must be the PPEN contract owner (to mint) or hold enough PPEN (to transfer).

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Supabase](https://supabase.com/) for backend infrastructure
- [Base](https://base.org/) for Layer 2 blockchain
- All contributors and supporters of sustainable technology

---

<div align="center">

**Built with 💚 for a cleaner planet**

[![GitHub Stars](https://img.shields.io/github/stars/makmot256/CLEAN-CHAIN-CORE-OPERATOR?style=social)](../../stargazers)

</div>
