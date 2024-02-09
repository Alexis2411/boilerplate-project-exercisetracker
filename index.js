const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bodyParser = require("body-parser");
require("dotenv").config();

mongoose.connect(
  process.env.URI,
  { useNewUrlParser: true },
  { useUnifiedTopology: true }
);

//Schemas

const excerciseEschema = new Schema({
  username: { type: String },
  description: { type: String },
  duration: { type: Number },
  date: { type: Date },
});

const userSchema = new Schema({
  username: { type: String },
});

const logSchema = new Schema({
  username: { type: String },
  count: { type: Number },
  log: [
    {
      description: { type: String },
      duration: { type: Number },
      date: { type: Date },
    },
  ],
});

//Models
const Excercise = mongoose.model("Excercise", excerciseEschema);
const User = mongoose.model("User", userSchema);
const Log = mongoose.model("Log", logSchema);

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/api/users", (req, res) => {
  const { username } = req.body;
  const newUser = new User({ username });
  console.log(newUser);
  newUser
    .save()
    .then(() => res.json(newUser))
    .catch((err) => res.status(409).send(err));
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const id = req.params._id;
  User.findById(id)
    .then((user) => {
      if (!user) {
        return res.status(404).send("No user with that ID");
      }
      const username = user.username.toLowerCase();
      const description = req.body.description;
      const duration = req.body.duration;
      const date = new Date(req.body.date);
      //Add exercise to users log and increment the count of exercises in database
      const newLog = new Excercise({ username, description, duration, date });
      newLog
        .save()
        .then(() => res.json(newLog))
        .catch((e) => console.log(e));
    })
    .catch((err) => console.log(err));
});

app.get("/api/users", (req, res) => {
  User.find({})
    .then((users) => res.json(users))
    .catch((err) => {
      console.log(err);
    });
});
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong.");
});

app.use((req, res) => {
  res.status(404).send("Page not found.");
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
