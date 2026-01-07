import { atom } from "recoil";

export const dossierAtom = atom({
  key: "dossierAtom",
  default: null,
});

export const effectifIdAtom = atom({
  key: "effectifIdAtom",
  default: null,
});

export const effectifsStateAtom = atom({
  key: "effectifsStateAtom",
  // eslint-disable-next-line no-undef
  default: new Map(),
});
