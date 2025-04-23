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

let bookList = [];

app.get("/about", (req, res) => {
  res.render("about.ejs")
}); 

app.get("/contact", (req, res) => {
  res.render("contact.ejs")
}); 

app.get("/", async (req, res) => {
  try{
    const result = await db.query("SELECT * FROM books");
    bookList = result.rows;
  } catch(err){
    console.log(err);
  }
  res.render("index.ejs", { bookListArray: bookList });
});

app.post("/add", async (req, res) =>{
  const newBook = {
    title: req.body.bookTitle,
    image: await getBookCover(req.body.bookTitle),
    description: req.body.bookDescription
  };
  try{
    await db.query("INSERT INTO books (title, image, description) VALUES ($1, $2, $3)", [newBook.title, newBook.image, newBook.description]);
    res.redirect("/");
  } catch(err){
    console.log(err)
  }
});

app.get("/edit/:id" , (req, res) => {
  const bookId = parseInt(req.params.id);
  const book = bookList.find(b => b.id === bookId);
  if(!book){
      return res.status(404).send('Post not found');
  }
  res.render("edit.ejs", { book: book });
});

app.post("/edit/:id", async (req, res) => {
  const bookId = parseInt(req.params.id);
  const bookIndex = bookList.findIndex(b => b.id === bookId);
  if (bookIndex === -1) {
      return res.status(404).send('Book not found');  
  }
  const newTitle = req.body.bookTitle;
  const newDescription = req.body.bookDescription;
  try{
    await db.query("UPDATE books SET title = $1, description = $2 WHERE id = $3", [newTitle, newDescription, bookId]);
    res.redirect("/");
  } catch(err){
    console.log(err);
  }
});

app.post("/delete/:id", async (req, res) => {
  const bookId = parseInt(req.params.id);
  const bookIndex = bookList.findIndex(b => b.id === bookId);
  if(bookIndex === -1){
    return res.status(404).send('Book not found');  
  }
  try{
    await db.query("DELETE FROM books WHERE id = $1", [bookId]);
    res.redirect("/");
  }catch(err){
    console.log(err);
  }
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