"use client";

import { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { PasscodeGate } from "./PasscodeGate";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { isAuthenticated, setAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <PasscodeGate onAuthenticate={() => setAuthenticated(true)} />;
  }

  return <>{children}</>;
}