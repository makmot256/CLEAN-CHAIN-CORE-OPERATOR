import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Users,
  Recycle,
  Coins,
  Leaf,
  ArrowRight,
  Globe,
  TrendingUp,
  Mail,
  Phone,
  Twitter,
  Linkedin,
  Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import UserDashboard from "@/components/UserDashboard";
import WasteTrackerDashboard from "@/components/WasteTrackerDashboard";
import LogisticsOrgDashboard from "@/components/LogisticsOrgDashboard";
import Marketplace from "@/components/Marketplace";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";

import "leaflet/dist/leaflet.css";

const Index = () => {
  const [activeView, setActiveView] = useState<
    "home" | "dashboard" | "marketplace"
  >("home");
  const [userType, setUserType] = useState<
    "user" | "tracker" | "logistics" | null
  >(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const { connect, disconnect, account } = useWallet();
  const { toast } = useToast();

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

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true);
      await connect();
      toast({
        title: "Wallet connected",
        description:
          "You can now access Users, Waste Trackers, and Logistics Organizations.",
      });
    } catch (err) {
      console.error("User rejected connection or error", err);
      toast({
        title: "Wallet connection failed",
        description: "Please approve the MetaMask prompt and try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRoleSelect = (role: "user" | "tracker" | "logistics") => {
    if (!account) {
      toast({
        title: "Connect wallet first",
        description:
          "Use the Connect Wallet button in the top-right to continue.",
      });
      return;
    }

    setUserType(role);
    setActiveView("dashboard");
  };

  const handleDisconnect = () => {
    disconnect();
    // useEffect will reset activeView and userType
  };

  // If dashboard view and userType is 'user', render UserDashboard
  if (activeView === "dashboard" && userType === "user" && account) {
    return (
      <UserDashboard
        onBack={handleDisconnect}
        onMarketplace={() => setActiveView("marketplace")}
      />
    );
  }
  if (activeView === "dashboard" && userType === "tracker" && account) {
    return (
      <WasteTrackerDashboard
        onBack={handleDisconnect}
        onMarketplace={() => setActiveView("marketplace")}
      />
    );
  }
  if (activeView === "dashboard" && userType === "logistics" && account) {
    return (
      <LogisticsOrgDashboard
        onBack={handleDisconnect}
        onMarketplace={() => setActiveView("marketplace")}
      />
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
                CleanChain Core Operator
              </h1>
              <p className="text-sm text-gray-600">
                Sustainable Waste Management Ecosystem
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {account ? (
              <>
                <Badge
                  variant="outline"
                  className="text-xs border-green-400 text-green-800 px-3 py-1"
                >
                  {account.slice(0, 6)}...{account.slice(-4)}
                </Badge>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700"
                >
                  <Coins className="w-3 h-3 mr-1" />
                  PPEN Token
                </Badge>
                <Button
                  size="sm"
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </Button>
              </>
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
              Join the revolutionary blockchain-powered ecosystem where plastic
              waste becomes PLASTIC PENNY (PPEN) tokens, creating economic
              opportunities while cleaning our environment.
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
      <section className="pt-4 pb-16 px-4">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Choose Your Role in the CleanChain Core Ecosystem
          </h3>
          {!account && (
            <p className="text-center text-sm text-gray-600 mb-8">
              Connect your MetaMask wallet from the top-right to unlock all
              categories.
            </p>
          )}
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
                  disabled={!account}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  {account ? "Enter as User" : "Connect Wallet First"}
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
                <CardTitle className="text-2xl text-blue-700">
                  Waste Trackers
                </CardTitle>
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
                  disabled={!account}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  {account ? "Enter as Tracker" : "Connect Wallet First"}
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
                <CardTitle className="text-2xl text-purple-700">
                  Logistics Organizations
                </CardTitle>
                <CardDescription>
                  Waste Processing & Marketplace
                </CardDescription>
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
                  disabled={!account}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                >
                  {account ? "Enter as Organization" : "Connect Wallet First"}
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
              <div className="text-3xl font-bold text-emerald-600">
                ₽ 25,000
              </div>
              <div className="text-gray-600">PPEN Tokens Earned</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        {/* Main Footer Content */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Mission Statement */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Recycle className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">CleanChain Core</span>
              </div>
              <h3 className="text-2xl font-bold leading-relaxed">
                Let's Transform Waste &<br />
                <span className="text-green-400">Empower Communities</span>
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Join the movement to create a cleaner planet while earning
                rewards. Every piece of plastic collected makes a difference.
              </p>
              <div className="flex gap-4 pt-2">
                <a
                  href="https://x.com/clean_chain_o"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-700 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors duration-300"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="https://www.linkedin.com/company/129954095"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-700 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors duration-300"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <h4 className="text-xl font-bold text-green-400">
                Let's Get Social
              </h4>
              <h5 className="text-lg font-semibold text-amber-400">Contact</h5>
              <div className="space-y-4 text-gray-300">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <span>Makerere Innovation and Incubation Center</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <a
                    href="mailto:cleanchainoperator@gmail.com"
                    className="hover:text-green-400 transition-colors"
                  >
                    cleanchainoperator@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>0740 886 639</span>
                </div>
              </div>
            </div>

            {/* Newsletter Subscription */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 text-gray-800">
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  Subscribe to receive updates
                </h4>
                <p className="text-sm text-red-500 mb-4">
                  * indicates required
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <Input
                      type="text"
                      placeholder="John"
                      className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Doe"
                      className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <Button className="w-full bg-gray-700 hover:bg-green-600 text-white transition-colors duration-300">
                    <Send className="w-4 h-4 mr-2" />
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                © 2026 CleanChain Core Operator. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <a href="#" className="hover:text-green-400 transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="hover:text-green-400 transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="hover:text-green-400 transition-colors">
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
