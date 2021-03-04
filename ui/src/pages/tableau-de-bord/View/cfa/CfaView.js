import { Center, Divider, HStack, Skeleton, Stack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { usePostFetch } from "../../../../common/hooks/useFetch";
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

const CfaView = ({ cfaSiret, effectifs, loading, error }) => {
  const [dataCfa, loadingCfa, errorCfa] = usePostFetch("/api/dashboard/cfa/", { siret: cfaSiret });

  return (
    <Stack spacing="4w">
      <InfoCfaSection infosCfa={dataCfa} loading={loadingCfa} error={errorCfa} />
      <Divider orientation="horizontal" />
      {effectifs && <EffectifsSection effectifs={effectifs} />}
      {loading && <Skeleton flex="2" h="100px" p={4} />}
      {error && <CfaViewError />}
      <RepartionCfaNiveauAnneesSection />
    </Stack>
  );
};

CfaView.propTypes = {
  cfaSiret: PropTypes.string.isRequired,
  effectifs: effectifsPropType,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.object,
};

export default CfaView;
