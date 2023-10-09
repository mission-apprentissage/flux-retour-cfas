import { Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";
import { TETE_DE_RESEAUX_SORTED } from "shared";

interface FiltreOrganismeReseauProps {
  value: string[];
  onChange: (value: string[]) => void;
}
function FiltreOrganismeReseau(props: FiltreOrganismeReseauProps) {
  return (
    <CheckboxGroup value={props.value} onChange={props.onChange}>
      <Stack>
        {TETE_DE_RESEAUX_SORTED.map((reseau, i) => (
          <Checkbox value={reseau.key} key={i} fontSize="caption">
            {reseau.nom}
          </Checkbox>
        ))}
      </Stack>
    </CheckboxGroup>
  );
}

export default FiltreOrganismeReseau;
