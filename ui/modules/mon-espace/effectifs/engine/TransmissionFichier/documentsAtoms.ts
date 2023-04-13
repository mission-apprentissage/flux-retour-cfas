import { selector } from "recoil";
import { uploadsAtom } from "../atoms";

export const documentsGetter = selector({
  key: "documentsGetter",
  get: ({ get }) => {
    const uploads = get(uploadsAtom);
    return uploads?.documents;
  },
});
