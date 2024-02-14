import { atom } from "recoil";

export const enum ParametresNavigationStep {
  TRANSMISSION_MODE,
  ERP_SELECTION,
  TRANSMISSION_CONFIGURATION,
}
export const parametresNavigationAtom = atom<ParametresNavigationStep>({
  key: "parametres-navigation",
  default: ParametresNavigationStep.TRANSMISSION_MODE,
});
