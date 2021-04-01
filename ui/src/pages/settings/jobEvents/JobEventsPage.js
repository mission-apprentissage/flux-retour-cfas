import { Skeleton, Table, TableCaption, Tag, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Page, PageContent, PageHeader, Pagination } from "../../../common/components";
import withJobEventsData from "./withJobEventsData";

const JobEventsPage = ({ data, error, loading, _fetch }) => {
  return (
    <Page>
      <PageHeader title="Paramètres - Jobs" />
      <PageContent>
        {/* Error */}
        {error && (
          <Text>
            <p>Erreur lors du chargement des jobs</p>
          </Text>
        )}

        {/* Loading */}
        {loading && (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Nom du job</Th>
                <Th>Action</Th>
                <Th>Date</Th>
              </Tr>
            </Thead>
            <Tbody>
              {Array.from(Array(10), (e, i) => {
                return (
                  <Tr key={i}>
                    <Td>
                      <Skeleton height="20px" />
                    </Td>
                    <Td>
                      <Skeleton height="20px" />
                    </Td>
                    <Td>
                      <Skeleton height="20px" />
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}

        {/* Data */}
        {data && !error && !loading && (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Nom du job</Th>
                <Th>Action</Th>
                <Th>Date</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.jobEvents.map((event) => (
                <Tr key={event._id}>
                  <Td>
                    <Tag variant="solid">{event.jobname}</Tag>
                  </Td>
                  <Td>
                    <Tag>{event.action}</Tag>
                  </Td>
                  <Td>
                    <Tag variant="outline">{new Date(event.date).toLocaleString()}</Tag>
                  </Td>
                </Tr>
              ))}
            </Tbody>
            <TableCaption>
              <Pagination
                pagesQuantity={data.pagination.nombre_de_page}
                currentPage={data.pagination.page}
                changePageHandler={(data) => _fetch(data)}
              />
            </TableCaption>
          </Table>
        )}
      </PageContent>
    </Page>
  );
};

JobEventsPage.propTypes = {
  data: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.object,
  _fetch: PropTypes.func.isRequired,
};

export default withJobEventsData(JobEventsPage);
