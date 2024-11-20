import { Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";

interface FiltreFormationAnneeProps {
  value: number[];
  onChange: (value: number[]) => void;
}

const annees = [1, 2, 3, 4, 5];
function FiltreFormationAnnee(props: FiltreFormationAnneeProps) {
  return (
    <CheckboxGroup
      value={props.value}
      onChange={(value) =>
        props.onChange(value.map((v: string | number) => (typeof v === "number" ? v : parseInt(v, 10))))
      }
    >
      <Stack>
        {annees.map((annee, i) => (
          <Checkbox value={annee} key={i} fontSize="caption">
            {annee}
          </Checkbox>
        ))}
      </Stack>
    </CheckboxGroup>
  );
}

export default FiltreFormationAnnee;
