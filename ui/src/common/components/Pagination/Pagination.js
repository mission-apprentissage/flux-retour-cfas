import { Box, Button } from "@chakra-ui/react";
import Pagination from "@choc-ui/paginator";
import React, { forwardRef } from "react";

export const DEFAULT_PAGE_SIZE = 10;

const Next = forwardRef((props, ref) => (
  <Button ref={ref} {...props} style={{ textDecoration: "none" }}>
    <Box as="i" className="ri-skip-forward-fill" />
  </Button>
));

const Prev = forwardRef((props, ref) => (
  <Button ref={ref} {...props} style={{ textDecoration: "none" }}>
    <Box as="i" className="ri-skip-back-fill" />
  </Button>
));

const Forward = forwardRef((props, ref) => (
  <Button ref={ref} {...props} style={{ textDecoration: "none" }}>
    <Box as="i" className="ri-arrow-right-s-line" />
  </Button>
));

const Backward = forwardRef((props, ref) => (
  <Button ref={ref} {...props} style={{ textDecoration: "none" }}>
    <Box as="i" className="ri-arrow-left-s-line" />
  </Button>
));

Backward.displayName = "backward";
Forward.displayName = "forward";
Prev.displayName = "prev";
Next.displayName = "next";

const itemRender = (_, type) => {
  if (type === "backward") {
    return Backward;
  }
  if (type === "forward") {
    return Forward;
  }
  if (type === "prev") {
    return Prev;
  }
  if (type === "next") {
    return Next;
  }
};

export const BasePagination = ({ ...props }) => (
  <Pagination
    {...props}
    itemRender={itemRender}
    pageSize={DEFAULT_PAGE_SIZE}
    paginationProps={{
      display: "flex",
      pos: "absolute",
      left: "50%",
      transform: "translateX(-50%)",
    }}
    baseStyles={{ bg: "white" }}
    activeStyles={{ bg: "bluefrance", color: "white", pointerEvents: "none" }}
    hoverStyles={{ bg: "galt", color: "grey.800" }}
  />
);
