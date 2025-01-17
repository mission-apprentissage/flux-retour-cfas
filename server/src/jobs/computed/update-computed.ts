import { generateOrganismeComputed } from "@/common/actions/organismes/organismes.actions";
import { effectifsDb, effectifsDECADb, organismesDb, voeuxAffelnetDb } from "@/common/model/collections";

async function updateComputedFieldForOrganisme(organisme) {
  if (!organisme || !organisme._id) return;

  const op = { $set: { "_computed.organisme": generateOrganismeComputed(organisme) } };

  await Promise.all([
    effectifsDb().updateMany({ organisme_id: organisme._id }, op),
    effectifsDECADb().updateMany({ organisme_id: organisme._id }, op),
    voeuxAffelnetDb().updateMany({ organisme_formateur_id: organisme._id }, op),
  ]);
}

async function updateOrganismeComputedField() {
  const cursor = organismesDb().find({});
  for await (const organisme of cursor) {
    await updateComputedFieldForOrganisme(organisme);
  }
}

export async function updateComputedFields() {
  await updateOrganismeComputedField();
}

export { updateOrganismeComputedField, updateComputedFieldForOrganisme };
