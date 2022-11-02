const errorsList = require('./errors.json');

module.exports = (error) => {
  let response = {
    statusCode: 400,
    message: error.message || error,
    error: 'Bad Request'
  };

  if (errorsList[error] && errorsList[error].message) {
    response = errorsList[error];
  }

  return response;
};
