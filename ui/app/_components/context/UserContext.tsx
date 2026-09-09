"use client";

import { createContext, type PropsWithChildren } from "react";

import { ForceAcceptCgu } from "@/app/_components/cgu/ForceAcceptCgu";
import { AuthContext } from "@/common/internal/AuthContext";

export type IUserContext = {
  user?: AuthContext | null;
};

export const UserContext = createContext<any>(null);

export function UserContextProvider(props: PropsWithChildren<IUserContext>) {
  return (
    <UserContext.Provider value={{ user: props.user }}>
      <ForceAcceptCgu user={props.user} />
      {props.children}
    </UserContext.Provider>
  );
}
