"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { createContext, useContext, useEffect, useRef, useState } from "react";

type DbUser = { username: string | null; isAdmin: boolean; isEmployee: boolean } | null;

const UserContext = createContext<DbUser>(null);

export function useDbUser() {
  return useContext(UserContext);
}

function DbUserProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const [dbUser, setDbUser] = useState<DbUser>(null);
  const didFetchRef = useRef(false);

  useEffect(() => {
    if (!isSignedIn) {
      didFetchRef.current = false;
      setDbUser(null);
      return;
    }

    if (didFetchRef.current) {
      return;
    }

    didFetchRef.current = true;

    fetch("/api/me", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch db user");
        }
        const data = (await res.json()) as { username: string | null; isAdmin: boolean; isEmployee: boolean } | null;
        setDbUser(data);
      })
      .catch(() => {
        didFetchRef.current = false;
      });
  }, [isSignedIn]);

  return (
    <UserContext.Provider value={dbUser}>
      {children}
    </UserContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/api/sync-onboarding"
      signUpFallbackRedirectUrl="/api/sync-onboarding"
    >
      <DbUserProvider>
        {children}
      </DbUserProvider>
      <Toaster position="top-right" richColors closeButton />
    </ClerkProvider>
  );
}
