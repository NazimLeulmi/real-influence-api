const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");
const MongoStore = require("connect-mongo");
const influencers = require("./routes/influencers");
const users = require("./routes/users");
const admins = require("./routes/admins");
const share = require("./routes/share");
const stats = require("./routes/stats");
const UserModel = require("./models/user");
const InfluencerModel = require("./models/influencer");
require("dotenv").config();

let app = express();
// cross origin scripting

app.use(
  cors({
    origin: [
      "https://realinfluence.io",
      "https://adm.realinfluence.io",
    ],
    credentials: true,
  })
);

// security layer
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// compression
app.use(compression());


// Headers
app.set("trust proxy", 1);
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Origin", "https://adm.realinfluence.io");
  res.header("Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-HTTP-Method-Override, Set-Cookie, Cookie");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});

app.use("/static", express.static("static"));

app.use(express.json({ limit: "50mb" }));

// Mongo Database Connection
connectDB().catch((err) => console.log(err));
async function connectDB() {
  await mongoose.connect(process.env.DB);
  console.log("Connected to Mongo Database");
}

app.use(
  session({
    secret: "my very important session secret",
    resave: true,
    saveUninitialized: false,
    store: MongoStore.create({
      client: mongoose.connection.getClient(),
      dbName: "real-influence",
      collectionName: "express-sessions",
      ttl: 480 * 60 * 1000,
    }),
    proxy: true,
    cookie: {
      secure: true,
      domain: ".realinfluence.io",
      sameSite: "none",
      maxAge: 480 * 60 * 1000, // 8 hours
      httpOnly: true,
    },
  })
);

app.use("/stats", stats);
app.use("/share", share);
app.use("/influencers", influencers);
app.use("/users", users);
app.use("/admins", admins);

app.get("/", async (req, res) => {
  res.send("<h1>Real Influence</h1>");
});

app.get("/check-auth", async (req, res) => {
  try {
    if (req.session.userId) {
      const user = await UserModel.findById(req.session.userId).catch((err) =>
        console.log(err)
      );
      if (user) {
        return res.json({
          success: true,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            type: user.type,
          },
        });
      }
      const influencer = await InfluencerModel.findById(req.session.userId);
      if (influencer) {
        return res.json({
          success: true,
          user: {
            id: influencer._id,
            name: influencer.name,
            bio: influencer.bio,
            email: influencer.email,
            profileImg: influencer.profileImg,
            type: influencer.type,
          },
        });
      }
      return res.json({ success: false });
    } else {
      console.log("User isn't signed in");
      return res.json({ success: false });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/signout", async (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.json({ success: false });
    else return res.json({ success: true });
  });
});

app.listen(8888, () => console.log("Node.js server running on port 8888"));
