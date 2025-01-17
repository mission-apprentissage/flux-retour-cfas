import { Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";
import { IReseau } from "shared";

interface FiltreOrganismeReseauProps {
  reseaux: IReseau[];
  value: string[];
  onChange: (value: string[]) => void;
}
function FiltreOrganismeReseau(props: FiltreOrganismeReseauProps) {
  return (
    <CheckboxGroup value={props.value} onChange={props.onChange}>
      <Stack>
        {props.reseaux.map((reseau, i) => (
          <Checkbox value={reseau.key} key={i} fontSize="caption">
            {reseau.nom}
          </Checkbox>
        ))}
      </Stack>
    </CheckboxGroup>
  );
}

export default FiltreOrganismeReseau;
