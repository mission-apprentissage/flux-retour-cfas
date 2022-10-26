import { Stack } from "@chakra-ui/react";
import PropTypes from "prop-types";
import { useState } from "react";

import RetourHomePageLink from "../../../../../common/components/RetourHomePageLink/RetourHomePageLink.js";
import DetailOFTrouve from "./DetailOFTrouve.js";
import AlertOFNotIdentified from "./organisme-alert/AlertOFNotIdentified.js";
import InfoPlusieursOFTrouves from "./organisme-info/InfoPlusieursOFTrouves.js";
import InfoUniqueOFTrouve from "./organisme-info/InfoUniqueOFTrouve";

const ListOFTrouves = ({ searchUai, organismes }) => {
  const [showOFNotIdentified, setShowOFNotIdentified] = useState(false);

  return (
    <>
      {showOFNotIdentified === false && (
        <Stack spacing="4w">
          {organismes.length === 1 && <InfoUniqueOFTrouve uai={searchUai} />}
          {organismes.length > 1 && <InfoPlusieursOFTrouves uai={searchUai} />}
          <RetourHomePageLink />

          {organismes.map((item, index) => (
            <DetailOFTrouve
              key={index}
              organisme={item}
              isDefaultOpened={organismes.length === 1 ? true : false}
              setShowOFNotIdentified={setShowOFNotIdentified}
            />
          ))}
        </Stack>
      )}

      {showOFNotIdentified === true && (
        <>
          <AlertOFNotIdentified uai={searchUai} />
          <RetourHomePageLink />
        </>
      )}
    </>
  );
};

ListOFTrouves.propTypes = {
  searchUai: PropTypes.string.isRequired,
  organismes: PropTypes.arrayOf(
    PropTypes.shape({
      uai: PropTypes.string.isRequired,
      siren: PropTypes.string.isRequired,
      siret: PropTypes.string.isRequired,
      nature: PropTypes.string.isRequired,
      nom_etablissement: PropTypes.string.isRequired,
      reseaux: PropTypes.arrayOf(PropTypes.string).isRequired,
      adresse: PropTypes.string.isRequired,
      region: PropTypes.string.isRequired,
      academie: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default ListOFTrouves;
