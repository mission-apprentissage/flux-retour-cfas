import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const BreadcrumbNav = ({ links, activeLink }) => {
  return (
    <Breadcrumb separator={<Box className="ri-arrow-right-s-line" />}>
      {links.map((item, index) => (
        <BreadcrumbItem key={index}>
          <BreadcrumbLink href={item.path}>{item.title}</BreadcrumbLink>
        </BreadcrumbItem>
      ))}
      <BreadcrumbItem isCurrentPage>
        <BreadcrumbLink href={activeLink.path} textDecoration="none" color="black">
          {activeLink.title}
        </BreadcrumbLink>
      </BreadcrumbItem>
    </Breadcrumb>
  );
};

BreadcrumbNav.propTypes = {
  links: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
    }).isRequired
  ).isRequired,
  activeLink: PropTypes.shape({
    path: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
};

export default BreadcrumbNav;
