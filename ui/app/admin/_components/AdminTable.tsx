"use client";

import { useEffect, useRef, useState } from "react";

import { FullTable } from "@/app/_components/table/FullTable";
import { FullTableProps } from "@/app/_components/table/types";

import styles from "./admin-page.module.scss";

export function AdminTable(props: FullTableProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const update = () => setIsScrollable(wrapper.scrollWidth > wrapper.clientWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(wrapper);
    const table = wrapper.querySelector("table");
    if (table) observer.observe(table);

    return () => observer.disconnect();
  }, [props.data, props.columns]);

  return (
    <div
      ref={wrapperRef}
      className={styles.tableWrapper}
      {...(isScrollable
        ? { tabIndex: 0, ...(props.tableLabel ? { role: "region", "aria-label": props.tableLabel } : {}) }
        : {})}
    >
      <FullTable {...props} />
    </div>
  );
}
