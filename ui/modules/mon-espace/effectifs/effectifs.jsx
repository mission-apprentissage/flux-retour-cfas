import React from "react";
import { Heading } from "@chakra-ui/react";
import { useEspace } from "../../../hooks/useEspace";
import EffectifsTable from "./engine/EffectifsTable.jsx";

const EffectifsOrganisme = () => {
  const { isMonOrganismePages, isOrganismePages } = useEspace();

  return (
    <>
      <Heading textStyle="h2" color="grey.800" mt={5}>
        {isMonOrganismePages && `Mes effectifs`}
        {isOrganismePages && `Ses effectifs`}
      </Heading>

      <EffectifsTable />
    </>
  );
};

export default EffectifsOrganisme;
