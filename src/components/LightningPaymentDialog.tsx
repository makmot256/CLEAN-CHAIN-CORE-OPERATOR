import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, ExternalLink, Loader2, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  checkEducationInvoice,
  createEducationInvoice,
  type EducationCourse,
} from "@/lib/education";

const POLL_INTERVAL_MS = 3000;

interface LightningPaymentDialogProps {
  course: EducationCourse | null;
  username: string | null;
  onClose: () => void;
  onPaid: (courseId: string, url: string) => void;
}

/**
 * Shows a Lightning invoice for a course as a QR code + "Open in wallet"
 * link, and polls the server until it's paid. Users pay from their Blink
 * wallet (scan, or tap the lightning: link on mobile).
 */
const LightningPaymentDialog = ({
  course,
  username,
  onClose,
  onPaid,
}: LightningPaymentDialogProps) => {
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<{
    paymentRequest: string;
    paymentHash: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    setInvoice(null);
    setError(null);
    setExpired(false);
    if (!course || !username) return;

    let cancelled = false;
    createEducationInvoice(username, course.id)
      .then((inv) => !cancelled && setInvoice(inv))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [course, username]);

  useEffect(() => {
    if (!invoice || !username || !course) return;

    const timer = window.setInterval(async () => {
      try {
        const result = await checkEducationInvoice(
          username,
          invoice.paymentHash,
        );
        if (result.status === "PAID" && result.url) {
          window.clearInterval(timer);
          onPaid(course.id, result.url);
        } else if (result.status === "EXPIRED") {
          window.clearInterval(timer);
          setExpired(true);
        }
      } catch {
        // Transient network error — keep polling.
      }
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [invoice, username, course, onPaid]);

  const copyInvoice = async () => {
    if (!invoice) return;
    await navigator.clipboard.writeText(invoice.paymentRequest);
    toast({ title: "Invoice copied", description: "Paste it in your Blink wallet." });
  };

  return (
    <Dialog open={Boolean(course)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Pay {course?.priceSats} sats
          </DialogTitle>
          <DialogDescription>
            Scan with your Blink wallet to unlock "{course?.title}".
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : expired ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            This invoice expired. Close this window and try again.
          </p>
        ) : !invoice ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating invoice…
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center rounded-lg bg-white p-4">
              <QRCodeSVG
                value={`lightning:${invoice.paymentRequest}`.toUpperCase()}
                size={220}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={copyInvoice}>
                <Copy className="mr-2 h-4 w-4" />
                Copy invoice
              </Button>
              <Button asChild className="flex-1">
                <a href={`lightning:${invoice.paymentRequest}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in wallet
                </a>
              </Button>
            </div>
            <p className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Waiting for payment…
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LightningPaymentDialog;
