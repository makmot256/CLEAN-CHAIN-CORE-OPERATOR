interface WasteSubmission {
  id: number;
  waste_type: string;
  weight: number;
  description?: string;
  latitude?: string;
  longitude?: string;
  submitted_by: string;
}

type TransformedJob = {
  id: number;
  type: string;
  weight: number;
  location: string;
  user: string;
  distance: string;
  reward: string;
};
interface CompletedJob {
  id: number;
  type: string;
  weight: number;
  location: string;
  user: string;
  reward: string;
  completedAt: string;
}

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  CheckCircle,
  Clock,
  Navigation,
  Coins,
  ArrowLeft,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import WasteMap from "./WasteMap";
import { supabase } from "@/lib/supabaseClient";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useWallet } from "@/hooks/useWallet";

interface WasteTrackerDashboardProps {
  onBack: () => void;
  onMarketplace: () => void;
}

const WasteTrackerDashboard = ({
  onBack,
  onMarketplace,
}: WasteTrackerDashboardProps) => {
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submissions, setSubmissions] = useState<WasteSubmission[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { account } = useWallet();
  const { balance: tokenBalance, isLoading: balanceLoading } =
    useTokenBalance(account);

  useEffect(() => {
    const fetchSubmissions = async () => {
      const { data, error } = await supabase
        .from("waste_table")
        .select("*")
        .eq("status", "submitted");

      if (error) {
        console.error("Error fetching submissions:", error.message);
      } else if (data) {
        // Type assertion: adjust as needed
        setSubmissions(data as WasteSubmission[]);
      }
    };

    fetchSubmissions();
  }, []);

  useEffect(() => {
    const fetchCompletedJobs = async () => {
      const { data, error } = await supabase
        .from("waste_table")
        .select("*")
        .eq("status", "accepted");

      if (error) {
        console.error("Error fetching completed jobs:", error.message);
      } else if (data) {
        const transformed = data.map((job) => ({
          id: job.id,
          type: job.waste_type,
          weight: job.weight,
          location: job.description ?? "Unknown",
          user: job.submitted_by,
          reward: `${(job.weight * 0.1).toFixed(1)} PPEN`,
          completedAt: new Date(
            job.updated_at || job.created_at,
          ).toLocaleString(), // if timestamp exists
        }));

        setCompletedJobs(transformed);
      }
    };

    fetchCompletedJobs();
  }, []);
  ///
  const wasteCollections = [
    {
      id: 1,
      type: "Plastic Bottles",
      weight: "3.2kg",
      location: "Downtown Park",
      user: "Alice Johnson",
      distance: "0.8km",
      reward: "3.2 PPEN",
      status: "pending",
    },
    {
      id: 2,
      type: "Food Containers",
      weight: "2.1kg",
      location: "Shopping Mall",
      user: "Bob Wilson",
      distance: "1.2km",
      reward: "2.1 PPEN",
      status: "pending",
    },
    {
      id: 3,
      type: "Plastic Bags",
      weight: "1.8kg",
      location: "Beach Area",
      user: "Carol Davis",
      distance: "2.5km",
      reward: "1.8 PPEN",
      status: "pending",
    },
  ];
  /////start

  const jobsToDisplay = submissions.map((job) => ({
    id: job.id,
    type: job.waste_type,
    weight: `${job.weight} kg`,
    location: job.description ?? "Unknown",
    user: job.submitted_by,
    distance: "—",
    reward: `${(job.weight * 1.0).toFixed(1)} PPEN`, // → use numeric weight
  }));

  //const completedJobs = [
  //  { id: 4, type: "Mixed Plastics", weight: "4.5kg", location: "City Center", user: "David Brown", reward: "4.5 PPEN", completedAt: "2 hours ago" },
  // { id: 5, type: "Bottle Collection", weight: "2.8kg", location: "Park District", user: "Emma Wilson", reward: "2.8 PPEN", completedAt: "1 day ago" },
  //];
  /////start
  // …inside WasteTrackerDashboard component
  const handleAcceptJob = async (job: WasteSubmission) => {
    const { error: acceptErr } = await supabase
      .from("waste_table")
      .update({ status: "accepted" })
      .eq("id", job.id);
    if (acceptErr) {
      console.error("Error accepting job:", acceptErr);
      toast({
        title: "Could not accept job",
        description: acceptErr.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Job accepted",
      description:
        "Pickup recorded. PPEN is granted after an admin verifies the report is unique and at a prominent disposal site.",
    });

    const newCompleted: CompletedJob = {
      id: job.id,
      type: job.waste_type,
      weight: job.weight,
      location: job.description ?? "Unknown",
      user: job.submitted_by,
      reward: "Pending admin",
      completedAt: "just now",
    };

    setCompletedJobs((prev) => [...prev, newCompleted]);
    setSubmissions((prev) => prev.filter((j) => j.id !== job.id));
  };

  const handleCompleteJob = (jobId: number) => {
    toast({
      title: "Job Completed!",
      description:
        "Transaction signed and verified on blockchain. PPEN tokens have been awarded.",
    });
  };

  ////////start
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);

      // Destructure both data and error here:
      const { data: pending, error: pendingError } = await supabase
        .from("waste_table")

        .select("*");
      // .eq('status', 'submitted');   ← you can re-enable this once you confirm the status values

      // Now both variables exist:
      console.log("pending fetch →", { pending, pendingError });

      if (pendingError) {
        console.error("Supabase fetch error:", pendingError);
      }

      if (pending) {
        setSubmissions(pending as WasteSubmission[]);
      }

      setLoading(false);
    };

    fetchJobs();
  }, []);

  /* useEffect(() => {
     // Initialize a simple map representation
     if (mapRef.current) {
       mapRef.current.innerHTML = `
         <div class="relative w-full h-full bg-gradient-to-br from-blue-100 to-green-100 rounded-lg overflow-hidden">
           <div class="absolute inset-0 opacity-20">
             <svg viewBox="0 0 400 300" class="w-full h-full">
               <!-- Streets -->
               <line x1="0" y1="100" x2="400" y2="100" stroke="#666" stroke-width="2"/>
               <line x1="0" y1="200" x2="400" y2="200" stroke="#666" stroke-width="2"/>
               <line x1="100" y1="0" x2="100" y2="300" stroke="#666" stroke-width="2"/>
               <line x1="300" y1="0" x2="300" y2="300" stroke="#666" stroke-width="2"/>
             </svg>
           </div>
           <!-- Waste Collection Points -->
           <div class="absolute top-16 left-20 w-4 h-4 bg-red-500 rounded-full animate-pulse border-2 border-white shadow-lg"></div>
           <div class="absolute top-32 left-48 w-4 h-4 bg-red-500 rounded-full animate-pulse border-2 border-white shadow-lg"></div>
           <div class="absolute top-24 left-72 w-4 h-4 bg-red-500 rounded-full animate-pulse border-2 border-white shadow-lg"></div>
           <div class="absolute bottom-20 left-32 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
           <div class="absolute bottom-16 right-20 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
           
           <!-- Current Location -->
           <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-blue-600 rounded-full border-4 border-white shadow-lg">
             <div class="absolute inset-0 bg-blue-400 rounded-full animate-ping"></div>
           </div>
           
           <!-- Legend -->
           <div class="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs">
             <div class="flex items-center space-x-2 mb-1">
               <div class="w-3 h-3 bg-red-500 rounded-full"></div>
               <span>Pending Collections</span>
             </div>
             <div class="flex items-center space-x-2 mb-1">
               <div class="w-3 h-3 bg-green-500 rounded-full"></div>
               <span>Completed</span>
             </div>
             <div class="flex items-center space-x-2">
               <div class="w-3 h-3 bg-blue-600 rounded-full"></div>
               <span>Your Location</span>
             </div>
           </div>
         </div>
       `;
     }
 }, []); */

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
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
                  Waste Tracker Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Collection & Verification Hub
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-emerald-100 text-emerald-700 px-4 py-2">
                <Coins className="w-4 h-4 mr-2" />
                {balanceLoading ? "Loading..." : `${tokenBalance} PPEN`}
              </Badge>
              {/* <Button onClick={onMarketplace} className="bg-emerald-600 hover:bg-emerald-700">
                Marketplace
              </Button> */}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="map-view" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-md">
            <TabsTrigger value="map-view">GPS Map View</TabsTrigger>
            <TabsTrigger value="available-jobs">Available Jobs</TabsTrigger>
            <TabsTrigger value="completed-jobs">Completed Jobs</TabsTrigger>
          </TabsList>

          {/* Map View Tab */}
          <TabsContent value="map-view" className="space-y-6">
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="flex items-center text-emerald-700">
                  <MapPin className="w-5 h-5 mr-2" />
                  Live Waste Collection Map
                </CardTitle>
                <CardDescription>
                  View GPS-mapped waste locations and optimize your collection
                  routes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div
                    style={{ height: "500px" }}
                    className="rounded-lg overflow-hidden border border-emerald-200"
                  >
                    {/* <ErrorBoundary>
  <WasteMap />
</ErrorBoundary> */}
                    <WasteMap />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <Card className="bg-red-50 border-red-200">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">3</div>
                        <div className="text-sm text-red-700">
                          Pending Collections
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          12
                        </div>
                        <div className="text-sm text-green-700">
                          Completed Today
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-teal-50 border-teal-200">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-teal-600">
                          8.2km
                        </div>
                        <div className="text-sm text-teal-700">
                          Optimal Route
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Available Jobs Tab */}
          <TabsContent value="available-jobs" className="space-y-6">
            <div className="grid gap-4">
              {loading ? (
                <p className="text-center text-blue-600">Loading jobs...</p>
              ) : submissions.length === 0 ? (
                <p className="text-center text-gray-500">
                  No jobs available right now.
                </p>
              ) : (
                submissions.map((job) => (
                  <Card
                    key={job.id}
                    className="border-yellow-200 hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-lg">
                              {job.waste_type}
                            </h4>
                            <Badge
                              variant="outline"
                              className="border-yellow-400 text-yellow-700"
                            >
                              <Clock className="w-3 h-3 mr-1" /> Pending
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-2" />
                              Submitted by: {job.submitted_by}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              Location:{" "}
                              {job.latitude && job.longitude
                                ? `${job.latitude}, ${job.longitude}`
                                : "Unknown"}
                            </div>
                            <div>Weight: {job.weight}kg</div>
                            <div className="flex items-center">
                              <Navigation className="w-4 h-4 mr-2" /> —
                            </div>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="text-sm font-medium text-blue-800">
                              Reward: {job.weight.toFixed(1)} PPEN
                            </div>
                            <div className="text-xs text-blue-600">
                              Plus verification bonus
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Button onClick={() => handleAcceptJob(job)}>
                            Accept Job
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            View Route
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Completed Jobs Tab */}
          <TabsContent value="completed-jobs" className="space-y-6">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center text-green-700">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Completed Collections
                </CardTitle>
                <CardDescription>
                  Your verified waste collection history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200"
                    >
                      <div>
                        <h4 className="font-semibold">{job.type}</h4>
                        <p className="text-sm text-gray-600">
                          {job.weight} • {job.location} • Collected from{" "}
                          {job.user}
                        </p>
                        <p className="text-xs text-gray-500">
                          Completed {job.completedAt}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />+{job.reward}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          Blockchain Verified
                        </p>
                      </div>
                    </div>
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

export default WasteTrackerDashboard;
//function setPendingJobs(pending: any[]) {
// throw new Error('Function not implemented.');
//}
