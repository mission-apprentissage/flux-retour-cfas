import { getDatabase } from "@/common/mongodb";

const ETABLISSEMENTS = [
  { siret: "13002175100024", uai: "0762403Z" },
  { siret: "13002271800188", uai: "0596691C" },
  { siret: "13002271800279", uai: "0021502X" },
  { siret: "13002271800485", uai: "0595821G" },
  { siret: "13002374000199", uai: "0624473A" },
  { siret: "13002374000454", uai: "0801298B" },
  { siret: "13002612300013", uai: "0772894C" },
  { siret: "19761315100103", uai: "0762652V" },
  { siret: "19870058500013", uai: "0870058R" },
  { siret: "19870730900011", uai: "0870730W" },
  { siret: "19870999000016", uai: "0871030X" },
  { siret: "30107533900046", uai: "0860845B" },
  { siret: "32922456200267", uai: "0061610T" },
  { siret: "38980235600011", uai: "0470974D" },
  { siret: "77811608700082", uai: "0761820R" },
  { siret: "77811608700116", uai: "0501249L" },
  { siret: "78285946600081", uai: "0060916N" },
  { siret: "78285946600099", uai: "0831136J" },
  { siret: "13000460900017", uai: "0490985E" },
  { siret: "13002597600015", uai: "0952259P" },
  { siret: "18230801500136", uai: "0230412Y" },
  { siret: "18240014300026", uai: "0241056T" },
  { siret: "18383001700236", uai: "0381861S" },
  { siret: "18640002400060", uai: "0640096G" },
  { siret: "18640005700078", uai: "0641848L" },
  { siret: "18720092800054", uai: "0720930V" },
  { siret: "18790001400098", uai: "0791088D" },
  { siret: "18860003500037", uai: "0860995P" },
  { siret: "18974211700097", uai: "9740983A" },
  { siret: "18974211700121", uai: "9740984B" },
  { siret: "30107533900061", uai: "0161212F" },
  { siret: "30587307700039", uai: "0400780F" },
  { siret: "31513169800153", uai: "0932217E" },
  { siret: "31796290000013", uai: "0271124A" },
  { siret: "32922456200747", uai: "0333362A" },
  { siret: "33811430900010", uai: "0861253V" },
  { siret: "34229971600015", uai: "0851403N" },
  { siret: "34238263700011", uai: "0492175Y" },
  { siret: "34277034400055", uai: "9741669W" },
  { siret: "35119949200122", uai: "0783545E" },
  { siret: "40132583200087", uai: "0922794M" },
  { siret: "41058110200010", uai: "0332813D" },
  { siret: "41168271900066", uai: "9741673A" },
  { siret: "44403832700029", uai: "0756112L" },
  { siret: "50260294900021", uai: "0801302F" },
  { siret: "50280919700028", uai: "0597141S" },
  { siret: "51864644300029", uai: "0333438H" },
  { siret: "77566214100073", uai: "0951625A" },
  { siret: "77572845400205", uai: "0932760V" },
  { siret: "78128367600018", uai: "0171438W" },
  { siret: "78223719200029", uai: "0642033M" },
  { siret: "78605529300017", uai: "0442416M" },
  { siret: "78605529300025", uai: "0441885K" },
  { siret: "78605529300041", uai: "0720937C" },
  { siret: "78605529300058", uai: "0490993N" },
  { siret: "78605529300066", uai: "0851412Y" },
  { siret: "79459084400013", uai: "0851436Z" },
  { siret: "83429535400015", uai: "0760167U" },
  { siret: "83501285700016", uai: "0632079T" },
  { siret: "85003894400011", uai: "0762917H" },
  { siret: "87817990200019", uai: "0062380E" },
  { siret: "88846866700017", uai: "0062260Z" },
] as const;

export const up = async () => {
  const db = getDatabase();
  const now = new Date();

  // 1. Flagger les organismes en bulk
  const orConditions = ETABLISSEMENTS.map(({ siret, uai }) => ({ siret, uai }));
  const flagResult = await db
    .collection("organismes")
    .updateMany({ $or: orConditions }, { $set: { is_allowed_deca: true } });
  console.log(`Organismes flaggés: ${flagResult.matchedCount}/${ETABLISSEMENTS.length}`);

  // 2. Récupérer les IDs des organismes flaggés
  const organismes = await db.collection("organismes").find({ is_allowed_deca: true }).project({ _id: 1 }).toArray();
  const organismeIds = organismes.map((o) => o._id.toString());

  if (organismeIds.length !== ETABLISSEMENTS.length) {
    console.warn(`Attention: ${organismeIds.length} organismes trouvés sur ${ETABLISSEMENTS.length} attendus`);
  }

  // 3. Activer ml_beta_activated_at sur les organisations
  const orgResult = await db.collection("organisations").updateMany(
    {
      type: "ORGANISME_FORMATION",
      organisme_id: { $in: organismeIds },
      ml_beta_activated_at: null,
    },
    { $set: { ml_beta_activated_at: now } }
  );
  console.log(`Organisations activées: ${orgResult.modifiedCount}`);
};

export const down = async () => {
  const db = getDatabase();

  // Retrouver les organismes flaggés pour cibler les organisations à rollback
  const organismes = await db.collection("organismes").find({ is_allowed_deca: true }).project({ _id: 1 }).toArray();
  const organismeIds = organismes.map((o) => o._id.toString());

  if (organismeIds.length > 0) {
    const orgResult = await db.collection("organisations").updateMany(
      {
        type: "ORGANISME_FORMATION",
        organisme_id: { $in: organismeIds },
      },
      { $unset: { ml_beta_activated_at: "" } }
    );
    console.log(`Organisations désactivées: ${orgResult.modifiedCount}`);
  }

  await db.collection("organismes").updateMany({ is_allowed_deca: true }, { $unset: { is_allowed_deca: "" } });
};
