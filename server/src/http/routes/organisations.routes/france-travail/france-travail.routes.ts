import { getRomeSecteurActivitesArborescence } from "@/common/actions/rome/rome.actions";
import { returnResult } from "@/http/middlewares/helpers";
import express from "express";
import { IOrganisationFranceTravail } from "shared/models";

export default () => {
    const router = express.Router();

    router.get("/arborescence", returnResult(getArborescence));
    router.get("/effectifs/:code_secteur", returnResult(getEffectifsByRome));
    router.get("/effectif/:id", returnResult(getEffectifById));

    router.put("/effectif/:id", returnResult(updateEffectifById));

    return router;
};

const getArborescence = async (req, { locals }) => {
    return getRomeSecteurActivitesArborescence();
}

const getEffectifsByRome = async (req, { locals }) => {
    const ftOrga = locals.franceTravail as IOrganisationFranceTravail;
    // WIP
}

const getEffectifById = async (req, { locals }) => {
    const ftOrga = locals.franceTravail as IOrganisationFranceTravail;
    // WIP
}

const updateEffectifById = async (req, { locals }) => {
    const ftOrga = locals.franceTravail as IOrganisationFranceTravail;
    // WIP
}
