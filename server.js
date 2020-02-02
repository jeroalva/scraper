var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");

var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/unit18Populater"
var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true});

//Declare handlebars
app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main"
  })
);
app.set("view engine", "handlebars");

//Functions
const renderMain = function(reqq,ress){
    db.Article.find({})
    .sort({createdAt: -1})
    .then(function(dbArticle) {
      ress.render("articles",{dbArticle, helpers:{
        stringit: function(expression){
          return JSON.stringify(expression)
        }
      }
    });
    })
    .catch(function(err) {
      ress.json(err);
    });
}

const renderSaved = function(reqq,ress){
  db.Article.find({saved: true})
  .then(function(dbArticle) {
    console.log(dbArticle)
    ress.render("saved",{dbArticle, helpers:{
      stringit: function(expression){
        return JSON.stringify(expression)
      }
    }
  });
  })
  .catch(function(err) {
    ress.json(err);
  });
}

const axiosScrape = function(reqq,ress){
  axios.get("https://eldeforma.com/").then(function(data) {
    var $ = cheerio.load(data.data);
    $("article .row .col-sm-7").each(function(i, element) {
      var result = {};
        result.title = $(this)
          .children("header")
          .children("h2")
          .children("a")
          .children("span")
          .text()
        result.content = $(this)
          .children("div .article__content")
          .children("p")
          .text()
        result.link = $(this)
          .children("header")
          .children("h2")
          .children("a")
          .attr("href")
        result.saved = false
        result.createdAt = Date.now();
      db.Article.updateOne({title: result.title}, {$set: result}, {upsert: true})
        .then(function(dbArticle) {
          console.log("Finished scraping!");
        })
        .catch(function(err) {
          console.log(err)
        });
    });
  }).then(renderMain(reqq,ress));
}

// ---------------------------------------------------------------------------------
// ROUTES
// ---------------------------------------------------------------------------------

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  db.Article.find({})
    .sort({createdAt: -1})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for getting all articles and redering the main view
app.get("/", (req,res) => axiosScrape(req, res));

app.get("/saved", (req,res) => renderSaved(req,res))

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for saving/updating an Article into the saved Collection
app.post("/saveArticle/:id", function(req, res) {
  db.Article.updateOne({_id: req.params.id}, {$set: {saved: true}})
    .then(function(dbArticle) {
      console.log("Exito")
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for unsaving an Article from the saved Collection
app.post("/unsaveArticle/:id", function(req, res) {
  db.Article.updateOne({_id: req.params.id}, {$set: {saved: false}})
    .then(function(dbArticle) {
      console.log("Exito")
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});


// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
