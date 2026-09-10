"use client";

import { useI18n } from "@/lib/i18n/provider";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { StarRating } from "@/components/ui/star-rating";

export function RateMatchButton({
  matchId,
  employeeName,
}: {
  matchId: string;
  employeeName?: string | null;
}) {
  const { tr } = useI18n();

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [service, setService] = useState(0);
  const [table, setTable] = useState(0);
  const [overall, setOverall] = useState(0);
  const [comment, setComment] = useState("");

  async function submit() {
    if (!service || !table || !overall) {
      toast.error(tr("Please rate all three categories"));
      return;
    }
    setLoading(true);
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId,
        serviceStars: service,
        tableStars: table,
        overallStars: overall,
        comment: comment || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error(tr("Could not save rating"));
      return;
    }
    toast.success(tr("Thanks for the feedback!"));
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Star size={14} /> {tr("Rate")}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={tr("Rate your experience")}
      >
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium">
              {tr("Service")}
              {employeeName
                ? tr(" — managed by {name}", { name: employeeName })
                : ""}
            </p>
            <StarRating
              value={service}
              onChange={setService}
              label={tr("Service rating")}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">{tr("Table condition")}</p>
            <StarRating
              value={table}
              onChange={setTable}
              label="Table rating"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">
              {tr("Overall experience")}
            </p>
            <StarRating
              value={overall}
              onChange={setOverall}
              label="Overall rating"
            />
          </div>
          <Textarea
            rows={3}
            maxLength={500}
            placeholder={tr("Anything we should know? (optional)")}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button className="w-full" onClick={submit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {tr("Submit rating")}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
