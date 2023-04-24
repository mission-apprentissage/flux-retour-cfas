import { atom } from "recoil";

import { Organisme } from "@/common/internal/Organisme";

export const organismeAtom = atom<Organisme | null>({
  key: "organisme",
  default: null,
});
