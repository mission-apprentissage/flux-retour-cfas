import { Center, Divider, HStack, Skeleton, Stack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";

import { _post } from "../../../../common/httpClient";
import { effectifsPropType } from "../../propTypes";
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

const CfaView = ({ effectifs, cfaSiret }) => {
  const [dataCfa, setDataCfa] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInfosCfa = async () => {
      setLoading(true);
      try {
        const response = await _post("/api/dashboard/cfa/", { siret: cfaSiret });
        setDataCfa(response);
        setError(null);
      } catch (err) {
        setError(err);
        setDataCfa(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInfosCfa();
  }, [cfaSiret]);

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
  cfaSiret: PropTypes.string.isRequired,
};

export default CfaView;
