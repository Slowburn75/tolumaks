"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }
    authApi
      .verifyEmail(token)
      .then((res: unknown) => {
        const msg =
          (res as { message?: string; data?: { message?: string } })?.data?.message ||
          (res as { message?: string })?.message ||
          "Email verified successfully";
        setMessage(msg);
        setStatus("success");
      })
      .catch((err: Error) => {
        setMessage(err.message || "Verification failed");
        setStatus("error");
      });
  }, [token]);

  return (
    <StoreLayout>
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <h1 className="text-2xl font-bold mb-2">Verifying your email…</h1>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h1 className="text-2xl font-bold mb-2">Email verified</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Button asChild>
              <Link href="/login">Continue to login</Link>
            </Button>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h1 className="text-2xl font-bold mb-2">Verification failed</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Button asChild variant="outline">
              <Link href="/">Back to store</Link>
            </Button>
          </>
        )}
      </div>
    </StoreLayout>
  );
}
