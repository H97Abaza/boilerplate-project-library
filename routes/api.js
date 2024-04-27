/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";
const mongoose = require("mongoose");
module.exports = function (app) {
  mongoose
    .connect(process.env.DB)
    .then(() => console.log("Connected to DB"))
    .catch((err) => console.log("Connection to DB failed.\n", err));

  const commentSchema = new mongoose.Schema(
    {
      bookid: { type: mongoose.Types.ObjectId, ref: "Book" },
      comment: String,
    },
    { toJSON: { transform: (v) => v.comment } }
  );
  const Comment = new mongoose.model("Comment", commentSchema);
  const bookSchema = new mongoose.Schema(
    {
      title: String,
    },
    { toObject: { virtuals: true }, toJSON: { virtuals: true }, id: false }
  );
  bookSchema.virtual("comments", {
    ref: "Comment",
    localField: "_id",
    foreignField: "bookid",
    getters: true,
  });

  bookSchema.virtual("commentcount", {
    ref: "Comment",
    localField: "_id",
    foreignField: "bookid",
    count: true,
  });
  const Book = new mongoose.model("Book", bookSchema);

  app
    .route("/api/books")
    .get(function (req, res) {
      //response will be array of book objects
      Book.find()
        .select("title comments commentcount")
        .populate("comments")
        .populate("commentcount")
        .then((docs) => res.json(docs))
        .catch((err) => {
          console.log(err);
        });
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
    })

    .post(function (req, res) {
      let title = req.body.title;
      if (!title) return res.send("missing required field title");
      let book = new Book({ title });
      book
        .save()
        .then((doc) => res.json(doc))
        .catch((err) => res.json(err));
      //response will contain new book object including atleast _id and title
    })

    .delete(function (req, res) {
      //if successful response will be 'complete delete successful'
      Book.deleteMany({})
        .then((msg) => {
          if (msg) res.send("complete delete successful");
          else res.send("delete error");
        })
        .catch((err) => res.send("delete error"));
    });

  app
    .route("/api/books/:id")
    .get(function (req, res) {
      let bookid = req.params.id;
      Book.findById(bookid)
        .populate("comments")
        .populate("commentcount")
        .exec()
        .then((doc) => {
          if (!doc) res.send("no book exists");
          else res.json(doc);
        })
        .catch((err) => {
          console.log(err);
        });
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
    })

    .post(function (req, res) {
      let bookid = req.params.id;
      let comment = req.body.comment;
      if (!comment) return res.send("missing required field comment");
      Book.findById(bookid)
        .then(async (book) => {
          if (book) {
            comment = new Comment({ comment, bookid });
            try {
              await comment.save();
            } catch (error) {
              console.log({ error });
            }
            book
              .populate("comments")
              .then((doc) => res.json(doc))
              .catch((err) => console.log(err));
          } else res.send("no book exists");
        })
        .catch((err) => console.log(err));
      //json res format same as .get
    })

    .delete(function (req, res) {
      let bookid = req.params.id;
      //if successful response will be 'delete successful'
      Book.findOneAndDelete({ _id: bookid })
        .then((doc) => {
          if (doc) res.send("delete successful");
          else res.send("no book exists");
        })
        .catch((err) => res.send("no book exists"));
    });
};
