import { demandesIdentifiantsDb } from "../model/collections";

/**
 * Création d'une demande d'identifiants
 * TODO : Mutualiser avec la demande d'identifiants
 * @param {*} props
 */
const create = async (props) => {
  const { profil, region, email } = props;

  await demandesIdentifiantsDb().insertOne({
    profil,
    region,
    email,
    created_at: new Date(),
  });
};

export default () => ({
  create,
});
