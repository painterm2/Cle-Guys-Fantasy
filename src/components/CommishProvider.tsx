"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface CommishCtx {
  commish: boolean;
  toggle: () => void;
}

const Ctx = createContext<CommishCtx>({ commish: false, toggle: () => {} });

export function CommishProvider({ children }: { children: ReactNode }) {
  const [commish, setCommish] = useState(false);

  // Persist the toggle across navigations/reloads.
  useEffect(() => {
    setCommish(localStorage.getItem("cg-commish") === "1");
  }, []);

  const toggle = () =>
    setCommish((v) => {
      const next = !v;
      localStorage.setItem("cg-commish", next ? "1" : "0");
      return next;
    });

  return <Ctx.Provider value={{ commish, toggle }}>{children}</Ctx.Provider>;
}

export const useCommish = () => useContext(Ctx);
