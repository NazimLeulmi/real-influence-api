function makeTemplate(otp) {
  return /*html*/ `
        <main>
        <img src="https://realinfluence.io/static/logo.png" alt="logo" height="65" width="65" />
        <h1>Verify your email address</h1>
        <p>
          In order to start using your account, you need to confirm your email
          address.
        </p>
        <h1>OTP ${otp} </h1>
        </main>
  `;
}

module.exports = makeTemplate;
