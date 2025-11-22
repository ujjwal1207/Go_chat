import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuthStore } from "./store/auth.js";
import { AuthPage } from "./components/AuthPage.jsx";
import { OnboardingModal } from "./components/OnboardingModal.jsx";
import { ChatLayout } from "./components/ChatLayout.jsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { isAuthenticated, user, initializeAuth } = useAuthStore();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Initialize auth on app startup
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // Check if user needs onboarding (first time or incomplete profile)
    if (isAuthenticated && user && user.email) {
      // Check if user has a proper name (not just email prefix)
      const emailPrefix = user.email.split("@")[0];
      const displayName = user.displayName || user.display_name || user.name;
      const hasCustomName =
        displayName && displayName.trim() !== "" && displayName !== emailPrefix;

      console.log("Onboarding check:", {
        userEmail: user.email,
        userName: user.name,
        userDisplayName: user.displayName || user.display_name,
        emailPrefix,
        hasCustomName,
        willShowOnboarding: !hasCustomName,
      });

      setShowOnboarding(!hasCustomName);
    } else if (isAuthenticated && user) {
      // If user exists but no email, still might need onboarding
      const displayName = user.displayName || user.display_name || user.name;
      const needsOnboarding = !displayName || displayName.trim() === "";
      console.log("Onboarding check (no email):", {
        userName: user.name,
        userDisplayName: user.displayName || user.display_name,
        needsOnboarding,
      });
      setShowOnboarding(needsOnboarding);
    }
  }, [isAuthenticated, user]);

  const handleAuthSuccess = () => {
    // After successful authentication, check if onboarding is needed
    const currentUser = useAuthStore.getState().user;
    if (currentUser && currentUser.email) {
      const emailPrefix = currentUser.email.split("@")[0];
      const displayName =
        currentUser.displayName || currentUser.display_name || currentUser.name;
      const hasCustomName =
        displayName && displayName.trim() !== "" && displayName !== emailPrefix;
      setShowOnboarding(!hasCustomName);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-white dark:bg-zinc-900">
          <Routes>
            <Route
              path="/auth"
              element={
                isAuthenticated ? (
                  <Navigate to="/" replace />
                ) : (
                  <AuthPage onSuccess={handleAuthSuccess} />
                )
              }
            />
            <Route
              path="/*"
              element={
                isAuthenticated ? (
                  <>
                    <ChatLayout />
                    <OnboardingModal
                      isOpen={showOnboarding}
                      onComplete={handleOnboardingComplete}
                    />
                  </>
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
