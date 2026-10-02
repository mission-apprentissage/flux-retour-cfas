"use client";

import NextError from "next/error";
import { useEffect } from "react";

import { reportBoundaryError } from "@/common/reportError";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    reportBoundaryError(error, "global");
  }, [error]);

  return (
    <html>
      <body>
        {/* This is the default Next.js error component but it doesn't allow omitting the statusCode property yet. */}
        <NextError statusCode={500} />
      </body>
    </html>
  );
}
