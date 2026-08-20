// Place these interface definitions at the very top of your file if you want type safety:
interface Product {
  id?: number;
  product_name: string;
  price: number;
  category: string;
  description: string;
  product_images: string | null;
}
import { ethers } from "ethers";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Package,
  TrendingUp,
  Users,
  MapPin,
  DollarSign,
  ArrowLeft,
  ShoppingCart,
  Eye,
  X,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { CONTRACTS } from "@/lib/config";
import { PaymentHandlerABI } from "@/lib/abi/PaymentHandler";

interface LogisticsOrgDashboardProps {
  onBack: () => void;
  onMarketplace: () => void;
}

const LogisticsOrgDashboard = ({
  onBack,
  onMarketplace,
}: LogisticsOrgDashboardProps) => {
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [category, setCategory] = useState("");
  const [productImages, setProductImages] = useState<File[]>([]);
  const [productImageURLs, setProductImageURLs] = useState<string[]>([]);
  const [listedProducts, setListedProducts] = useState<Product[]>([]);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dummy analytics data
  const analyticsData = [
    { month: "Jan", collections: 45, weight: 120 },
    { month: "Feb", collections: 52, weight: 140 },
    { month: "Mar", collections: 68, weight: 180 },
    { month: "Apr", collections: 71, weight: 195 },
    { month: "May", collections: 89, weight: 230 },
    { month: "Jun", collections: 94, weight: 250 },
  ];

  const wasteTypeData = [
    { name: "Bottles", value: 35, color: "#10b981" },
    { name: "Bags", value: 25, color: "#3b82f6" },
    { name: "Containers", value: 20, color: "#8b5cf6" },
    { name: "Packaging", value: 15, color: "#f59e0b" },
    { name: "Other", value: 5, color: "#ef4444" },
  ];

  const analyticsOptions = [
    {
      title: "Weekly Collection Trends",
      price: "50 USDT",
      description: "Detailed waste collection patterns by region",
    },
    {
      title: "Peak Collection Times",
      price: "35 USDT",
      description: "Optimal timing analysis for waste management",
    },
    {
      title: "User Engagement Metrics",
      price: "45 USDT",
      description: "Community participation and retention data",
    },
    {
      title: "Environmental Impact Report",
      price: "75 USDT",
      description: "CO2 reduction and sustainability metrics",
    },
    {
      title: "Waste Type Distribution",
      price: "40 USDT",
      description: "Plastic categorization and volume analysis",
    },
    {
      title: "Geographic Heat Maps",
      price: "60 USDT",
      description: "Collection density and coverage mapping",
    },
  ];

  // Fetch listed products from Supabase to display
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from("products").select("*");

      if (error) {
        console.error("Error fetching products:", error.message);
      } else if (data) {
        // Map database fields into your UI shape:
        setListedProducts(
          data.map((item: any) => ({
            id: item.id,
            product_name: item.name,
            price: item.price,
            category: item.category,
            description: item.description,
            product_images: item.image_url,
          })),
        );
      }
    };

    fetchProducts();
  }, []);

  // Add newly selected files to the pending image list instead of replacing it
  const handleProductImagesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setProductImages((prev) => [...prev, ...files]);
    setProductImageURLs((prev) => [
      ...prev,
      ...files.map((file) => URL.createObjectURL(file)),
    ]);
    // Reset so selecting the same file again still fires onChange
    e.target.value = "";
  };

  const handleRemoveProductImage = (e: React.MouseEvent, index: number) => {
    // Stop the click from bubbling to the wrapping <label> and reopening the file picker
    e.preventDefault();
    e.stopPropagation();

    setProductImageURLs((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload every selected image, returning the public URLs that succeeded
  const handleImagesUpload = async (): Promise<string[]> => {
    if (productImages.length === 0) return [];
    const uploadedUrls: string[] = [];

    for (const file of productImages) {
      const filePath = `product_images/${Date.now()}_${file.name}`;
      let uploaded = false;
      let lastError: string | null = null;

      for (const bucket of ["product-images", "waste-photos"]) {
        const { error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);

        if (!error) {
          const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);
          if (publicUrlData?.publicUrl)
            uploadedUrls.push(publicUrlData.publicUrl);
          uploaded = true;
          break;
        }

        lastError = error.message;
        console.error(
          `Image upload failed for bucket ${bucket}:`,
          error.message,
        );
      }

      if (!uploaded) {
        toast({
          title: "Image upload failed",
          description: lastError || `Could not upload ${file.name}.`,
          variant: "destructive",
        });
      }
    }

    return uploadedUrls;
  };

  const handleAddProduct = async () => {
    // Validate required fields
    if (
      !productName.trim() ||
      !productPrice.trim() ||
      !category.trim() ||
      !productDescription.trim()
    ) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    const priceNumber = Number(productPrice);
    if (isNaN(priceNumber) || priceNumber < 0) {
      toast({ title: "Invalid price", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    // Upload images (if provided)
    let imageUrls: string[] = [];
    if (productImages.length > 0) {
      imageUrls = await handleImagesUpload();
      if (imageUrls.length === 0) {
        setIsSubmitting(false);
        return;
      }
    }

    // Insert product details into Supabase
    const { error } = await supabase.from("products").insert([
      {
        name: productName,
        price: priceNumber,
        category: category,
        description: productDescription,
        image_url: imageUrls.length > 0 ? imageUrls.join(",") : null,
      },
    ]);

    setIsSubmitting(false);

    if (error) {
      console.error("Submission failed:", error.message);
      toast({ title: "Submission failed", variant: "destructive" });
    } else {
      toast({ title: "Product added to marketplace!" });
      setProductName("");
      setProductPrice("");
      setProductDescription("");
      setCategory("");
      productImageURLs.forEach((url) => URL.revokeObjectURL(url));
      setProductImages([]);
      setProductImageURLs([]);
      // Optionally re-fetch products here
    }
  };

  const handlePurchaseAnalytics = async (item: string, price: string) => {
    try {
      // Set up provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum); // assumes MetaMask or similar
      const signer = await provider.getSigner();

      // Define your contract address and ABI
      const contractAddress = CONTRACTS.PAYMENT_HANDLER;

      const contract = new ethers.Contract(
        contractAddress,
        PaymentHandlerABI,
        signer,
      );

      // Define how much ETH to send (e.g., 0.00025 ETH ≈ $0.50 at some rate)
      const amountInEth = "0.00025"; // adjust as needed
      const tx = await contract.receiveUserPayment({
        value: ethers.parseEther(amountInEth),
      });

      await tx.wait();

      // Show download link
      toast({
        title: "✅ Payment Complete",
        description: `Access granted to ${item}. Download: https://drive.google.com/sample-report`,
      });
    } catch (error) {
      console.error("Payment failed:", error);
      toast({
        title: "❌ Payment Error",
        description: "Something went wrong during the transaction.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-emerald-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-emerald-700">
                  Logistics Organization Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Waste Processing & Analytics Hub
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-emerald-100 text-emerald-700 px-4 py-2">
                <DollarSign className="w-4 h-4 mr-2" /> $2,340 Revenue
              </Badge>
              {/* <Button onClick={onMarketplace} className="bg-emerald-600 hover:bg-emerald-700">
                Marketplace
              </Button> */}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-md">
            <TabsTrigger value="analytics">Analytics Dashboard</TabsTrigger>
            <TabsTrigger value="marketplace-mgmt">
              Marketplace Management
            </TabsTrigger>
            <TabsTrigger value="data-store">Data Store</TabsTrigger>
          </TabsList>

          {/* Analytics Dashboard Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Overview Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Package className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Collections</p>
                      <p className="text-2xl font-bold text-green-700">
                        {analyticsData.reduce(
                          (sum, d) => sum + d.collections,
                          0,
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-8 h-8 text-emerald-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Weight</p>
                      <p className="text-2xl font-bold text-emerald-700">
                        {analyticsData.reduce((sum, d) => sum + d.weight, 0)}kg
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-teal-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Users className="w-8 h-8 text-teal-600" />
                    <div>
                      <p className="text-sm text-gray-600">Active Users</p>
                      <p className="text-2xl font-bold text-teal-700">892</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-lime-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-8 h-8 text-lime-700" />
                    <div>
                      <p className="text-sm text-gray-600">Coverage Areas</p>
                      <p className="text-2xl font-bold text-lime-800">24</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-emerald-200">
                <CardHeader>
                  <CardTitle className="text-emerald-700">
                    Collection Trends
                  </CardTitle>
                  <CardDescription>
                    Monthly waste collection volume
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="weight" fill="#059669" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-700">
                    Waste Type Distribution
                  </CardTitle>
                  <CardDescription>Breakdown by plastic type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={wasteTypeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={(entry) => `${entry.name}: ${entry.value}%`}
                      >
                        {wasteTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Marketplace Management Tab */}
          <TabsContent value="marketplace-mgmt" className="space-y-6">
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="flex items-center text-emerald-700">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add Biodegradable Product
                </CardTitle>
                <CardDescription>
                  List eco-friendly products for PPEN token redemption
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="product-name">Product Name</Label>
                      <Input
                        id="product-name"
                        placeholder="e.g., Bamboo Toothbrush Set"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="product-price">Price (PPEN Tokens)</Label>
                      <Input
                        id="product-price"
                        type="number"
                        placeholder="e.g., 25"
                        value={productPrice}
                        onChange={(e) => setProductPrice(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="product-category">Category</Label>
                      <select
                        id="product-category"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value="">Select category</option>
                        <option value="household">Household Items</option>
                        <option value="personal-care">Personal Care</option>
                        <option value="food">Food Products</option>
                        <option value="clothing">Eco Clothing</option>
                        <option value="gardening">Gardening Supplies</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="product-description">Description</Label>
                      <textarea
                        id="product-description"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        rows={4}
                        placeholder="Describe your biodegradable product..."
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Product Images</Label>
                      {/* Image upload area with hidden input; previews render inside the same dropzone */}
                      <label
                        htmlFor="image-upload"
                        className="block cursor-pointer"
                      >
                        <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center transition-colors hover:border-emerald-400">
                          {productImageURLs.length > 0 ? (
                            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                              {productImageURLs.map((url, index) => (
                                <div
                                  key={url}
                                  className="group relative aspect-square overflow-hidden rounded-md border border-emerald-200"
                                >
                                  <img
                                    src={url}
                                    alt={`Product preview ${index + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      handleRemoveProductImage(e, index)
                                    }
                                    aria-label="Remove image"
                                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                              <div className="flex aspect-square items-center justify-center rounded-md border border-dashed border-emerald-300 text-emerald-600">
                                <Plus className="h-6 w-6" />
                              </div>
                            </div>
                          ) : (
                            <div className="py-2">
                              <Package className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                              <p className="text-sm text-gray-600">
                                Upload product images
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                PNG, JPG up to 10MB • multiple allowed
                              </p>
                            </div>
                          )}
                        </div>
                      </label>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleProductImagesChange}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  disabled={isSubmitting}
                  onClick={handleAddProduct}
                  className="w-full btn-brand border-0"
                  size="lg"
                >
                  {isSubmitting
                    ? "Adding Product..."
                    : "Add Product to Marketplace"}
                </Button>
              </CardContent>
            </Card>

            {/* Current Products */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-700">
                  Your Listed Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {listedProducts.length > 0 ? (
                    listedProducts.map((product, index) => (
                      <Card
                        key={product.id || index}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-2">
                            {product.product_name}
                          </h4>
                          <div className="flex justify-between items-center">
                            <span className="text-emerald-600 font-medium">
                              {product.price} PPEN
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center">
                      Products will be listed upon verification.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Store Tab */}
          <TabsContent value="data-store" className="space-y-6">
            <Card className="border-teal-200">
              <CardHeader>
                <CardTitle className="flex items-center text-teal-700">
                  <Eye className="w-5 h-5 mr-2" />
                  Premium Analytics Store
                </CardTitle>
                <CardDescription>
                  Purchase detailed environmental and user analytics data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {analyticsOptions.map((item, idx) => (
                    <Card
                      key={idx}
                      className="border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-lg">
                            {item.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {item.description}
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="text-xl font-bold text-teal-600">
                              {item.price}
                            </span>
                            <Button
                              onClick={() =>
                                handlePurchaseAnalytics(item.title, item.price)
                              }
                              variant="outline"
                              className="border-teal-200 hover:bg-teal-50"
                            >
                              Purchase Access
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LogisticsOrgDashboard;
