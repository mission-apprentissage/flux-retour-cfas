import { generateOrganismeComputed } from "@/common/actions/organismes/organismes.actions";
import { effectifsDb, effectifsDECADb, organismesDb, voeuxAffelnetDb } from "@/common/model/collections";

async function updateOrganismeComputedField() {
  const cursor = organismesDb().find({});
  for await (const organisme of cursor) {
    const op = { $set: { "_computed.organisme": generateOrganismeComputed(organisme) } };

    await Promise.all([
      effectifsDb().updateMany({ organisme_id: organisme._id }, op),
      effectifsDECADb().updateMany({ organisme_id: organisme._id }, op),
      voeuxAffelnetDb().updateMany({ organisme_formateur_id: organisme._id }, op),
    ]);
  }
}

export async function updateComputedFields() {
  await updateOrganismeComputedField();
  // TODO: in future add extra computed field to update here
}
