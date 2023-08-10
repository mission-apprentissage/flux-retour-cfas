import { atom } from "recoil";

import { Organisme } from "@/common/internal/Organisme";

export const organismeAtom = atom<Organisme | null | undefined>({
  key: "organisme",
  default: null,
});
