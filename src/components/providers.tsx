"use client";

import { ClerkProvider, useUser } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { createContext, useContext, useEffect, useState } from "react";
import { getMyUsername } from "@/actions/user-actions";

type DbUser = { username: string | null; isAdmin: boolean; isEmployee: boolean } | null;

const UserContext = createContext<DbUser>(null);

export function useDbUser() {
  return useContext(UserContext);
}

function DbUserProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useUser();
  const [dbUser, setDbUser] = useState<DbUser>(null);

  useEffect(() => {
    if (isSignedIn) {
      getMyUsername().then(res => setDbUser(res)).catch(() => {});
    } else {
      setDbUser(null);
    }
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
