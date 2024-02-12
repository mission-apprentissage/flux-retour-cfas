import { atom } from "recoil";

export const transmissionDetailsCountAtom = atom<any>({
  key: "transmissions",
  default: 0,
});
