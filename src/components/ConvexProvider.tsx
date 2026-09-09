"use client";

import { ConvexProvider as BaseConvexProvider } from "convex/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

// Convex URL - falls back to a placeholder if not set (won't connect but won't crash)
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

export function ConvexProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    // If no Convex URL is configured, return null and render children without Convex
    if (!CONVEX_URL) {
      console.warn("NEXT_PUBLIC_CONVEX_URL is not set. Convex features will be disabled.");
      return null;
    }
    return new ConvexReactClient(CONVEX_URL);
  }, []);

  // If Convex is not configured, just render children without the provider
  if (!convex) {
    return <>{children}</>;
  }

  return <BaseConvexProvider client={convex}>{children}</BaseConvexProvider>;
}
