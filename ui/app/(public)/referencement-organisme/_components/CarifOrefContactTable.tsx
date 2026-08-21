"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { CONTACT_CARIF_OREF } from "shared";

import { AideLink } from "./AideSection";

export function CarifOrefContactTable() {
  return (
    <div className={fr.cx("fr-table", "fr-table--bordered", "fr-table--no-caption")}>
      <table>
        <caption>Contacts des Carif-Oref par région</caption>
        <thead>
          <tr>
            <th scope="col">Région</th>
            <th scope="col">Plateforme</th>
            <th scope="col">Téléphone</th>
            <th scope="col">Email</th>
          </tr>
        </thead>
        <tbody>
          {CONTACT_CARIF_OREF.map((contact) => (
            <tr key={contact.region}>
              <th scope="row">{contact.region}</th>
              <td>
                <AideLink href={contact.link}>{contact.platform}</AideLink>
              </td>
              <td>{contact.phone}</td>
              <td>
                {contact.email !== "-" ? (
                  <AideLink href={`mailto:${contact.email}`}>{contact.email}</AideLink>
                ) : (
                  contact.email
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
