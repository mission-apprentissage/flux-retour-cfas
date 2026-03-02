import { getDatabase } from "@/common/mongodb";

const ETABLISSEMENTS = [
  { siret: "39108721000046", uai: "0912003H" },
  { siret: "88877726500107", uai: "0062268H" },
  { siret: "13000460900017", uai: "0490985E" },
  { siret: "83401260100011", uai: "0442415L" },
  { siret: "81980627400034", uai: "0772924K" },
  { siret: "31796290000013", uai: "0271124A" },
  { siret: "18720092800054", uai: "0720930V" },
  { siret: "88877726500016", uai: "0062268H" },
  { siret: "33764282100074", uai: "0332818J" },
  { siret: "83429535400015", uai: "0760167U" },
  { siret: "45212801000041", uai: "0922870V" },
  { siret: "41058110200010", uai: "0332813D" },
  { siret: "77572845400205", uai: "0932760V" },
  { siret: "78285946600024", uai: "0132469N" },
  { siret: "77811608700132", uai: "0141601P" },
  { siret: "40132583200087", uai: "0922794M" },
  { siret: "47980663000055", uai: "0760168V" },
  { siret: "48888299400053", uai: "0922900C" },
  { siret: "43397081100033", uai: "0062273N" },
  { siret: "78605529300017", uai: "0442416M" },
  { siret: "13001762700014", uai: "0861416X" },
  { siret: "13002602400054", uai: "0912408Y" },
  { siret: "13002175100024", uai: "0762403Z" },
  { siret: "78223719200029", uai: "0642033M" },
  { siret: "34238263700011", uai: "0492175Y" },
  { siret: "79905554600052", uai: "0942585Z" },
  { siret: "20005480700520", uai: "0131784U" },
  { siret: "78605529300066", uai: "0851412Y" },
  { siret: "78611672300010", uai: "0490076S" },
  { siret: "35119949200122", uai: "0783545E" },
  { siret: "77811392800098", uai: "0593334D" },
  { siret: "13002271800386", uai: "0601211R" },
  { siret: "88846866700017", uai: "0062260Z" },
  { siret: "77566202600092", uai: "0492219W" },
  { siret: "78285946600073", uai: "0840526R" },
  { siret: "50280919700028", uai: "0597141S" },
  { siret: "19761315100103", uai: "0762652V" },
  { siret: "44229373400012", uai: "0442688H" },
  { siret: "13002597600015", uai: "0952259P" },
  { siret: "87817990200019", uai: "0062380E" },
  { siret: "18240014300026", uai: "0241056T" },
  { siret: "13002792300155", uai: "0240061L" },
  { siret: "78285946600099", uai: "0831136J" },
  { siret: "18974211700097", uai: "9740983A" },
  { siret: "78515061600049", uai: "0780293V" },
  { siret: "77811608700108", uai: "0271177H" },
  { siret: "40110456700029", uai: "0611061X" },
  { siret: "77566214100073", uai: "0951625A" },
  { siret: "77811608700165", uai: "0761819P" },
  { siret: "77811608700116", uai: "0501249L" },
  { siret: "32922456200747", uai: "0333362A" },
  { siret: "35319145500016", uai: "0772892A" },
  { siret: "41904518200013", uai: "0942169X" },
  { siret: "18974011100035", uai: "9740986D" },
  { siret: "78285946600081", uai: "0060916N" },
  { siret: "78605529300058", uai: "0490993N" },
  { siret: "77811392800064", uai: "0593377A" },
  { siret: "50260294900021", uai: "0801302F" },
  { siret: "38909535700023", uai: "0782092A" },
  { siret: "77566214100149", uai: "0911333E" },
  { siret: "13002271800485", uai: "0595821G" },
  { siret: "34277034400055", uai: "9741669W" },
  { siret: "48957765000034", uai: "0911864G" },
  { siret: "34896746400036", uai: "0592758C" },
  { siret: "13002612300013", uai: "0772894C" },
  { siret: "87990046200018", uai: "0922869U" },
  { siret: "38343194700035", uai: "0442304R" },
  { siret: "51864644300029", uai: "0333438H" },
  { siret: "78605529300041", uai: "0720937C" },
  { siret: "77572257201034", uai: "0332984P" },
  { siret: "77566214100131", uai: "0772319C" },
  { siret: "85003894400011", uai: "0762917H" },
  { siret: "77811608700082", uai: "0761820R" },
  { siret: "77572257201133", uai: "0762969P" },
  { siret: "50424827900029", uai: "0942503K" },
  { siret: "33811430900010", uai: "0861253V" },
  { siret: "32922456200267", uai: "0061610T" },
  { siret: "13002566100013", uai: "0062205P" },
  { siret: "77566202600258", uai: "0595645R" },
  { siret: "79459084400013", uai: "0851436Z" },
  { siret: "50383576100035", uai: "0932505T" },
  { siret: "19762762300097", uai: "0762762P" },
  { siret: "38759935000064", uai: "0772447S" },
  { siret: "39814208300037", uai: "0922585K" },
  { siret: "20003019500123", uai: "0061909T" },
  { siret: "92993350500026", uai: "0942605W" },
  { siret: "77566214100107", uai: "0932230U" },
  { siret: "85069958800016", uai: "0772900J" },
  { siret: "78605529300025", uai: "0441885K" },
  { siret: "41168271900066", uai: "9741673A" },
  { siret: "77572257201174", uai: "0133944S" },
  { siret: "34229971600015", uai: "0851403N" },
  { siret: "77566202600480", uai: "0762897L" },
  { siret: "18974211700121", uai: "9740984B" },
  { siret: "94965495800030", uai: "0932898V" },
  { siret: "45303523000094", uai: "0922907K" },
  { siret: "31513169800153", uai: "0932217E" },
  { siret: "30107533900046", uai: "0860845B" },
  { siret: "13002792300320", uai: "0790924A" },
  { siret: "18640002400060", uai: "0640096G" },
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
