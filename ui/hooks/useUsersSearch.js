import { useQuery } from "react-query";

import { fetchSearchUsers } from "../api/tableauDeBord";
import { QUERY_KEYS } from "../common/constants/queryKeys";
import { omitNullishValues } from "../utils/omitNullishValues";
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

const useUsersSearch = (searchTerm) => {
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
    data: sortedData?.map(({ id, username, email, permissions, network, region, organisme, created_at }) => {
      return { id, username, email, permissions, network, region, organisme, created_at };
    }),
    loading: isLoading,
  };
};

export default useUsersSearch;
