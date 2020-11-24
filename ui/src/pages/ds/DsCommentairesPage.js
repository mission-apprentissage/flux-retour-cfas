import React from "react";
import { Page, Site, Nav, Grid, Header, Alert, StampCard } from "tabler-react";
import { useFetch } from "../../common/hooks/useFetch";
import Layout from "../layout/Layout";
import DataTable from "react-data-table-component";
import DataTableExtensions from "react-data-table-component-extensions";
import "react-data-table-component-extensions/dist/index.css";

export default () => {
  const [data, loading] = useFetch("api/ds/commentaires");

  const columnsResponses = [
    {
      name: "N° Dossier",
      selector: "num_dossier",
      sortable: true,
    },
    {
      name: "Mail",
      selector: "mail_contact",
      sortable: true,
    },
    {
      name: "ERP Autre",
      selector: "erp_autre",
      sortable: true,
    },
    {
      name: "Commentaire",
      selector: "commentaire",
      sortable: true,
    },
  ];

  return (
    <Layout>
      <Page>
        <Page.Main>
          <Page.Content title="Enquete Ds - Commentaires & Infos Dossiers">
            {loading && "Chargement des données..."}
            {data && (
              <>
                {/* Commentaires */}
                <Header.H5>Commentaires - Informations Dossiers DS</Header.H5>
                <DataTableExtensions
                  filter={false}
                  print={false}
                  exportHeaders={false}
                  columns={columnsResponses}
                  data={data.reponses}
                >
                  <DataTable noHeader defaultSortField="id" defaultSortAsc={false} pagination highlightOnHover />
                </DataTableExtensions>
              </>
            )}
          </Page.Content>
        </Page.Main>
      </Page>
    </Layout>
  );
};
