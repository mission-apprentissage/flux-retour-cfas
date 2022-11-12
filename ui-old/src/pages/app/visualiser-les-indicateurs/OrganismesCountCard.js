import PropTypes from "prop-types";
import React from "react";

import { EffectifCard } from "../../../common/components";

const OrganismesCountCard = ({ count }) => {
  return (
    <EffectifCard
      count={count}
      label="organismes de formation"
      tooltipLabel={
        <div>
          Nombre d’organismes de formation qui transmettent leurs données au Tableau de bord de l’apprentissage. Un
          organisme est identifié par une UAI utilisant 1 ou plusieurs numéro(s) SIRET.
        </div>
      }
      iconClassName="ri-home-6-fill"
      accentColor="#417DC4"
    />
  );
};

OrganismesCountCard.propTypes = {
  count: PropTypes.number.isRequired,
};

export default OrganismesCountCard;
