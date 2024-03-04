import { atom } from "recoil";

export const transmissionSuccessDetailsCountAtom = atom<any>({
  key: "transmissions-details-success",
  default: 0,
});

export const transmissionErrorsDetailsCountAtom = atom<any>({
  key: "transmissions-details-errors",
  default: 0,
});
