import { inviteUserToOrganisation, rejectMembre, removeUserFromOrganisation, validateMembre } from "@/common/actions/organisations.actions";
import { listOrganisationMembers } from "@/common/actions/organisations/habilitation.actions";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { returnResult } from "@/http/middlewares/helpers";
import express from "express";

export default () => {

    const router = express.Router();
    router.get("/", returnResult(getOrganisationMembers))
    router.post("/", returnResult(postOrganisationMembers))
    router.delete("/:userId", returnResult(deleteOrganisationMember))
    router.post("/:userId/validate", returnResult(validateOrganisationMember))
    router.post("/:userId/reject", returnResult(rejectOrganisationMember))

    return router;
};


const getOrganisationMembers = (req) => {
    return listOrganisationMembers(req.user);
};

const postOrganisationMembers = async (req) => {
    return inviteUserToOrganisation(
        req.user,
        req.body.email.toLowerCase(),
        (req.user as AuthContext).organisation_id
    );
}

const deleteOrganisationMember = async (req) => {
    return removeUserFromOrganisation(req.user, req.params.userId);
};

const validateOrganisationMember = async (req) => {
    return validateMembre(req.user, req.params.userId);
}

const rejectOrganisationMember = async (req) => {
    return rejectMembre(req.user, req.params.userId)
}
