import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@chakra-ui/react";
import NavLink from "next/link";
import PropTypes from "prop-types";
import React from "react";

const BreadcrumbNav = ({ links }) => {
  const currentLink = links.slice().pop(); // get the last element (can't use Array.at() because of Safari)
  const otherLinks = links.slice(0, -1); // get all elements but the last one
  return (
    <Breadcrumb separator={<Box className="ri-arrow-right-s-line" />}>
      {otherLinks.map((item, index) => (
        <BreadcrumbItem key={index}>
          <BreadcrumbLink as={NavLink} to={item.path}>
            {item.title}
          </BreadcrumbLink>
        </BreadcrumbItem>
      ))}
      <BreadcrumbItem isCurrentPage>
        <BreadcrumbLink as={NavLink} to={currentLink.path} textDecoration="none" color="black">
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
