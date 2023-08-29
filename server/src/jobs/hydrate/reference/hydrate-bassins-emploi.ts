import { readFileSync } from "fs";
import { join } from "path";

import { default as parentLogger } from "@/common/logger";
import { bassinsEmploiDb } from "@/common/model/collections";
import { __dirname } from "@/common/utils/esmUtils";
import { getStaticFilePath } from "@/common/utils/getStaticFilePath";

const logger = parentLogger.child({
  module: "job:hydrate:bassins-emploi",
});

/**
 * Peuple la collection bassinsEmploi avec le contenu du fichier bassins_emploi_communes.json.
 *
 * Le contenu a été obtenu depuis les données de https://www.insee.fr/fr/information/4652957 puis transformées avec la commande :
 * xlsx-cli ZE2020_au_01-01-2023.xlsx --sheet-index=1 2>/dev/null | tail -n+7 | head -n-1 | jq -Rn 'reduce inputs as $line ([]; . + [$line | split(",") | {code_commune: .[0], code_zone_emploi: .[2]} ])' > bassins_emploi_communes.json
 *
 * Explications :
 * - on utilise le module xlsx-cli pour afficher la 2e feuille de calcul
 * - on masque la sortie
 * - on supprimer les lignes d'entête
 * - on supprime la dernière ligne vide
 * - on agrège les données dans un tableau qui contient un objet JSON pour chaque ligne en entrée
 */
export const hydrateBassinsEmploi = async () => {
  logger.info("hydrating");
  const associationsZECommunes = JSON.parse(
    readFileSync(getStaticFilePath("organismes/bassins_emploi_communes.json")).toString()
  );
  await bassinsEmploiDb().deleteMany({});
  await bassinsEmploiDb().insertMany(associationsZECommunes);
  logger.info({ rows: associationsZECommunes.length }, "hydrated bassins emploi");
};
