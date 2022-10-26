import { useQuery } from "react-query";

import { fetchSearchUsers } from "../api/partageSimplifieApi.js";
import { QUERY_KEYS } from "../constants/queryKeys.js";
import { omitNullishValues } from "../utils/omitNullishValues.js";
import useDebounce from "./useDebounce";

export const MINIMUM_CHARS_TO_PERFORM_SEARCH = 4;
const SEARCH_DEBOUNCE_TIME = 300;

const getUsersListSortedChronologically = (users) => {
  const usersWithoutCreationDate = users.filter((user) => !user.created_at);
  const usersWithCreationDateSorted = users
    .filter((user) => Boolean(user.created_at))
    .sort((a, b) => {
      const date1 = a.created_at ? new Date(a.created_at) : 0;
      const date2 = b.created_at ? new Date(b.created_at) : 0;
      return date2 - date1;
    });
  return [...usersWithCreationDateSorted, ...usersWithoutCreationDate];
};

const useUsersSearchPartageSimplifie = (searchTerm) => {
  const debouncedSearchTerm = useDebounce(searchTerm, SEARCH_DEBOUNCE_TIME);

  // perform search if user has entered at least 4 chars or none
  const searchEnabled =
    debouncedSearchTerm.length === 0 || debouncedSearchTerm.length >= MINIMUM_CHARS_TO_PERFORM_SEARCH;

  const requestFilters = omitNullishValues({
    // we'll send null if debouncedSearchTerm is ""
    searchTerm: debouncedSearchTerm || null,
  });

  const { data, isLoading } = useQuery(
    [QUERY_KEYS.SEARCH_USERS, requestFilters],
    () => fetchSearchUsers(requestFilters),
    {
      enabled: searchEnabled,
    }
  );

  const sortedData = data && getUsersListSortedChronologically(data);

  return {
    data: sortedData?.map(
      ({ id, email, role, nom_etablissement, created_at, password_updated_at, password_updated_token_at }) => {
        return {
          id,
          email,
          role,
          nom_etablissement,
          created_at,
          password_updated_at,
          password_updated_token_at,
        };
      }
    ),
    loading: isLoading,
  };
};

export default useUsersSearchPartageSimplifie;
