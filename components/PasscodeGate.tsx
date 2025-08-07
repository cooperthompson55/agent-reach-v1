"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PasscodeGateProps {
  onAuthenticate: () => void;
}

export function PasscodeGate({ onAuthenticate }: PasscodeGateProps) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);
  
  const CORRECT_PASSCODE = "5822";

  const sendAuthNotification = async () => {
    try {
      await fetch('/api/auth-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Failed to send auth notification:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === CORRECT_PASSCODE) {
      onAuthenticate();
      // Store auth state in localStorage
      localStorage.setItem("isAuthenticated", "true");
      // Send notification email
      await sendAuthNotification();
    } else {
      setError(true);
      setPasscode("");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Enter Passcode</h1>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter passcode"
              value={passcode}
              onChange={(e) => {
                setError(false);
                setPasscode(e.target.value);
              }}
              className="w-full"
            />
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  Incorrect passcode. Please try again.
                </AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full">
              Submit
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}