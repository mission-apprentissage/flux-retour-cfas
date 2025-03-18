"use client";

import { createContext, type PropsWithChildren } from "react";

import { AuthContext } from "@/common/internal/AuthContext";

export type IUserContext = {
  user?: AuthContext | Record<string, null>;
};

export const UserContext = createContext<any>(null);

export function UserContextProvider(props: PropsWithChildren<IUserContext>) {
  return <UserContext.Provider value={{ user: props.user }}>{props.children}</UserContext.Provider>;
}
