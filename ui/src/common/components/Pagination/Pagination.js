import { Button } from "@chakra-ui/button";
import { Container, Next, PageGroup, Paginator, Previous } from "chakra-paginator";
import PropTypes from "prop-types";
import React from "react";

// Page styles
const baseStyles = {
  borderRadius: "40px",
  w: "40px",
};

const normalStyles = {
  ...baseStyles,
  bg: "white",
  color: "bluedark.500",
  _hover: {
    boxShadow: "0px 0px 0px 1px",
    w: "40px",
  },
};

const activeStyles = {
  ...baseStyles,
  color: "white",
  bg: "bluedark.500",
  borderRadius: "40px",
  w: "40px",
};

const Pagination = ({ pagesQuantity, currentPage, changePageHandler }) => {
  const handlePageChange = (nextPage) => {
    changePageHandler(nextPage);
  };

  return (
    <Paginator
      activeStyles={activeStyles}
      normalStyles={normalStyles}
      currentPage={currentPage}
      pagesQuantity={pagesQuantity}
      onPageChange={handlePageChange}
    >
      <Container align="center" justify="space-between">
        <Previous as={Button} background="white" _hover={{ color: "white" }} color="bluedark.500">
          <i className="ri-arrow-left-s-line"></i>
        </Previous>
        <PageGroup isInline align="center" />
        <Next as={Button} background="white" _hover={{ color: "white" }} color="bluedark.500">
          <i className="ri-arrow-right-s-line"></i>
        </Next>
      </Container>
    </Paginator>
  );
};

Pagination.propTypes = {
  pagesQuantity: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  changePageHandler: PropTypes.func.isRequired,
};

export default Pagination;
