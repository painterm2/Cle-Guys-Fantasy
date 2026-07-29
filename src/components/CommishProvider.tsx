"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// NOTE: this is a light gate to keep normal users out of admin controls, not
// real security — the password lives in the client bundle. For true access
// control, move commish actions behind a server-side login.
export const COMMISH_PASSWORD = "IAMCOMMISH";

interface CommishCtx {
  commish: boolean;
  /** Attempt to enable commish mode with a password. Returns true on success. */
  enable: (password: string) => boolean;
  disable: () => void;
}

const Ctx = createContext<CommishCtx>({ commish: false, enable: () => false, disable: () => {} });

export function CommishProvider({ children }: { children: ReactNode }) {
  const [commish, setCommish] = useState(false);

  useEffect(() => {
    setCommish(localStorage.getItem("cg-commish") === "1");
  }, []);

  const enable = (password: string) => {
    if (password.trim() !== COMMISH_PASSWORD) return false;
    localStorage.setItem("cg-commish", "1");
    setCommish(true);
    return true;
  };

  const disable = () => {
    localStorage.setItem("cg-commish", "0");
    setCommish(false);
  };

  return <Ctx.Provider value={{ commish, enable, disable }}>{children}</Ctx.Provider>;
}

export const useCommish = () => useContext(Ctx);
