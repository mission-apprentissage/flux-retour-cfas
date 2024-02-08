import { atom } from "recoil";

export const transmissionDetailsCountAtom = atom<any>({
  key: "transmissions-details",
  default: 0,
});
