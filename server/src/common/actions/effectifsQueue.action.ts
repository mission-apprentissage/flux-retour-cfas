import { writeFileSync } from "fs";

import { write, utils } from "xlsx";

import { effectifsQueueDb } from "../model/collections";

async function fetchOrganismesData() {
  try {
    const pipeline = [
      {
        $lookup: {
          from: "effectifs",
          localField: "effectif_id",
          foreignField: "_id",
          as: "effectifDetails",
        },
      },
      {
        $unwind: {
          path: "$effectifDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "organismes",
          localField: "effectifDetails.organisme_id",
          foreignField: "_id",
          as: "organismeFormateurDetails",
        },
      },
      {
        $unwind: {
          path: "$organismeFormateurDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "organismes",
          localField: "effectifDetails.organisme_responsable_id",
          foreignField: "_id",
          as: "organismeResponsableDetails",
        },
      },
      {
        $unwind: {
          path: "$organismeResponsableDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          source_organisme_object_id: {
            $toObjectId: "$source_organisme_id",
          },
        },
      },
      {
        $lookup: {
          from: "organismes",
          localField: "source_organisme_object_id",
          foreignField: "_id",
          as: "sourceOrganismeDetails",
        },
      },
      {
        $unwind: {
          path: "$sourceOrganismeDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          formateurNature: {
            $ifNull: ["$organismeFormateurDetails.nature", "inconnue"],
          },
          responsableNature: {
            $ifNull: ["$organismeResponsableDetails.nature", "inconnue"],
          },
          transmetteurNature: {
            $ifNull: ["$sourceOrganismeDetails.nature", "inconnue"],
          },
          isReseauResponsable: "$sourceOrganismeDetails.isReseauResponsable",
          isTeteDeReseau: "$sourceOrganismeDetails.isTeteDeReseau",
          sameOrgTransmitterFormateur: {
            $cond: {
              if: {
                $eq: ["$source_organisme_id", "$effectifDetails.organisme_formateur_id"],
              },
              then: true,
              else: false,
            },
          },
          sameOrgTransmitterResponsable: {
            $cond: {
              if: {
                $eq: ["$source_organisme_id", "$effectifDetails.organisme_responsable_id"],
              },
              then: true,
              else: false,
            },
          },
          sameOrgResponsableFormateur: {
            $cond: {
              if: {
                $eq: ["$effectifDetails.organisme_responsable_id", "$effectifDetails.organisme_formateur_id"],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $group: {
          _id: {
            source_organisme_id: "$source_organisme_id",
            organisme_formateur_id: "$effectifDetails.organisme_formateur_id",
            organisme_responsable_id: "$effectifDetails.organisme_responsable_id",
            source: "$source",
            ERP: "$effectifDetails.ERP",
            ERPVersion: "$effectifDetails.ERPVersion",
          },
          effectifsCount: {
            $sum: 1,
          },
          firstTransmission: {
            $min: "$created_at",
          },
          lastTransmission: {
            $max: "$updated_at",
          },
          details: {
            $first: "$$ROOT",
          },
        },
      },
      {
        $project: {
          _id: 0,
          "Nom de l'Organisme Source": "$details.sourceOrganismeDetails.nom",
          "SIRET de l'Organisme Source": "$details.sourceOrganismeDetails.siret",
          "UAI de l'Organisme Source": "$details.sourceOrganismeDetails.uai",
          "Nombre d'Effictifs": "$effectifsCount",
          "Date de Première Transmission": "$firstTransmission",
          "Date de Dernière Transmission": "$lastTransmission",
          "Nom de l'Organisme Formateur": "$details.organismeFormateurDetails.nom",
          "SIRET de l'Organisme Formateur": "$details.organismeFormateurDetails.siret",
          "UAI de l'Organisme Formateur": "$details.organismeFormateurDetails.uai",
          "Nom de l'Organisme Responsable": "$details.organismeResponsableDetails.nom",
          "SIRET de l'Organisme Responsable": "$details.organismeResponsableDetails.siret",
          "UAI de l'Organisme Responsable": "$details.organismeResponsableDetails.uai",
          Source: "$_id.source",
          ERP: "$_id.ERP",
          "Version ERP": "$_id.ERPVersion",
          "Nature du Transmetteur": "$details.transmetteurNature",
          "Nature du Formateur": "$details.formateurNature",
          "Nature du Responsable": "$details.responsableNature",
          "Est Responsable de Réseau": "$details.isReseauResponsable",
          "Est Tête de Réseau": "$details.isTeteDeReseau",
          "Même Org Transmetteur et Formateur": "$details.sameOrgTransmitterFormateur",
          "Même Org Transmetteur et Responsable": "$details.sameOrgTransmitterResponsable",
          "Même Org Formateur et Responsable": "$details.sameOrgResponsableFormateur",
        },
      },
    ];

    const results = await effectifsQueueDb().aggregate(pipeline).toArray();
    console.log("Pipeline results:", JSON.stringify(results, null, 2));
    return results;
  } catch (err) {
    console.error("Error fetching data:", err);
    return [];
  }
}

export async function generateOrganismeReports() {
  const data = await fetchOrganismesData();
  if (data.length === 0) {
    console.log("No data found. Please check your database and pipeline.");
    return;
  }

  const worksheet = utils.json_to_sheet(data);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Organismes");

  const filePath = "./organismes_data.xlsx";
  writeFileSync(filePath, write(workbook, { type: "buffer" }));
  console.log(`Excel file generated: ${filePath}`);
}

generateOrganismeReports().catch((err) => {
  console.error("Error generating reports:", err);
});
