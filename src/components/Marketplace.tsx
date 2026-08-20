
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Coins, Package, CreditCard, ArrowLeft, Search, Filter, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ethers } from 'ethers';
import { CONTRACTS } from '@/lib/config';
import { PlasticPennyABI } from '@/lib/abi/PlasticPenny';
import { RedemptionABI } from '@/lib/abi/Redemption';

interface MarketplaceProps {
  onBack: () => void;
}

const Marketplace = ({ onBack }: MarketplaceProps) => {
  const handleRedeem = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tokenContract = new ethers.Contract(
        CONTRACTS.PLASTIC_PENNY,
        PlasticPennyABI,
        signer
      );

      const redemptionContract = new ethers.Contract(
        CONTRACTS.REDEMPTION,
        RedemptionABI,
        signer
      );

      const parsedAmount = ethers.parseUnits(ppenAmount, 18);
      const approvalTx = await tokenContract.approve(redemptionContract.target, parsedAmount);
      await approvalTx.wait();

      const tx = await redemptionContract.redeem(parsedAmount);
      await tx.wait();

      toast({
        title: '🎉 Redeemed!',
        description: `You received approximately ${estimatedEth} ETH for ${ppenAmount} PPEN.`
      });
    } catch (err) {
      toast({
        title: '❌ Redemption Failed',
        description: 'There was an issue processing your redemption.',
        variant: 'destructive'
      });
    }
  };
  const [ppenAmount, setPpenAmount] = useState('');
  const [estimatedEth, setEstimatedEth] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { toast } = useToast();

  const products = [
    {
      id: 1,
      name: "Bamboo Toothbrush Set",
      price: 25,
      description: "Eco-friendly bamboo toothbrushes, pack of 4",
      category: "personal-care",
      image: "🎋",
      rating: 4.8,
      sold: 156,
      seller: "EcoLife Solutions"
    },
    {
      id: 2,
      name: "Reusable Shopping Bags",
      price: 20,
      description: "Durable cotton shopping bags, set of 3",
      category: "household",
      image: "👜",
      rating: 4.9,
      sold: 203,
      seller: "Green Living Co"
    },
    {
      id: 3,
      name: "Biodegradable Plates",
      price: 12,
      description: "Compostable plates made from palm leaves",
      category: "household",
      image: "🍽️",
      rating: 4.6,
      sold: 89,
      seller: "Sustainable Solutions"
    },
    {
      id: 4,
      name: "Organic Face Cream",
      price: 35,
      description: "Natural skincare with zero plastic packaging",
      category: "personal-care",
      image: "🧴",
      rating: 4.7,
      sold: 124,
      seller: "Pure Beauty"
    },
    {
      id: 5,
      name: "Solar Power Bank",
      price: 45,
      description: "Eco-friendly portable charger with solar panel",
      category: "electronics",
      image: "🔋",
      rating: 4.5,
      sold: 67,
      seller: "Tech Green"
    },
    {
      id: 6,
      name: "Organic Coffee Beans",
      price: 18,
      description: "Fair trade coffee in biodegradable packaging",
      category: "food",
      image: "☕",
      rating: 4.9,
      sold: 298,
      seller: "Earth Roasters"
    }
  ];

  const cryptoOptions = [
    {
      id: 1,
      name: "USDT",
      symbol: "USDT",
      rate: 0.10,
      description: "Convert PPEN to Tether USD",
      icon: "💰"
    },
    {
      id: 2,
      name: "Ethereum",
      symbol: "ETH",
      rate: 0.000045,
      description: "Convert PPEN to Ethereum",
      icon: "💎"
    },
    {
      id: 3,
      name: "Bitcoin",
      symbol: "BTC",
      rate: 0.0000023,
      description: "Convert PPEN to Bitcoin",
      icon: "₿"
    }
  ];

  const handlePurchase = (productName: string, price: number) => {
    toast({
      title: "Purchase Successful!",
      description: `You've purchased ${productName} for ${price} PPEN tokens`,
    });
  };

  const handleCryptoExchange = (crypto: string, amount: number) => {
    toast({
      title: "Exchange Successful!",
      description: `You've exchanged ${amount} PPEN for ${crypto}`,
    });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-emerald-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-emerald-700">PPEN Marketplace</h1>
                <p className="text-sm text-gray-600">Redeem tokens for eco-friendly products & crypto</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-emerald-100 text-emerald-700 px-4 py-2 text-lg">
                <Coins className="w-4 h-4 mr-2" />
                247.3 PPEN
              </Badge>
              <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                <ShoppingCart className="w-4 h-4 mr-2" />
                0 items
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-md">
            <TabsTrigger value="products">Biodegradable Products</TabsTrigger>
            <TabsTrigger value="crypto">Crypto Exchange</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            {/* Search and Filters */}
            <Card className="border-emerald-200">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="all">All Categories</option>
                      <option value="personal-care">Personal Care</option>
                      <option value="household">Household</option>
                      <option value="food">Food & Drinks</option>
                      <option value="electronics">Electronics</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="border-emerald-200 hover:shadow-xl transition-all duration-300 group">
                  <CardHeader className="text-center pb-2">
                    <div className="text-6xl mb-2 group-hover:scale-110 transition-transform">
                      {product.image}
                    </div>
                    <CardTitle className="text-lg text-emerald-700">{product.name}</CardTitle>
                    <CardDescription className="text-sm">{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">{product.rating}</span>
                        <span className="text-xs text-gray-500">({product.sold} sold)</span>
                      </div>
                      <span className="text-xs text-gray-600">by {product.seller}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-emerald-600">
                        {product.price} PPEN
                      </div>
                      <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                        <Package className="w-3 h-3 mr-1" />
                        In Stock
                      </Badge>
                    </div>

                    <Button
                      onClick={() => handlePurchase(product.name, product.price)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Purchase with PPEN
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Crypto Exchange Tab */}
          <TabsContent value="crypto" className="space-y-6">
            <Card className="border-teal-200">
              <CardHeader>
                <CardTitle className="flex items-center text-teal-700">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Exchange PPEN for Cryptocurrency
                </CardTitle>
                <CardDescription>
                  Convert your earned PPEN tokens to popular cryptocurrencies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {cryptoOptions.map((crypto) => (
                    <Card key={crypto.id} className="border-gray-200 hover:shadow-lg transition-shadow">
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-3">{crypto.icon}</div>
                        <h3 className="text-xl font-bold mb-2">{crypto.name}</h3>
                        <p className="text-sm text-gray-600 mb-4">{crypto.description}</p>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="text-sm text-gray-600">Exchange Rate</div>
                          <div className="text-lg font-bold">1 PPEN = {crypto.rate} {crypto.symbol}</div>
                        </div>

                        <div className="space-y-3">
                          <Input
                            type="number"
                            placeholder="Enter PPEN to redeem"
                            className="text-center mb-3"
                            value={ppenAmount}
                            onChange={async (e) => {
                              const value = e.target.value;
                              setPpenAmount(value);

                              if (value && !isNaN(Number(value))) {
                                try {
                                  const provider = new ethers.BrowserProvider(window.ethereum);
                                  const contract = new ethers.Contract(
                                    CONTRACTS.REDEMPTION,
                                    RedemptionABI,
                                    provider
                                  );
                                  const result = await contract.getEthForPPEN(ethers.parseUnits(value, 18));
                                  setEstimatedEth(ethers.formatEther(result));
                                } catch (err) {
                                  setEstimatedEth('');
                                }
                              } else {
                                setEstimatedEth('');
                              }
                            }}
                          />
                          {estimatedEth && (
                            <p className="text-sm text-gray-600">
                              Estimated return:<span className="font-semibold">
                                {parseFloat(estimatedEth).toFixed(6)} wei
                              </span>

                            </p>
                          )}
                          {crypto.name === 'Ethereum' ? (
                            <Button
                              onClick={handleRedeem}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Exchange to ETH
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleCryptoExchange(crypto.name, 100)}
                              className="w-full"
                              variant="outline"
                            >
                              Exchange to {crypto.symbol}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-8 bg-blue-50 rounded-lg p-6">
                  <h4 className="font-semibold text-blue-800 mb-2">Important Notes</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Minimum exchange: 10 PPEN tokens</li>
                    <li>• Exchange rates update in real-time</li>
                    <li>• Transactions are processed on blockchain</li>
                    <li>• Small network fees may apply</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Marketplace;
