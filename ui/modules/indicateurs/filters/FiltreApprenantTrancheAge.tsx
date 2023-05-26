import { Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";

interface TrancheAge {
  key: string;
  label: string;
}
const tranchesAge: TrancheAge[] = [
  {
    key: "-18",
    label: "< 18 ans",
  },
  {
    key: "18-20",
    label: "18 à 20 ans",
  },
  {
    key: "21-25",
    label: "21 à 25 ans",
  },
  {
    key: "26+",
    label: "26 ans et +",
  },
];

interface FiltreApprenantTrancheAgeProps {
  value: string[];
  onChange: (value: string[]) => void;
}
function FiltreApprenantTrancheAge(props: FiltreApprenantTrancheAgeProps) {
  return (
    <CheckboxGroup value={props.value} onChange={props.onChange}>
      <Stack>
        {tranchesAge.map((trancheAge, i) => (
          <Checkbox value={trancheAge.key} key={i} fontSize="caption">
            {trancheAge.label}
          </Checkbox>
        ))}
      </Stack>
    </CheckboxGroup>
  );
}

export default FiltreApprenantTrancheAge;
