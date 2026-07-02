import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Recycle, Coins, Leaf, ArrowRight, Globe, TrendingUp } from "lucide-react";
import UserDashboard from "@/components/UserDashboard";
import WasteTrackerDashboard from "@/components/WasteTrackerDashboard";
import LogisticsOrgDashboard from "@/components/LogisticsOrgDashboard";
import Marketplace from "@/components/Marketplace";
import { useWallet } from "@/hooks/useWallet";

import "leaflet/dist/leaflet.css";

const Index = () => {
  const [activeView, setActiveView] = useState<"home" | "dashboard" | "marketplace">("home");
  const [userType, setUserType] = useState<"user" | "tracker" | "logistics" | null>(null);

  const { connect, disconnect, account, active } = useWallet();

  // Redirect effect: when account becomes available and userType is set, navigate or set activeView
  useEffect(() => {
    if (account && userType) {
      setActiveView("dashboard");
    }
    // If account is null (disconnected), reset to home
    if (!account) {
      setActiveView("home");
      setUserType(null);
    }
  }, [account, userType]);

  const handleRoleSelect = async (role: "user" | "tracker" | "logistics") => {
    // If already connected with some account, disconnect first to allow new selection/prompt
    if (active) {
      disconnect();
    }
    try {
      await connect(); // triggers MetaMask prompt; after connecting, account changes -> effect triggers view
      setUserType(role);
      // activeView will be set in useEffect when account is set
    } catch (err) {
      console.error("User rejected connection or error", err);
      // stay on home; maybe show a toast
    }
  };

  const handleDisconnect = () => {
    disconnect();
    // useEffect will reset activeView and userType
  };

  // If dashboard view and userType is 'user', render UserDashboard
  if (activeView === "dashboard" && userType === "user" && account) {
    return (
      <UserDashboard onBack={handleDisconnect} onMarketplace={() => setActiveView("marketplace")} />
    );
  }
  if (activeView === "dashboard" && userType === "tracker" && account) {
    return (
      <WasteTrackerDashboard onBack={handleDisconnect} onMarketplace={() => setActiveView("marketplace")} />
    );
  }
  if (activeView === "dashboard" && userType === "logistics" && account) {
    return (
      <LogisticsOrgDashboard onBack={handleDisconnect} onMarketplace={() => setActiveView("marketplace")} />
    );
  }
  if (activeView === "marketplace" && account) {
    return <Marketplace onBack={handleDisconnect} />;
  }

  // Home view: show role selection
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-green-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Recycle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                CleanChain Operator
              </h1>
              <p className="text-sm text-gray-600">Sustainable Waste Management Ecosystem</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {account ? (
              <>
                <Badge variant="outline" className="text-xs border-green-400 text-green-800 px-3 py-1">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </Badge>
                <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </>
            ) : (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <Coins className="w-3 h-3 mr-1" />
                PPEN Token
              </Badge>
            )}
            {/* <Button
              variant="outline"
              onClick={() => {
                // If already on marketplace, do nothing
                if (activeView !== "marketplace") setActiveView("marketplace");
              }}
              className="border-green-200 hover:bg-green-50"
            >
              Marketplace
            </Button> */}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-green-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent">
              Turn Plastic Waste Into Digital Wealth
            </h2>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Join the revolutionary blockchain-powered ecosystem where plastic waste becomes PLASTIC PENNY
              (PPEN) tokens, creating economic opportunities while cleaning our environment.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Badge className="bg-green-100 text-green-700 px-4 py-2 text-lg">
                <Globe className="w-4 h-4 mr-2" />
                Blockchain Verified
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 px-4 py-2 text-lg">
                <TrendingUp className="w-4 h-4 mr-2" />
                Economic Impact
              </Badge>
              <Badge className="bg-emerald-100 text-emerald-700 px-4 py-2 text-lg">
                <Leaf className="w-4 h-4 mr-2" />
                Environmental Solution
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Role Selection */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Choose Your Role in the CleanChain Ecosystem
          </h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Users Card */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-green-200 hover:border-green-400 cursor-pointer transform hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-green-700">Users</CardTitle>
                <CardDescription>Plastic Waste Collectors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Submit collected waste with GPS data</li>
                  <li>• Upload photos and weight details</li>
                  <li>• Earn PPEN tokens for contributions</li>
                  <li>• Redeem tokens for crypto or goods</li>
                  <li>• Access educational content</li>
                </ul>
                <Button
                  onClick={() => handleRoleSelect("user")}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  Enter as User
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Waste Trackers Card */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-blue-200 hover:border-blue-400 cursor-pointer transform hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-blue-700">Waste Trackers</CardTitle>
                <CardDescription>Collection & Verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• View GPS-mapped waste locations</li>
                  <li>• Accept pickup jobs from users</li>
                  <li>• Verify and sign transactions</li>
                  <li>• Optimize collection routes</li>
                  <li>• Earn PPEN tokens for services</li>
                </ul>
                <Button
                  onClick={() => handleRoleSelect("tracker")}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  Enter as Tracker
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Logistics Organizations Card */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-purple-200 hover:border-purple-400 cursor-pointer transform hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Recycle className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-purple-700">Logistics Organizations</CardTitle>
                <CardDescription>Waste Processing & Marketplace</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• List biodegradable goods in marketplace</li>
                  <li>• Access analytics and data insights</li>
                  <li>• Connect with recyclers & processors</li>
                  <li>• Monetize environmental data</li>
                  <li>• Support sustainable economy</li>
                </ul>
                <Button
                  onClick={() => handleRoleSelect("logistics")}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                >
                  Enter as Organization
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-green-600">50,000+</div>
              <div className="text-gray-600">Plastic Items Collected</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-blue-600">1,200+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-purple-600">750+</div>
              <div className="text-gray-600">Waste Trackers</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-emerald-600">₽ 25,000</div>
              <div className="text-gray-600">PPEN Tokens Earned</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        {/* ... */}
      </footer>
    </div>
  );
};

export default Index;
