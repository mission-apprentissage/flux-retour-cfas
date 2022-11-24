import { atom } from "recoil";

export const organismeMineAtom = atom({
  key: "organisme/mine",
  default: null,
});

export const organismeAtom = atom({
  key: "organisme",
  default: null,
});

export const organismeNavigationAtom = atom({
  key: "organisme/navigation",
  default: null,
});
