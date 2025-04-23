import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

const app = express();
const port = 3000;
const API_URL = "https://covers.openlibrary.org/b/$key/$value-$size.jpg";

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "booknotes",
  password: "6280",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const bookList = [];
var idCount = 0;

app.get("/", async (req, res) => {
  res.render("index.ejs", { bookListArray: bookList });
});

app.post("/compose", async (req, res) =>{
  const newBook = {
    id: ++idCount,
    title: req.body.bookTitle,
    image: await getBookCover(req.body.bookTitle),
    description: req.body.bookDescription
  };
  bookList.push(newBook);
  console.log(bookList);
  res.render("index.ejs", {
    title: newBook.title,
    image: newBook.image,
    description: req.body.bookDescription,
    bookListArray: bookList
  });
  //res.redirect("/");
});

app.get("/edit/:id" , (req, res) => {
  const bookId = parseInt(req.params.id);
  const book = bookList.find(b => b.id === bookId);
  if(!book){
      return res.status(404).send('Post not found');
  }
  res.render("edit.ejs", { book: book });
});

app.post("/edit/:id", (req, res) => {
  const bookId = parseInt(req.params.id);
  const bookIndex = bookList.findIndex(b => b.id === bookId);
  if (bookIndex === -1) {
      return res.status(404).send('Book not found');  
  }
  bookList[bookIndex].title = req.body.bookTitle;
  bookList[bookIndex].description = req.body.bookDescription;
  res.redirect('/');
});

app.post("/delete/:id", (req, res) => {
  const bookId = parseInt(req.params.id);
  const bookIndex = bookList.findIndex(b => b.id === bookId);
  if(bookIndex !== -1){
      bookList.splice(bookIndex, 1);
  }
  res.redirect("/");
});

async function getBookCover(title){
  const bookTitle = title;
  const result = await axios.get(`https://openlibrary.org/search.json?title=${bookTitle}`);
  const books = result.data.docs;
  const imageUrl = `https://covers.openlibrary.org/b/id/${books[0].cover_i}-L.jpg`;
  return imageUrl;
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});