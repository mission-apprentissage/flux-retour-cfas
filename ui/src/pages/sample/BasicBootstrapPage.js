import React from "react";
import { Page } from "tabler-react";
import Layout from "../layout/Layout";
import "react-bootstrap-table-next/dist/react-bootstrap-table2.min.css";
import "react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit.min.css";
import "react-bootstrap-table2-paginator/dist/react-bootstrap-table2-paginator.min.css";
import paginationFactory from "react-bootstrap-table2-paginator";
import BootstrapTable from "react-bootstrap-table-next";
import ToolkitProvider, { CSVExport } from "react-bootstrap-table2-toolkit";

const { ExportCSVButton } = CSVExport;

const columns = [
  {
    dataField: "id",
    text: "Product ID",
  },
  {
    dataField: "name",
    text: "Product Name",
  },
  {
    dataField: "price",
    text: "Product Price",
  },
];

const dataTest = [
  {
    id: 1,
    name: "Name Test",
    price: "18",
  },
  {
    id: 2,
    name: "Name 2",
    price: "24",
  },
  {
    id: 1,
    name: "Name Test",
    price: "18",
  },
  {
    id: 2,
    name: "Name 2",
    price: "24",
  },
  {
    id: 1,
    name: "Name Test",
    price: "18",
  },
  {
    id: 2,
    name: "Name 2",
    price: "24",
  },
  {
    id: 1,
    name: "Name Test",
    price: "18",
  },
  {
    id: 2,
    name: "Name 2",
    price: "24",
  },
  {
    id: 1,
    name: "Name Test",
    price: "18",
  },
  {
    id: 2,
    name: "Name 2",
    price: "24",
  },
  {
    id: 1,
    name: "Name Test",
    price: "18",
  },
  {
    id: 2,
    name: "Name 2",
    price: "24",
  },
  {
    id: 1,
    name: "Name Test",
    price: "18",
  },
  {
    id: 2,
    name: "Name 2",
    price: "24",
  },
  {
    id: 1,
    name: "Name Test",
    price: "18",
  },
  {
    id: 2,
    name: "Name 2",
    price: "24",
  },
];

export default () => {
  return (
    <Layout>
      <Page>
        <Page.Main>
          <Page.Content title="Sample React Bootstrap table">
            <div class="col-12">
              <div class="card">
                <div class="card-header">
                  <h3 class="card-title">Test React Bootstrap</h3>
                </div>
                <ToolkitProvider keyField="id" data={dataTest} columns={columns} exportCSV>
                  {(props) => (
                    <div>
                      <ExportCSVButton {...props.csvProps}>Export CSV!!</ExportCSVButton>
                      <hr />
                      <BootstrapTable
                        {...props.baseProps}
                        bootstrap4={true}
                        keyField="id"
                        data={dataTest}
                        columns={columns}
                        pagination={paginationFactory()}
                      />
                    </div>
                  )}
                </ToolkitProvider>
              </div>
            </div>
          </Page.Content>
        </Page.Main>
      </Page>
    </Layout>
  );
};
