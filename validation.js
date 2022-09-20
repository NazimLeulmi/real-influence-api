const validator = require("validator");

function validateSignUp(data) {
  const { email, password, passwordc, name, dialCode, isoCode, number } = data;
  const errors = {
    email: "",
    password: "",
    passwordc: "",
    name: "",
    dialCode: "",
    isoCode: "",
    number: "",
  };
  // Email input validation
  if (email === "" || email === null || email === undefined) {
    errors.email = "The email address is required";
  } else if (!validator.isEmail(email)) {
    errors.email = "The email address is invalid";
  } else if (email.length > 60) {
    errors.email = "The maximum length is 60 characters";
  }
  // User name input validation
  if (name === "" || name === null || name === undefined) {
    errors.name = "The username is required";
  } else if (name.length < 3) {
    errors.name = "The minimum length is 3 characters";
  } else if (name.length > 20) {
    errors.name = "The maximum length is 20 characters";
  }
  // dialCode input validation
  if (dialCode === "" || dialCode === null || dialCode === undefined) {
    errors.dialCode = "The dialCode is required";
  } else if (name.dialCode > 5) {
    errors.dialCode = "The maximum length is 5 characters";
  }
  // isoCode input validation
  if (isoCode === "" || isoCode === null || isoCode === undefined) {
    errors.isoCode = "The isoCode is required";
  } else if (isoCode.length < 2) {
    errors.isoCode = "The isoCode has to be 2 characters";
  } else if (isoCode.length > 2) {
    errors.isoCode = "The isoCode has to be 2 characters";
  }
  // number input validation
  if (number === "" || number === null || number === undefined) {
    errors.number = "The phone number is required";
  }
  // Password input validation
  if (password === "" || password === null || password === undefined) {
    errors.password = "The password is required";
  } else if (password.length < 8) {
    errors.password = "The minimum length is 8 characters";
  }
  if (passwordc === "" || passwordc === null || passwordc === undefined) {
    errors.passwordc = "The password confirmation is required";
  } else if (!validator.equals(password, passwordc)) {
    errors.passwordc = "The password confirmation doesn't match";
  }
  const errorsString =
    errors.email +
    errors.password +
    errors.name +
    errors.passwordc +
    errors.dialCode +
    errors.isoCode +
    errors.number;
  return { isValid: errorsString === "" ? true : false, errors };
}
function validateSignIn(email) {
  // Email input validation
  let error = "";
  if (email === "" || email === null || email === undefined) {
    error = "The email address is required";
  } else if (!validator.isEmail(email)) {
    error = "The email address is invalid";
  } else if (email.length > 60) {
    error = "The maximum length is 60 characters";
  }
  return { isValid: error === "" ? true : false, error };
}

module.exports = { validateSignUp, validateSignIn };
