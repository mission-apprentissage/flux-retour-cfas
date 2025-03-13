"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { SideMenu } from "@codegouvfr/react-dsfr/SideMenu";
import { Tile } from "@codegouvfr/react-dsfr/Tile";
import { useState } from "react";

import { Table } from "../_components/Table";

export default function Page() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="fr-container">
      <Alert
        closable
        description="Nous vous mettons à disposition les contacts des jeunes et leur CFA : vous êtes encouragé à les contacter. Ne partagez pas ces listes."
        onClose={function noRefCheck() {}}
        severity="warning"
        title=""
        classes={{
          root: "fr-mb-3w",
        }}
      />

      <div className="fr-grid-row fr-mb-2w">
        <div className="fr-col">
          <h1 className="fr-h1 fr-text--blue-france">Liste des jeunes en ruptures de contrat</h1>
          <p className="fr-text--sm fr-mb-3w">
            Nous affichons sur le TBA tous les jeunes ayant un statut de rupture, en les classant par date de rupture
            (du plus récent au plus ancien).
          </p>
        </div>
      </div>

      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <SideMenu
            align="left"
            burgerMenuButtonText="Dans cette rubrique"
            sticky
            items={[
              {
                text: "A traiter (47)",
                expandedByDefault: true,
                isActive: true,
                items: [
                  {
                    linkProps: {
                      href: "#mars-2025",
                    },
                    text: "Mars 2025 (5)",
                  },
                  {
                    linkProps: {
                      href: "#fevrier-2025",
                    },
                    text: "Février 2025",
                  },
                  {
                    linkProps: {
                      href: "#janvier-2025",
                    },
                    text: "Janvier 2025",
                  },
                  {
                    linkProps: {
                      href: "#decembre-2024",
                    },
                    text: "Décembre 2024 (30)",
                  },
                  {
                    linkProps: {
                      href: "#novembre-2024",
                    },
                    text: "Novembre 2024",
                  },
                ],
              },
              {
                text: "Déjà traité",
                linkProps: {
                  href: "#",
                },
              },
            ]}
          />
        </div>

        <div className="fr-col-12 fr-col-md-8">
          <h2 className="fr-h2 fr-text--blue-france fr-mb-2w">A traiter</h2>

          <div>
            <SearchBar
              label="Rechercher par nom, prénom ou CFA"
              renderInput={({ id, className, placeholder }) => (
                <input
                  id={id}
                  className={className}
                  placeholder={placeholder}
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              )}
            />
          </div>

          <div id="mars-2025" className="fr-mb-4w">
            <Table
              caption="Mars 2025"
              data={[
                [
                  <Badge key={1} severity="new" small>
                    Label new
                  </Badge>,
                  "Lorem ipsum d",
                  "Lorem ipsu",
                ],
                [
                  <Badge key={1} severity="new" small>
                    Label new
                  </Badge>,
                  "Lorem ipsum dolor sit amet consectetur adipisicin",
                  "Lorem ipsum dolor sit amet consectetur",
                ],
                [
                  <Badge key={1} severity="new" small>
                    Label new
                  </Badge>,
                  "Lorem ipsum d",
                  "Lorem ipsu",
                ],
                [
                  <Badge key={1} severity="new" small>
                    Label new
                  </Badge>,
                  "Autre exemple de données",
                  "Valeur de test",
                ],
                [
                  <Badge key={1} severity="new" small>
                    Label new
                  </Badge>,
                  "Données supplémentaires",
                  "Autre valeur",
                ],
                [
                  <Badge key={1} severity="new" small>
                    Label new
                  </Badge>,
                  "Information importante",
                  "Détail associé",
                ],
                [
                  <Badge key={1} severity="new" small>
                    Label new
                  </Badge>,
                  "Dernier élément",
                  "Description finale",
                ],
              ]}
              columnWidths={["20%", "40%", "40%"]}
              searchTerm={searchTerm}
              searchableColumns={[1, 2]}
              itemsPerPage={5}
            />
          </div>

          <h4 id="fevrier-2025" className="fr-h4 fr-text--blue-france fr-mb-2w">
            Février 2025
          </h4>
          <div className="fr-mb-4w">
            <Tile
              enlargeLinkOrButton
              imageSvg
              imageUrl="static/media/city-hall.27b3dc9b.svg"
              linkProps={{ href: "#" }}
              orientation="horizontal"
              small
              title="Intitulé de la tuile"
              titleAs="h4"
              classes={{
                root: "fr-mb-2w",
              }}
            />
          </div>

          <h4 id="janvier-2025" className="fr-h4 fr-text--blue-france fr-mb-2w">
            Janvier 2025
          </h4>
          <p className="fr-mb-2w">Pas de rupturant à afficher ce mois-ci</p>

          <div id="decembre-2024" className="fr-mb-4w">
            <Table
              caption="Décembre 2024"
              data={[
                ["Lorem ipsum dolor sit amet consectetur adipisicin", "Lorem ipsum dolor sit amet consectetur"],
                ["Lorem ipsum d", "Lorem ipsu"],
                ["Lorem ipsum dolor sit amet consectetur adipisicin", "Lorem ipsum dolor sit amet consectetur"],
                ["Lorem ipsum d", "Lorem ipsu"],
                ["Autre exemple de données", "Valeur de test"],
                ["Données supplémentaires", "Autre valeur"],
                ["Information importante", "Détail associé"],
                ["Dernier élément", "Description finale"],
              ]}
              searchTerm={searchTerm}
              itemsPerPage={5}
            />
          </div>

          <div id="novembre-2024" className="fr-mb-4w">
            <Table
              caption="Novembre 2024"
              data={[
                ["Lorem ipsum dolor sit amet consectetur adipisicin", "Lorem ipsum dolor sit amet consectetur"],
                ["Lorem ipsum d", "Lorem ipsu"],
                ["Lorem ipsum dolor sit amet consectetur adipisicin", "Lorem ipsum dolor sit amet consectetur"],
                ["Lorem ipsum d", "Lorem ipsu"],
                ["Autre exemple de données", "Valeur de test"],
                ["Données supplémentaires", "Autre valeur"],
                ["Information importante", "Détail associé"],
                ["Dernier élément", "Description finale"],
              ]}
              searchTerm={searchTerm}
              itemsPerPage={5}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
