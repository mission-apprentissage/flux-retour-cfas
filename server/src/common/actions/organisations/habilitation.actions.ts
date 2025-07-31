import { usersMigrationDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { IUsersMigration } from "shared/models";

export async function listOrganisationMembers(ctx: AuthContext): Promise<Partial<IUsersMigration[]>> {

    switch (ctx.type) {
        // case "ORGANISME_FORMATION":
        //     return listOrganismeFormationMembers(ctx);
        default:
            return listDefaultOrganisationMembers(ctx);
    }

}

// const listOrganismeFormationMembers = async (ctx: AuthContext): Promise<Partial<IUsersMigration[]>> => {
//     return await 
// }

const listDefaultOrganisationMembers = async (ctx: AuthContext): Promise<Partial<IUsersMigration[]>> => {
    return await usersMigrationDb()
        .find(
            {
                organisation_id: ctx.organisation_id,
                account_status: {
                    $in: ["PENDING_ADMIN_VALIDATION", "CONFIRMED"],
                },
            },
            {
                projection: {
                    _id: 1,
                    nom: 1,
                    prenom: 1,
                    email: 1,
                    telephone: 1,
                    account_status: 1,
                    created_at: 1,
                    last_connection: 1,
                },
            }
        )
        .toArray();
}
