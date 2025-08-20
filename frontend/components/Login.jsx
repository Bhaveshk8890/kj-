import React, { useState, useEffect } from "react";
import { AuthService } from "../services/auth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Mock company domains - replace with your actual company domains
  const allowedDomains = ["shellkode.com"];

  const validateEmail = (email) => {
    const domain = email.split("@")[1];
    return allowedDomains.includes(domain);
  };

  const handleGoogleSSO = async () => {
    setIsLoading(true);
    setError("");

    try {
      // @ts-ignore
      if (typeof google === "undefined") {
        throw new Error(
          "Google OAuth not loaded. Please refresh and try again."
        );
      }

      // @ts-ignore
      google.accounts.id.initialize({
        client_id:
          "813129216730-sr4cu8e2eb7agvn3m33o200v9k7okcbn.apps.googleusercontent.com", // Replace with your actual Google Client ID
        callback: async (response) => {
          try {
            // Send ID token to backend for verification
            const authResponse = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: response.credential }),
            });

            if (!authResponse.ok) {
              throw new Error("Authentication failed");
            }

            const { user, token } = await authResponse.json();

            // Store token for API requests
            localStorage.setItem("access_token", token);

            onLogin(user);
          } catch (err) {
            setError(err.message || "Authentication failed. Please try again.");
          } finally {
            setIsLoading(false);
          }
        },
      });

      // @ts-ignore
      google.accounts.id.prompt();
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    // For demo purposes - remove in production
    const demoUser = {
      email: "demo@yourcompany.com",
      name: "Demo User",
      picture: "https://via.placeholder.com/40",
      department: "Engineering",
    };
    onLogin(demoUser);
  };

  return (
    <div className="dark min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border shadow-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl text-foreground font-medium">
            Internal AI Assistant
          </CardTitle>
          <p className="text-muted-foreground">
            Sign in with your company account
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert
              variant="destructive"
              className="border-destructive/50 bg-destructive/10"
            >
              <AlertDescription className="text-destructive-foreground">
                {error}
              </AlertDescription>
            </Alert>
          )}



          <Button
            onClick={handleGoogleSSO}
            disabled={isLoading}
            className="w-full bg-white text-gray-900 hover:bg-gray-100 h-12 font-medium shadow-md"
          >
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285f4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34a853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#fbbc05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#ea4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </div>
            )}
          </Button>

          {/* Demo login button - remove in production
          <Button
            onClick={handleDemoLogin}
            variant="outline"
            className="w-full border-border text-foreground hover:bg-accent h-12 font-medium"
          >
            Demo Login (Development Only)
          </Button> */}



          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Only company email addresses are allowed to access this application.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
