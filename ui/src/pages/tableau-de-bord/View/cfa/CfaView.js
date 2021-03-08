import { Center, Divider, HStack, Skeleton, Stack, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";

import { _post } from "../../../../common/httpClient";
import { effectifsPropType, filtersPropType } from "../../propTypes";
import EffectifsSection from "../generic/EffectifsSection";
import InfoCfaSection from "./InfoCfaSection";
import RepartionCfaNiveauAnneesSection from "./RepartionCfaNiveauAnneesSection";

const CfaViewError = () => (
  <Center h="100px" p={4} background="orangesoft.200">
    <HStack fontSize="gamma">
      <i className="ri-error-warning-fill"></i>
      <Text>Erreur - merci de contacter un administrateur</Text>
    </HStack>
  </Center>
);

const CfaView = ({ effectifs, filters }) => {
  const [dataCfa, setDataCfa] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInfosCfa = async () => {
      setLoading(true);
      try {
        const response = await _post("/api/dashboard/cfa/", { siret: filters.cfa.siret_etablissement });
        setDataCfa(response);
        setError(null);
      } catch (err) {
        setError(err);
        setDataCfa(null);
      } finally {
        setLoading(false);
      }
    };

    if (
      filters.periode.startDate &&
      filters.periode.endDate &&
      (filters.cfa || filters.territoire || filters.formation)
    ) {
      fetchInfosCfa();
    }
  }, [filters]);

  return (
    <Stack spacing="4w">
      <InfoCfaSection infosCfa={dataCfa} loading={loading} error={error} />
      <Divider orientation="horizontal" />
      {effectifs && <EffectifsSection effectifs={effectifs} />}
      {loading && <Skeleton flex="2" h="100px" p={4} />}
      {error && <CfaViewError />}
      <RepartionCfaNiveauAnneesSection />
    </Stack>
  );
};

CfaView.propTypes = {
  effectifs: effectifsPropType,
  filters: filtersPropType.isRequired,
};

export default CfaView;
