import React, { useState, useEffect, useRef } from "react";
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
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import UserDashboard from "@/components/UserDashboard";
import WasteTrackerDashboard from "@/components/WasteTrackerDashboard";
import LogisticsOrgDashboard from "@/components/LogisticsOrgDashboard";
import Marketplace from "@/components/Marketplace";
import HeroCanvas from "@/components/three/HeroCanvas";
import ScrollReveal from "@/components/ScrollReveal";
import AnimatedCounter from "@/components/AnimatedCounter";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import gsap from "gsap";

import "leaflet/dist/leaflet.css";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Roles", href: "#roles" },
  { label: "Impact", href: "#stats" },
  { label: "Contact", href: "#contact" },
];

const ROLE_CARDS = [
  {
    id: "user" as const,
    title: "Users",
    subtitle: "Plastic Waste Collectors",
    icon: Users,
    gradient: "from-green-500 to-emerald-500",
    borderIdle: "border-green-100",
    borderHover: "hover:border-green-400",
    titleColor: "text-green-700",
    bullets: [
      "Submit collected waste with GPS data",
      "Upload photos and weight details",
      "Earn PPEN tokens for contributions",
      "Redeem tokens for crypto or goods",
      "Access educational content",
    ],
    enterLabel: "Enter as User",
  },
  {
    id: "tracker" as const,
    title: "Waste Trackers",
    subtitle: "Collection & Verification",
    icon: MapPin,
    gradient: "from-emerald-500 to-teal-500",
    borderIdle: "border-emerald-100",
    borderHover: "hover:border-emerald-400",
    titleColor: "text-emerald-700",
    bullets: [
      "View GPS-mapped waste locations",
      "Accept pickup jobs from users",
      "Verify and sign transactions",
      "Optimize collection routes",
      "Earn PPEN tokens for services",
    ],
    enterLabel: "Enter as Tracker",
  },
  {
    id: "logistics" as const,
    title: "Logistics Organizations",
    subtitle: "Waste Processing & Marketplace",
    icon: Recycle,
    gradient: "from-teal-500 to-green-600",
    borderIdle: "border-teal-100",
    borderHover: "hover:border-teal-400",
    titleColor: "text-teal-700",
    bullets: [
      "List biodegradable goods in marketplace",
      "Access analytics and data insights",
      "Connect with recyclers & processors",
      "Monetize environmental data",
      "Support sustainable economy",
    ],
    enterLabel: "Enter as Organization",
  },
];

