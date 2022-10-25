function makeTemplate(otp) {
  return /*html*/ `
        <main>
        <img src="http://localhost:8888/static/logo.png" alt="logo" />
        <h1>Verify your email address</h1>
        <p>
          In order to start using your account, you need to confirm your email
          address.
        </p>
        <div>OTP [${otp}]</div>
        </main>
  `;
}

module.exports = makeTemplate;
