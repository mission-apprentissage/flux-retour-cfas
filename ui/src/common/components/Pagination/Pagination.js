import { Container, Next, PageGroup, Paginator, Previous } from "chakra-paginator";
import PropTypes from "prop-types";
import React from "react";

// Page styles
const baseStyles = {
  w: 30,
};

const normalStyles = {
  ...baseStyles,
};

const activeStyles = {
  ...baseStyles,
  bg: "bluedark.500",
  color: "white",
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
      <Container align="center" justify="space-between" w="full">
        <Previous>
          <i className="ri-arrow-left-s-fill"></i>
        </Previous>
        <PageGroup backgroundColor="blue" isInline align="center" />
        <Next>
          <i className="ri-arrow-right-s-fill"></i>
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