const STATS = [
  { value: 50000, suffix: "+", label: "Plastic Items Collected" },
  { value: 1200, suffix: "+", label: "Active Users" },
  { value: 750, suffix: "+", label: "Waste Trackers" },
  { value: 25000, prefix: "₽ ", label: "PPEN Tokens Earned" },
];

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
  const heroRef = useRef<HTMLDivElement>(null);

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

  // Hero entrance animation
  useEffect(() => {
    if (activeView !== "home" || !heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(
          "[data-hero-badge]",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.6 },
        )
        .fromTo(
          "[data-hero-title]",
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8 },
          "-=0.3",
        )
        .fromTo(
          "[data-hero-sub]",
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.7 },
          "-=0.5",
        )
        .fromTo(
          "[data-hero-cta]",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.12 },
          "-=0.4",
        )
        .fromTo(
          "[data-hero-trust]",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 },
          "-=0.35",
        );
    }, heroRef);
    return () => ctx.revert();
  }, [activeView]);

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

  // Return to the home screen without disconnecting the wallet, so role buttons stay usable
  const goHome = () => {
    setUserType(null);
    setActiveView("home");
  };

  const scrollToSection = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  // If dashboard view and userType is 'user', render UserDashboard
  if (activeView === "dashboard" && userType === "user" && account) {
    return (
      <UserDashboard
        onBack={goHome}
        onMarketplace={() => setActiveView("marketplace")}
      />
    );
  }
  if (activeView === "dashboard" && userType === "tracker" && account) {
    return (
      <WasteTrackerDashboard
        onBack={goHome}
        onMarketplace={() => setActiveView("marketplace")}
      />
    );
  }
  if (activeView === "dashboard" && userType === "logistics" && account) {
    return (
      <LogisticsOrgDashboard
        onBack={goHome}
        onMarketplace={() => setActiveView("marketplace")}
      />
    );
  }
  if (activeView === "marketplace" && account) {
    return <Marketplace onBack={goHome} />;
  }

  // Home view: show role selection
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-green-100 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <a href="#home" className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 shadow-lg shadow-green-600/20">
              <Recycle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-gray-900 sm:text-xl">
                CleanChain{" "}
                <span className="text-gradient-brand">Core Operator</span>
              </h1>
              <p className="hidden text-xs text-gray-500 sm:block">
                Sustainable Waste Management Ecosystem
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-green-700"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-2">
            {account ? (
              <>
                <Badge
                  variant="outline"
                  className="hidden border-green-300 px-3 py-1 text-xs text-green-800 sm:inline-flex"
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
                <Badge className="hidden bg-green-100 text-green-700 sm:inline-flex">
                  <Coins className="mr-1 h-3 w-3" />
                  PPEN Token
                </Badge>
                <Button
                  size="sm"
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className="btn-brand border-0"
                >
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="home"
        ref={heroRef}
        className="relative isolate overflow-hidden bg-gradient-to-b from-green-50/70 via-white to-white py-24 px-4 sm:py-28"
      >
        <HeroCanvas />
        <div className="pointer-events-none absolute inset-0 grid-fade-mask bg-[linear-gradient(to_right,rgba(22,163,74,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(22,163,74,0.06)_1px,transparent_1px)] bg-[size:56px_56px]" />

        <div className="container relative mx-auto text-center">
          <div className="mx-auto max-w-4xl">
            <div
              data-hero-badge
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-green-700 shadow-sm backdrop-blur"
            >
              <Sparkles className="h-4 w-4" />
              Blockchain-powered circular economy
            </div>

            <h2
              data-hero-title
              className="mb-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl"
            >
              Turn Plastic Waste Into{" "}
              <span className="text-gradient-brand">Digital Wealth</span>
            </h2>

            <p
              data-hero-sub
              className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-600"
            >
              Join the revolutionary blockchain-powered ecosystem where plastic
              waste becomes PLASTIC PENNY (PPEN) tokens, creating economic
              opportunities while cleaning our environment.
            </p>

            <div className="mb-14 flex flex-wrap items-center justify-center gap-4">
              <Button
                data-hero-cta
                size="lg"
                onClick={() => scrollToSection("#roles")}
                className="btn-brand border-0 px-8 text-base"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                data-hero-cta
                size="lg"
                variant="outline"
                onClick={() => scrollToSection("#stats")}
                className="btn-brand-outline px-8 text-base"
              >
                See Our Impact
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Badge
                data-hero-trust
                className="bg-green-100 px-4 py-2 text-sm text-green-700"
              >
                <Globe className="mr-2 h-4 w-4" />
                Blockchain Verified
              </Badge>
              <Badge
                data-hero-trust
                className="bg-emerald-100 px-4 py-2 text-sm text-emerald-700"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Economic Impact
              </Badge>
              <Badge
                data-hero-trust
                className="bg-teal-100 px-4 py-2 text-sm text-teal-700"
              >
                <Leaf className="mr-2 h-4 w-4" />
                Environmental Solution
              </Badge>
            </div>
          </div>

          <button
            onClick={() => scrollToSection("#roles")}
            aria-label="Scroll to role selection"
            className="mx-auto mt-16 flex h-10 w-10 animate-float-slow items-center justify-center rounded-full border border-green-200 bg-white/70 text-green-600 shadow-sm backdrop-blur transition hover:bg-green-50"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Role Selection */}
      <section id="roles" className="px-4 pb-24 pt-16">
        <div className="container mx-auto">
          <ScrollReveal className="mx-auto mb-4 max-w-2xl text-center">
            <h3 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Choose Your Role in the{" "}
              <span className="text-gradient-brand">CleanChain</span> Ecosystem
            </h3>
            {!account && (
              <p className="mt-4 text-sm text-gray-500">
                Connect your MetaMask wallet from the top-right to unlock all
                categories.
              </p>
            )}
          </ScrollReveal>

          <ScrollReveal
            stagger
            className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3"
          >
            {ROLE_CARDS.map((role) => {
              const Icon = role.icon;
              return (
                <Card
                  key={role.id}
                  className={`group cursor-pointer border ${role.borderIdle} ${role.borderHover} transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-900/10`}
                >
                  <CardHeader className="pb-4 text-center">
                    <div
                      className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${role.gradient} shadow-lg transition-transform group-hover:scale-110`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className={`text-2xl ${role.titleColor}`}>
                      {role.title}
                    </CardTitle>
                    <CardDescription>{role.subtitle}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2 text-sm text-gray-600">
                      {role.bullets.map((bullet) => (
                        <li key={bullet}>• {bullet}</li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => handleRoleSelect(role.id)}
                      disabled={!account}
                      className={`w-full bg-gradient-to-r ${role.gradient} border-0 text-white shadow-md transition-all hover:shadow-lg`}
                    >
                      {account ? role.enterLabel : "Connect Wallet First"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </ScrollReveal>
        </div>
      </section>

      {/* Stats Section */}
      <section
        id="stats"
        className="border-y border-green-100 bg-gradient-to-b from-green-50/60 to-white px-4 py-16"
      >
        <div className="container mx-auto">
          <ScrollReveal
            stagger
            className="grid gap-8 text-center md:grid-cols-4"
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="glass-panel rounded-2xl p-6">
                <AnimatedCounter
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  className="text-gradient-brand text-3xl font-bold"
                />
                <div className="mt-2 text-gray-600">{stat.label}</div>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="contact"
        className="bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 text-white"
      >
        {/* Main Footer Content */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid gap-12 md:grid-cols-3">
            {/* Mission Statement */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                  <Recycle className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">CleanChain Core</span>
              </div>
              <h3 className="text-2xl font-bold leading-relaxed">
                Let's Transform Waste &<br />
                <span className="text-green-400">Empower Communities</span>
              </h3>
              <p className="leading-relaxed text-gray-400">
                Join the movement to create a cleaner planet while earning
                rewards. Every piece of plastic collected makes a difference.
              </p>
              <div className="flex gap-4 pt-2">
                <a
                  href="https://x.com/clean_chain_o"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 transition-colors duration-300 hover:bg-green-600"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="https://www.linkedin.com/company/129954095"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 transition-colors duration-300 hover:bg-green-600"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <h4 className="text-xl font-bold text-green-400">
                Let's Get Social
              </h4>
              <h5 className="text-lg font-semibold text-green-300">Contact</h5>
              <div className="space-y-4 text-gray-300">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-green-400" />
                  <span>Makerere Innovation and Incubation Center</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 flex-shrink-0 text-green-400" />
                  <a
                    href="mailto:cleanchainoperator@gmail.com"
                    className="transition-colors hover:text-green-400"
                  >
                    cleanchainoperator@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 flex-shrink-0 text-green-400" />
                  <span>0740 886 639</span>
                </div>
              </div>
            </div>

            {/* Newsletter Subscription */}
            <div className="space-y-6">
              <div className="rounded-2xl bg-white p-6 text-gray-800">
                <h4 className="mb-2 text-xl font-bold text-gray-900">
                  Subscribe to receive updates
                </h4>
                <p className="mb-4 text-sm text-green-700">
                  * indicates required
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Email Address <span className="text-green-600">*</span>
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
                  <Button className="btn-brand w-full border-0">
                    <Send className="mr-2 h-4 w-4" />
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-sm text-gray-400">
                © 2026 CleanChain Core Operator. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <a href="#" className="transition-colors hover:text-green-400">
                  Privacy Policy
                </a>
                <a href="#" className="transition-colors hover:text-green-400">
                  Terms of Service
                </a>
                <a href="#" className="transition-colors hover:text-green-400">
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
