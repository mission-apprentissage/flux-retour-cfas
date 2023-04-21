import { Box, Grid } from "@chakra-ui/react";
import React, { memo } from "react";

import { InputController } from "@/modules/mon-espace/effectifs/engine/formEngine/components/Input/InputController";

// eslint-disable-next-line react/display-name, no-unused-vars
export const EffectifFormation = memo(() => {
  return (
    <Box my={9}>
      <Grid gridTemplateColumns="repeat(2, 2fr)" gridGap="1w">
        <InputController name="formation.date_debut_formation" w="80" mb={0} />
        <InputController name="formation.date_fin_formation" w="80" mb={0} />
        <InputController name="formation.date_obtention_diplome" w="80" mb={0} />
        <InputController name="formation.duree_formation_relle" w="80" mb={0} />
      </Grid>
    </Box>
  );
});
