module.exports = ({ auth, roles }) => {
  if (!auth || !auth.user) {
    throw new Error('AUTHENTICATION_FAILED');
  }

  let isAuthorized = false;

  if (roles && Array.isArray(roles)) {
    // eslint-disable-next-line array-callback-return
    roles.some((role) => {
      if (auth.user.role === role) {
        isAuthorized = true;
      }
    });

    if (!isAuthorized) {
      throw new Error('UNAUTHORIZED');
    }
  } else {
    isAuthorized = true;
  }

  if (!isAuthorized) {
    throw new Error('AUTHENTICATION_FAILED');
  }

  return isAuthorized;
};
