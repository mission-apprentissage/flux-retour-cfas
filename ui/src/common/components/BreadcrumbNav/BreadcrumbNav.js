import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const BreadcrumbNav = ({ links }) => {
  const currentLink = links.at(-1);
  const otherLinks = links.slice(0, -1);
  return (
    <Breadcrumb separator={<Box className="ri-arrow-right-s-line" />}>
      {otherLinks.map((item, index) => (
        <BreadcrumbItem key={index}>
          <BreadcrumbLink href={item.path}>{item.title}</BreadcrumbLink>
        </BreadcrumbItem>
      ))}
      <BreadcrumbItem isCurrentPage>
        <BreadcrumbLink href={currentLink.path} textDecoration="none" color="black">
          {currentLink.title}
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
};

export default BreadcrumbNav;
