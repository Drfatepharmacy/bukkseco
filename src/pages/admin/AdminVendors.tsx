import { useState } from "react";
import { Users, CheckCircle, XCircle, Search, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardSidebar from "@/components/DashboardSidebar";
import { dashboardConfigs } from "@/config/dashboardConfig";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminVendors = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["admin-vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_profiles")
        .select(`
            *,
            profiles (*)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleApproval = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase.from("vendor_profiles").update({ is_approved: approved }).eq("id", id);
      if (error) throw error;

      // Also update profile approval if necessary
      const vendor = vendors.find(v => v.id === id);
      if (vendor?.user_id) {
          await supabase.from("profiles").update({ is_approved: approved }).eq("id", vendor.user_id);
      }
    },
    onSuccess: () => {
      toast.success("Vendor status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const navItems = dashboardConfigs.admin.navItems.map((item) => ({
    ...item,
    active: item.label === "Approve Vendors",
    onClick: () => {
      if (item.label === "Overview") navigate("/admin/dashboard");
      else if (item.label === "Monitor Orders") navigate("/admin/orders");
    },
  }));

  const filteredVendors = vendors.filter(v => v.business_name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardSidebar
        items={navItems}
        role="Admin"
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <main className={`transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Vendor Management</h1>
              <p className="text-muted-foreground font-body text-sm mt-1">Review and approve vendor applications</p>
            </div>
          </div>

          <div className="relative mb-6">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input
                className="pl-10 bg-white"
                placeholder="Search vendors by business name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
             />
          </div>

          <Tabs defaultValue="all">
            <TabsList className="mb-6">
                <TabsTrigger value="all">All Vendors</TabsTrigger>
                <TabsTrigger value="pending">Pending Approval</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
                {isLoading ? (
                   <div className="space-y-4">
                      {[1,2,3].map(i => <div key={i} className="h-32 bg-white/50 animate-pulse rounded-xl" />)}
                   </div>
                ) : filteredVendors.length === 0 ? (
                   <div className="bg-white rounded-xl p-12 text-center border">
                      <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                      <p className="text-muted-foreground">No vendors found.</p>
                   </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                      {filteredVendors.map(vendor => (
                          <Card key={vendor.id} className="overflow-hidden border-border bg-white">
                              <CardContent className="p-6">
                                  <div className="flex flex-col md:flex-row justify-between gap-6">
                                      <div className="flex gap-4">
                                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                                              {vendor.business_name[0]}
                                          </div>
                                          <div className="space-y-1">
                                              <div className="flex items-center gap-2">
                                                  <span className="font-bold text-lg">{vendor.business_name}</span>
                                                  <Badge className={`capitalize ${vendor.is_approved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`} variant="secondary">
                                                      {vendor.is_approved ? "Approved" : "Pending"}
                                                  </Badge>
                                              </div>
                                              <p className="text-sm text-muted-foreground">{vendor.food_category}</p>
                                              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2">
                                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                      <Mail className="w-3 h-3" /> {vendor.profiles?.email}
                                                  </div>
                                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                      <Phone className="w-3 h-3" /> {vendor.profiles?.phone || "No phone"}
                                                  </div>
                                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                      <MapPin className="w-3 h-3" /> {vendor.profiles?.city}, {vendor.profiles?.state}
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                          {!vendor.is_approved ? (
                                              <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => toggleApproval.mutate({ id: vendor.id, approved: true })}>
                                                  <CheckCircle className="w-4 h-4 mr-2" /> Approve
                                              </Button>
                                          ) : (
                                              <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => toggleApproval.mutate({ id: vendor.id, approved: false })}>
                                                  <XCircle className="w-4 h-4 mr-2" /> Suspend
                                              </Button>
                                          )}
                                          <Button variant="ghost" size="sm">Details</Button>
                                      </div>
                                  </div>
                              </CardContent>
                          </Card>
                      ))}
                  </div>
                )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminVendors;
