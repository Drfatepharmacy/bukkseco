import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReviewDialogProps {
  order: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ReviewDialog = ({ order, onSuccess, onCancel }: ReviewDialogProps) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        order_id: order.id,
        reviewer_id: order.buyer_id,
        vendor_id: order.vendor_id,
        rating,
        comment: comment.trim(),
      });

      if (error) throw error;

      toast.success("Review submitted! Thank you.");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h3 className="font-display font-bold text-lg">Rate your experience</h3>
      <p className="text-sm text-muted-foreground font-body">Order #{order.order_number}</p>

      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="focus:outline-none"
          >
            <Star
              className={`w-8 h-8 ${
                star <= rating ? "text-primary fill-primary" : "text-muted border-muted"
              }`}
            />
          </button>
        ))}
      </div>

      <Textarea
        placeholder="Share your thoughts about the meal and delivery..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="font-body"
      />

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1" disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="flex-1 btn-gold" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Review"}
        </Button>
      </div>
    </div>
  );
};
