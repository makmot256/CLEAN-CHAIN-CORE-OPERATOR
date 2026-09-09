import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, Database, ExternalLink } from "lucide-react";
import {
  ADMIN_SETUP_SQL,
  SUPABASE_SQL_EDITOR_URL,
} from "@/lib/adminSetup";

interface AdminSetupBannerProps {
  onRetry: () => void;
}

const AdminSetupBanner = ({ onRetry }: AdminSetupBannerProps) => {
  const [copied, setCopied] = useState(false);

  const copySql = async () => {
    await navigator.clipboard.writeText(ADMIN_SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <Database className="mt-0.5 h-5 w-5 text-amber-700" />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-amber-950">Finish database setup (one time)</h2>
          <p className="mt-1 text-sm text-amber-900">
            The user directory table does not exist yet. Copy the SQL, paste it in
            the Supabase SQL Editor, click Run, then retry here.
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-amber-900">
            <li>Click Copy SQL</li>
            <li>Open the SQL Editor</li>
            <li>Paste and press Run</li>
            <li>Come back and click Retry</li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={copySql} className="bg-amber-800 hover:bg-amber-900">
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied" : "Copy SQL"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <a href={SUPABASE_SQL_EDITOR_URL} target="_blank" rel="noopener noreferrer">
                Open SQL Editor
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button type="button" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSetupBanner;
