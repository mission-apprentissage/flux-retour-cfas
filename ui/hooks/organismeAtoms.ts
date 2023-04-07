import { Organisme } from "@/common/internal/Organisme";
import { atom } from "recoil";

export const organismeAtom = atom<Organisme | null>({
  key: "organisme",
  default: null,
});
