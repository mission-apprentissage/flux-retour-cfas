import React from "react";
import { Page } from "tabler-react";
import Layout from "../layout/Layout";
import DataTable from "react-data-table-component";
import DataTableExtensions from "react-data-table-component-extensions";
import "react-data-table-component-extensions/dist/index.css";

const columnsTest = [
  {
    name: "Title",
    selector: "title",
    sortable: true,
  },
  {
    name: "Director",
    selector: "director",
    sortable: true,
  },
  {
    name: "Genres",
    selector: "genres",
    sortable: true,
    cell: (d) => <span>{d.genres.join(", ")}</span>,
  },
  {
    name: "Year",
    selector: "year",
    sortable: true,
  },
];

const dataTest = [
  {
    title: "Beetlejuice",
    year: "1988",
    genres: ["Comedy", "Fantasy"],
    director: "Tim Burton",
  },
  {
    id: 2,
    title: "The Cotton Club",
    year: "1984",
    runtime: "127",
    genres: ["Crime", "Drama", "Music"],
    director: "Francis Ford Coppola",
  },
];

export default () => {
  return (
    <Layout>
      <Page>
        <Page.Main>
          <Page.Content title="Sample">
            <DataTableExtensions
              filter={false}
              print={false}
              exportHeaders={true}
              columns={columnsTest}
              data={dataTest}
            >
              <DataTable
                noHeader
                print="false"
                defaultSortField="id"
                defaultSortAsc={false}
                pagination
                highlightOnHover
              />
            </DataTableExtensions>
          </Page.Content>
        </Page.Main>
      </Page>
    </Layout>
  );
};
