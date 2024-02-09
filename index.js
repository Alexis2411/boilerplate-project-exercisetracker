const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bodyParser = require("body-parser");
require("dotenv").config();

mongoose.connect(process.env.URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schemas
const exerciseSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  username: { type: String },
  description: { type: String },
  duration: { type: Number },
  date: { type: Date },
});

const userSchema = new Schema({
  username: { type: String },
});

// Models
const Exercise = mongoose.model("Exercise", exerciseSchema);
const User = mongoose.model("User", userSchema);

// Middleware
app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// POST route to create a new user
app.post("/api/users", (req, res) => {
  const { username } = req.body;
  const newUser = new User({ username });
  newUser
    .save()
    .then((user) => {
      res.status(201).json({ username: user.username, _id: user._id });
    })
    .catch((err) => res.status(409).send(err.message));
});

// POST route to create a new exercise
app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  User.findById(userId).then((user) => {
    if (!user) {
      return res.status(404).send("No user with that ID");
    }

    const newExercise = new Exercise({
      userId: user._id,
      username: user.username,
      description: description,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date(),
    });

    newExercise
      .save()
      .then((exercise) =>
        res.json({
          username: user.username,
          description: exercise.description,
          duration: exercise.duration,
          date: exercise.date.toDateString(),
          _id: user._id,
        }),
      )
      .catch((err) => {
        console.error(err);
        res.status(500).send("Internal Server Error");
      });
  });
});

// GET route to retrieve all users
app.get("/api/users", (req, res) => {
  User.find()
    .then((users) => res.json(users))
    .catch((err) => {
      console.error(err);
      res.status(500).send("Internal Server Error");
    });
});

// GET route to retrieve exercise logs for a specific user
app.get("/api/users/:_id/logs", (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  User.findById(userId).then((user) => {
    if (!user) {
      return res.status(404).send("No user with that ID");
    }

    let query = Exercise.find({ userId: user._id });

    if (from) {
      query.where("date").gte(new Date(from));
    }
    if (to) {
      query.where("date").lte(new Date(to));
    }

    if (limit) {
      query.limit(parseInt(limit));
    }

    query.exec().then((exercises) => {
      const log = exercises.map((exercise) => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
      }));

      res.json({
        username: user.username,
        count: log.length,
        _id: user._id,
        log: log,
      });
    });
  });
});

// Default route
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong.");
});

// 404 middleware
app.use((req, res) => {
  res.status(404).send("Page not found.");
});

// Server listening
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Your app is listening on port ${PORT}`);
});
