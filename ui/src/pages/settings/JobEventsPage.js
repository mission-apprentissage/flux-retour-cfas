import { Skeleton, Table, TableCaption, Tag, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";

import { Page, PageContent, PageHeader, Pagination } from "../../common/components";
import { _post } from "../../common/httpClient";

const JobEventsPage = () => {
  let [data, setData] = useState(null);
  let [loading, setLoading] = useState(false);
  let [error, setError] = useState(null);

  const _fetch = useCallback(
    async (pageNumber = 1) => {
      setLoading(true);
      setError(null);

      try {
        const response = await _post("/api/jobEvents/", {
          page: pageNumber,
          limit: 10,
        });
        setData(response);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    ["/api/jobEvents/"]
  );

  useEffect(() => {
    async function fetchData() {
      return _fetch();
    }
    fetchData();
  }, ["/api/jobEvents/", _fetch]);

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

export default JobEventsPage;
