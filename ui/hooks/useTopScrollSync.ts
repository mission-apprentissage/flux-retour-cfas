import { useEffect, RefObject } from "react";

export const useTopScrollSync = (topScrollRef: RefObject<HTMLElement>, tableScrollRef: RefObject<HTMLElement>) => {
  useEffect(() => {
    const syncScroll = (sourceRef: RefObject<HTMLElement>, targetRef: RefObject<HTMLElement>) => {
      if (sourceRef.current && targetRef.current) {
        targetRef.current.scrollLeft = sourceRef.current.scrollLeft;
      }
    };

    const handleTopScroll = () => syncScroll(topScrollRef, tableScrollRef);
    const handleTableScroll = () => syncScroll(tableScrollRef, topScrollRef);

    const topScrollEl = topScrollRef.current;
    const tableScrollEl = tableScrollRef.current;

    topScrollEl?.addEventListener("scroll", handleTopScroll);
    tableScrollEl?.addEventListener("scroll", handleTableScroll);

    return () => {
      topScrollEl?.removeEventListener("scroll", handleTopScroll);
      tableScrollEl?.removeEventListener("scroll", handleTableScroll);
    };
  }, [topScrollRef, tableScrollRef]);
};
