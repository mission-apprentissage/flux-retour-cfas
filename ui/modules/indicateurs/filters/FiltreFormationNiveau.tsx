import { Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";

interface NiveauFormation {
  key: string;
  label: string;
}
const niveaux: NiveauFormation[] = [
  {
    key: "3",
    label: "Niveau 3 (CAP…)",
  },
  {
    key: "4",
    label: "Niveau 4 (Bac…)",
  },
  {
    key: "5",
    label: "Niveau 5 (BTS, DUT…)",
  },
  {
    key: "6",
    label: "Niveau 6 (Licence…)",
  },
  {
    key: "7",
    label: "Niveau 7 (Master…)",
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
