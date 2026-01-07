import { useEffect } from "react";
import { useRecoilState } from "recoil";

import { organismeAtom } from "@/hooks/organismeAtoms";
import { useOrganisationOrganisme, useOrganisme } from "@/hooks/organismes";

// version qui renvoie l'organisme une fois enregistré dans recoil
// utilisé pour les pages effectifs
export function useEffectifsOrganismeOrganisation() {
  const { organisme } = useOrganisationOrganisme();
  const [organismeState, setOrganisme] = useRecoilState(organismeAtom);
  useEffect(() => {
    setOrganisme(organisme);
  }, [organisme]);

  return { organisme: organismeState };
}

export function useEffectifsOrganisme(organismeId: string) {
  const { organisme } = useOrganisme(organismeId);
  const [organismeState, setOrganisme] = useRecoilState(organismeAtom);
  useEffect(() => {
    setOrganisme(organisme);
  }, [organisme]);

  return { organisme: organismeState };
}
