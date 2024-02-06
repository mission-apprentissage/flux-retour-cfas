import {
  checkCoupleFiable_rewrite,
  checkCoupleNonFiabilisable_rewrite,
  checkMatchReferentielSiretUaiDifferent_rewrite,
  checkMatchReferentielUaiUniqueSiretDifferent_rewrite,
  checkSiretMultiplesRelationsAndLieux_rewrite,
  checkUaiAucunLieuReferentiel_rewrite,
  checkUaiLieuReferentiel_rewrite,
  checkUaiMultiplesRelationsAndLieux_rewrite,
} from "./build.rules.rewrite";

export interface ICouple {
  uai: string | undefined;
  siret: string | undefined;
}

export interface ICoupleDefined {
  uai: string;
  siret: string;
}

/**
 * Fonction fiabilisation UAI SIRET
 */
export const fiabilisationUaiSiret = async (couple: ICouple) => {
  // Règle n°1 on vérifie si on a un couple fiable
  let result: any = await checkCoupleFiable_rewrite(couple); // Add etat_etablissement_ === 4
  if (result) return result;

  {
    // TODO check uaiUniqueAmongAllCouplesTdb outside

    // Règle n°3 on vérifie si on a un match sur le SIRET dans le référentiel mais avec un UAI différent
    result = await checkMatchReferentielSiretUaiDifferent_rewrite(couple);
    if (result) {
      // TODO check siretUniqueAmongAllCouplesTdb outside
      return result;
    }

    // Règle n°2 on vérifie si on a un match sur l'UAI unique dans le référentiel mais avec un SIRET différent
    result = await checkMatchReferentielUaiUniqueSiretDifferent_rewrite(couple);
    if (result) {
      // TODO check uaiUniqueAmongAllCouplesTdb outside
      return result;
    }
  }

  // Règle n°4 on vérifie pour les UAI multiples via les relations et les lieux
  result = await checkUaiMultiplesRelationsAndLieux_rewrite(couple);
  if (result) {
    // TODO check !siretUniqueAmongAllCouplesTdb outside == not unique siret
    // TODO couplesUaiMultiplesInTdbForSiretMatch outside
    return result;
  }

  // Règle n°5 on vérifie pour les SIRET multiples via les relations et les lieux
  result = await checkSiretMultiplesRelationsAndLieux_rewrite(couple);
  if (result) {
    // TODO check !uaiUniqueAmongAllCouplesTdb outside == not unique uai
    // TODO couplesSIRETMultiplesInTdbForUaiMatch outside
    return result;
  }

  // Règle n°7 on vérifie les UAI non trouvées dans les lieux du référentiel
  result = await checkUaiAucunLieuReferentiel_rewrite(couple);
  if (result) return result;

  // Règle n°8 on vérifie les UAI trouvées dans les lieux du référentiel
  result = await checkUaiLieuReferentiel_rewrite(couple);
  if (result) return result;

  // Règle n°6 on vérifie les organismes inexistants ==> regle 8
  // Cette règle n'existe plus parce qu'on ne regarde plus dans la base ACCE

  // Règle n°9 on vérifie les couples non fiabilisables, si l'UAI est validée cotée référentiel
  result = await checkCoupleNonFiabilisable_rewrite(couple); // TODO Initule aujourd'hui // pas de table siret/uai
  if (result) return result;
};
