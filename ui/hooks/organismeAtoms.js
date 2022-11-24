import { atom } from "recoil";

export const organismeAtom = atom({
  key: "organisme",
  default: null,
});

export const organismePathsAtom = atom({
  key: "organisme/paths",
  default: null,
});

export const organismeTitlesAtom = atom({
  key: "organisme/titles",
  default: null,
});

export const organismeTitleAtom = atom({
  key: "organisme/title",
  default: null,
});
