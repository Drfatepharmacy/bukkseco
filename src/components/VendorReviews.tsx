import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, MessageSquare, Clock, User } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const VendorReviews = ({ vendorId }: { vendorId: string }) => {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["vendor-reviews", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles:reviewer_id (full_name, avatar_url),
          orders:order_id (order_number)
        `)
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
  });

  if (isLoading) return <div className="text-center py-8 text-muted-foreground font-body">Loading reviews...</div>;

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-xl">
        <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground font-body">No reviews yet. Your feedback helps us grow!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review: any, i: number) => (
        <motion.div
          key={review.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className="border-border/50 shadow-none hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="w-10 h-10 border border-border">
                  <AvatarImage src={review.profiles?.avatar_url} />
                  <AvatarFallback className="bg-primary/5 text-primary">
                    {review.profiles?.full_name?.charAt(0) || <User className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-display font-semibold text-sm text-foreground truncate">
                      {review.profiles?.full_name || "Anonymous Student"}
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-body flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s <= review.rating ? "text-primary fill-primary" : "text-muted fill-muted"
                        }`}
                      />
                    ))}
                    <span className="text-[10px] text-muted-foreground ml-2 font-body">
                      Order #{review.orders?.order_number?.slice(-4)}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground font-body leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
