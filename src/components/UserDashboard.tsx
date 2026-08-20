interface WasteSubmission {
  id: number;
  waste_type: string;
  weight: number;
  description: string | null;
  submitted_by: string;
  created_at: string;
  status: string;
}
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  MapPin,
  Coins,
  Camera,
  MessageSquare,
  Play,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ethers } from "ethers";
import { useWallet } from "@/hooks/useWallet";
import { supabase } from "@/lib/supabaseClient";
import { CONTRACTS, TOKEN_CONFIG } from "@/lib/config";
import { PaymentHandlerABI } from "@/lib/abi/PaymentHandler";
import { useTokenBalance } from "@/hooks/useTokenBalance";
/////////
interface UserDashboardProps {
  onBack: () => void;
  onMarketplace: () => void;
}

const UserDashboard = ({ onBack, onMarketplace }: UserDashboardProps) => {
  const { toast } = useToast();
  const { account } = useWallet();
  const { balance: tokenBalance, isLoading: balanceLoading } =
    useTokenBalance(account);
  const [mySubmissions, setMySubmissions] = useState<WasteSubmission[]>([]);
  useEffect(() => {
    const fetchMySubmissions = async () => {
      if (!account) return;

      const { data, error } = await supabase
        .from("waste_table")
        .select("*")
        .eq("submitted_by", account);

      if (error) {
        console.error("Error fetching user submissions:", error.message);
      } else {
        setMySubmissions(data);
      }
    };

    fetchMySubmissions(); // ✅ Don't make useEffect itself async!
  }, [account]);
  const [wasteWeight, setWasteWeight] = useState("");
  const [wasteType, setWasteType] = useState("");
  const [gpsCoords, setGpsCoords] = useState("");
  const [description, setDescription] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleWasteSubmission = async () => {
    if (!wasteWeight || !wasteType || !gpsCoords) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const [latStr, longStr] = gpsCoords.split(",").map((val) => val.trim());
    const latitude = parseFloat(latStr);
    const longitude = parseFloat(longStr);

    if (isNaN(latitude) || isNaN(longitude)) {
      toast({
        title: "Invalid Coordinates",
        description: "Please enter valid GPS coordinates.",
        variant: "destructive",
      });
      return;
    }

    /////

    const handleImageUpload = async () => {
      if (!imageFile) return null;
      console.log("Uploading image:", imageFile?.name);
      const filePath = `waste_photos/${Date.now()}_${imageFile.name}`;

      let lastError: string | null = null;

      for (const bucket of ["waste-photos", "product-images"]) {
        const { error } = await supabase.storage
          .from(bucket)
          .upload(filePath, imageFile);

        if (!error) {
          const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

          return publicUrlData?.publicUrl || null;
        }

        lastError = error.message;
        console.error(
          `Image upload failed for bucket ${bucket}:`,
          error.message,
        );
      }

      toast({
        title: "Image upload failed",
        description:
          lastError ||
          "Storage upload failed. Check bucket setup and policies.",
        variant: "destructive",
      });
      return null;
    };
    /////
    const imageUrl = await handleImageUpload(); // 👈 Add this line before the insert
    if (imageFile && !imageUrl) {
      return;
    }
    const { data, error } = await supabase.from("waste_table").insert([
      {
        weight: parseFloat(wasteWeight),
        description: description,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        submitted_by: account,
        waste_type: wasteType,
        image_url: imageUrl,
        status: "submitted",
      },
    ]);

    if (error) {
      console.error("Insert error:", error);
      toast({
        title: "Submission Failed",
        description: "Could not save to the database.",
        variant: "destructive",
      });
      return;
    }

    const ppTokens = parseFloat(wasteWeight) * 0.1;
    toast({
      title: "Waste Submitted!",
      description: `You are to earn ${ppTokens.toFixed(1)} PPEN tokens. A waste tracker will be notified.`,
    });

    setWasteWeight("");
    setWasteType("");
    setGpsCoords("");
    setDescription("");
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
        setGpsCoords(coords);
        toast({
          title: "Location Captured",
          description: "GPS coordinates have been added automatically",
        });
      });
    }
  };
  const handlePurchaseEducation = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        CONTRACTS.PAYMENT_HANDLER,
        PaymentHandlerABI,
        signer,
      );

      const tx = await contract.receiveUserPayment({
        value: ethers.parseEther("0.00025"), // Adjust this as needed for your price
      });

      await tx.wait();

      toast({
        title: "✅ Access Granted",
        description:
          "Waste Monetary skill video is on this link: https://drive.google.com/sample-education-video",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "❌ Payment Error",
        description: "Something went wrong during payment.",
        variant: "destructive",
      });
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <p className="text-sm text-gray-500 mb-2">Connected as: {account}</p>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-green-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-green-700">
                  User Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Plastic Waste Collection Hub
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-green-100 text-green-700 px-4 py-2">
                <Coins className="w-4 h-4 mr-2" />
                {balanceLoading ? "Loading..." : `${tokenBalance} PPEN`}
              </Badge>
              <Button
                onClick={onMarketplace}
                className="bg-green-600 hover:bg-green-700"
              >
                Marketplace
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="submit-waste" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-md">
            <TabsTrigger value="submit-waste">Submit Waste</TabsTrigger>
            <TabsTrigger value="my-submissions">My Submissions</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="chatbot">Support</TabsTrigger>
          </TabsList>

          {/* Submit Waste Tab */}
          <TabsContent value="submit-waste" className="space-y-6">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center text-green-700">
                  <Upload className="w-5 h-5 mr-2" />
                  Submit Collected Waste
                </CardTitle>
                <CardDescription>
                  Document your plastic waste collection and earn PPEN tokens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="waste-type">Waste Type</Label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={wasteType}
                        onChange={(e) => setWasteType(e.target.value)}
                      >
                        <option value="">Select waste type</option>
                        <option value="bottles">Plastic Bottles</option>
                        <option value="bags">Plastic Bags</option>
                        <option value="containers">Food Containers</option>
                        <option value="packaging">Packaging Materials</option>
                        <option value="other">Other Plastic Items</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        placeholder="Enter weight in kg"
                        value={wasteWeight}
                        onChange={(e) => setWasteWeight(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="gps">GPS Coordinates</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="gps"
                          placeholder="Latitude, Longitude"
                          value={gpsCoords}
                          onChange={(e) => setGpsCoords(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={getCurrentLocation}
                          className="whitespace-nowrap"
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Get Location
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setImageFile(e.target.files?.[0] || null)
                      }
                      className="hidden"
                      id="waste-upload"
                    />

                    <label htmlFor="waste-upload">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors cursor-pointer">
                        <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          Click to upload photos
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG up to 10MB
                        </p>
                      </div>
                    </label>
                    {imageFile && (
                      <p className="text-sm text-green-700 mt-2">
                        Selected image: {imageFile.name}
                      </p>
                    )}
                    <div>
                      <Label htmlFor="description">
                        Description (Optional)
                      </Label>
                      <textarea
                        id="description"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        rows={4}
                        placeholder="Additional details about the waste location or condition..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">
                    Estimated Reward
                  </h4>
                  <p className="text-sm text-green-700">
                    {wasteWeight
                      ? `${(parseFloat(wasteWeight) * 0.1).toFixed(1)} PPEN tokens`
                      : "0 PPEN tokens"}
                    <span className="text-gray-600 ml-2">
                      (0.1 PPEN per kg)
                    </span>
                  </p>
                </div>

                <Button
                  onClick={handleWasteSubmission}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  Submit Waste Collection
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Submissions Tab */}
          <TabsContent value="my-submissions" className="space-y-6">
            <div className="grid gap-4">
              {mySubmissions.map((submission) => (
                <Card key={submission.id} className="border-green-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">
                          {submission.waste_type} Collection
                        </h4>
                        <p className="text-sm text-gray-600">
                          Weight: {submission.weight}kg • Location:{" "}
                          {submission.description || "No description"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Submitted:{" "}
                          {new Date(submission.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-700">
                          +{(submission.weight * 0.1).toFixed(1)} PPEN
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {submission.status === "accepted"
                            ? "Verified"
                            : "Pending"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Education Tab */}
          <TabsContent value="education" className="space-y-6">
            <Card className="border-teal-200">
              <CardHeader>
                <CardTitle className="flex items-center text-teal-700">
                  <Play className="w-5 h-5 mr-2" />
                  Educational Resources
                </CardTitle>
                <CardDescription>
                  Learn How To Make Money From Waste
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    {
                      title: " Upcycling Plastic into Marketable Products",
                      cost: "0.5$",
                      duration: "10 min",
                    },
                    {
                      title: " Tracking & Trading Waste Tokens",
                      cost: "0.5$",
                      duration: "8 min",
                    },
                    {
                      title: "How To Sell to the President Waste",
                      cost: "0.5$",
                      duration: "15 min",
                    },
                    {
                      title: "How to Earn with Community Clean-Up Drives",
                      cost: "0.5$",
                      duration: "20 min",
                    },
                  ].map((course, index) => (
                    <Card
                      key={index}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">{course.title}</h4>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-600">
                            <span>{course.duration}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handlePurchaseEducation}
                          >
                            Pay {course.cost}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chatbot Tab */}
          <TabsContent value="chatbot" className="space-y-6">
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="flex items-center text-emerald-700">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Waste Management Assistant
                </CardTitle>
                <CardDescription>
                  Get help with waste collection and platform features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 h-64 mb-4 overflow-y-auto">
                  <div className="space-y-3">
                    <div className="bg-blue-100 p-3 rounded-lg max-w-xs">
                      <p className="text-sm">
                        Hello! I'm your waste management assistant. How can I
                        help you today?
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg max-w-xs ml-auto">
                      <p className="text-sm">
                        How do I properly sort plastic waste?
                      </p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg max-w-xs">
                      <p className="text-sm">
                        Great question! Here are the main plastic categories to
                        sort by...
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Ask about waste management..."
                    className="flex-1"
                  />
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserDashboard;
