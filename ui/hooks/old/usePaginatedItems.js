import { useState } from "react";

import { DEFAULT_PAGE_SIZE } from "../../components/Pagination/Pagination";

const usePaginatedItems = (items) => {
  const [current, setCurrent] = useState(1);
  const offset = (current - 1) * DEFAULT_PAGE_SIZE;
  const itemsSliced = items?.slice(offset, offset + DEFAULT_PAGE_SIZE);

  return [current, setCurrent, itemsSliced];
};

export default usePaginatedItems;
