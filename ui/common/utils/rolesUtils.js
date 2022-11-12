export const isUserAdmin = (auth) => auth && auth.permissions && auth.permissions.is_admin;

export const hasPageAccessTo = (auth, aclRef) => {
  return isUserAdmin(auth) || auth.acl?.includes(aclRef);
};

export const hasContextAccessTo = (context, aclRef) => {
  return context?.acl?.includes(aclRef);
};
