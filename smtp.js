require("dotenv").config();
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const makeTemplate = require("./email");

const OAuth2_client = new OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET);
OAuth2_client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });




function sendMail(otp, recipient) {
  const accessToken = OAuth2_client.getAccessToken();
  const template = makeTemplate(otp);
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken: accessToken
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  const options = {
    from: `Real Influence <${process.env.EMAIL}>`,
    to: recipient,
    subject: "Email Verification",
    html: template
  }

  transporter.sendMail(options, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Email has been sent");
    }
    transporter.close();
  })
}

module.exports = sendMail;
