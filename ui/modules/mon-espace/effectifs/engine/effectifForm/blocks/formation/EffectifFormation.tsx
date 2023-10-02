import { Box, Grid } from "@chakra-ui/react";
import React, { memo } from "react";

import { InputController } from "@/modules/mon-espace/effectifs/engine/formEngine/components/Input/InputController";

// eslint-disable-next-line react/display-name, no-unused-vars
export const EffectifFormation = memo(() => {
  return (
    <Box my={9}>
      <Grid gridTemplateColumns="repeat(2, 2fr)" gridGap="1w">
        <InputController name="formation.rncp" w="80" mb={0} />
        <InputController name="formation.cfd" w="80" mb={0} />
        <InputController name="formation.duree_theorique" w="80" mb={0} />
        <InputController name="formation.duree_formation_relle" w="80" mb={0} />
        <InputController name="formation.annee" w="80" mb={0} />
        <InputController name="formation.date_inscription" w="80" mb={0} />
        <InputController name="formation.date_entree" w="80" mb={0} />
        <InputController name="formation.date_fin" w="80" mb={0} />
        <InputController name="formation.date_obtention_diplome" w="80" mb={0} />
      </Grid>
    </Box>
  );
});
