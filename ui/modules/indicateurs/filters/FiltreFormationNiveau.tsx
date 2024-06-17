import { Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";
import { ORGANISATION_TYPE, ORGANISATIONS_NATIONALES_MAP } from "shared";

import useAuth from "@/hooks/useAuth";

interface NiveauFormation {
  key: string;
  label: string;
  enabled: boolean;
}

const EDUC_NATIONALE_NIVEAUX: NiveauFormation[] = [
  {
    key: "3",
    label: "Niveau 3 (CAP, BEP…)",
    enabled: true,
  },
  {
    key: "4",
    label: "Niveau 4 (Baccalauréat)",
    enabled: true,
  },
  {
    key: "5",
    label: "Niveau 5 (BTS, DUT, DEUG)",
    enabled: false,
  },
  {
    key: "6",
    label: "Niveau 6 (Licence, Bachelor)",
    enabled: false,
  },
  {
    key: "7",
    label: "Niveau 7 (Master…)",
    enabled: false,
  },
  {
    key: "8",
    label: "Niveau 8 (Doctorat)",
    enabled: false,
  },
];

const ENSEIGNEMENT_SUPERIEUR_NIVEAUX: NiveauFormation[] = [
  {
    key: "3",
    label: "Niveau 3 (CAP, BEP…)",
    enabled: false,
  },
  {
    key: "4",
    label: "Niveau 4 (Baccalauréat)",
    enabled: false,
  },
  {
    key: "5",
    label: "Niveau 5 (BTS, DUT, DEUG)",
    enabled: true,
  },
  {
    key: "6",
    label: "Niveau 6 (Licence, Bachelor)",
    enabled: true,
  },
  {
    key: "7",
    label: "Niveau 7 (Master…)",
    enabled: true,
  },
  {
    key: "8",
    label: "Niveau 8 (Doctorat)",
    enabled: true,
  },
];
const niveauxDefault: NiveauFormation[] = [
  {
    key: "3",
    label: "Niveau 3 (CAP, BEP…)",
    enabled: true,
  },
  {
    key: "4",
    label: "Niveau 4 (Baccalauréat)",
    enabled: true,
  },
  {
    key: "5",
    label: "Niveau 5 (BTS, DUT, DEUG)",
    enabled: true,
  },
  {
    key: "6",
    label: "Niveau 6 (Licence, Bachelor)",
    enabled: true,
  },
  {
    key: "7",
    label: "Niveau 7 (Master…)",
    enabled: true,
  },
  {
    key: "8",
    label: "Niveau 8 (Doctorat)",
    enabled: true,
  },
];

const getNiveauxByOrganisationType = (organisation) => {
  if (organisation.type !== ORGANISATION_TYPE.OPERATEUR_PUBLIC_NATIONAL) {
    return niveauxDefault;
  }

  switch (organisation.nom) {
    case ORGANISATIONS_NATIONALES_MAP.EDUC_NATIONALE:
      return EDUC_NATIONALE_NIVEAUX;
    case ORGANISATIONS_NATIONALES_MAP.ENSEIGNEMENT_SUP:
      return ENSEIGNEMENT_SUPERIEUR_NIVEAUX;
    default:
      return niveauxDefault;
  }
};

export const niveauFormationByNiveau = niveauxDefault.reduce((acc, n) => {
  acc[n.key] = n.label;
  return acc;
}, {});

interface FiltreFormationNiveauProps {
  value: string[];
  onChange: (value: string[]) => void;
}
function FiltreFormationNiveau(props: FiltreFormationNiveauProps) {
  const { auth } = useAuth();
  const organisation = auth.organisation;

  return (
    <CheckboxGroup value={props.value} onChange={props.onChange}>
      <Stack>
        {getNiveauxByOrganisationType(organisation).map((niveau, i) => (
          <Checkbox value={niveau.key} key={i} fontSize="caption" disabled={!niveau.enabled}>
            {niveau.label}
          </Checkbox>
        ))}
      </Stack>
    </CheckboxGroup>
  );
}

export default FiltreFormationNiveau;
