import { Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";

interface NiveauFormation {
  key: string;
  label: string;
}
const niveaux: NiveauFormation[] = [
  {
    key: "3",
    label: "Niveau 3 (CAP, BEP…)",
  },
  {
    key: "4",
    label: "Niveau 4 (Baccalauréat)",
  },
  {
    key: "5",
    label: "Niveau 5 (BTS, DUT, DEUG)",
  },
  {
    key: "6",
    label: "Niveau 6 (Licence, Bachelor)",
  },
  {
    key: "7",
    label: "Niveau 7 (Master…)",
  },
  {
    key: "8",
    label: "Niveau 8 (Doctorat)",
  },
];

interface FiltreFormationNiveauProps {
  value: string[];
  onChange: (value: string[]) => void;
}
function FiltreFormationNiveau(props: FiltreFormationNiveauProps) {
  return (
    <CheckboxGroup value={props.value} onChange={props.onChange}>
      <Stack>
        {niveaux.map((niveau, i) => (
          <Checkbox value={niveau.key} key={i} fontSize="caption">
            {niveau.label}
          </Checkbox>
        ))}
      </Stack>
    </CheckboxGroup>
  );
}

export default FiltreFormationNiveau;
