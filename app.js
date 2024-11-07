const express = require('express');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const dbFile = './database/app.db';

// Check if the database file exists
if(fs.existsSync(dbFile)) {
  fs.unlinkSync(dbFile);
} 
const db = new Database(dbFile);

const query = `
    create table users (
      username text,
      password text
    )
  `;
db.exec(query);

const query2 = `
    create table posts (
      id integer primary key autoincrement,
      post text not null
    )
  `;
db.exec(query2);

const app = express();

app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname + "/styles"));
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  res.render("homepage.ejs");
});

app.get('/posts', (req, res) => {
 const posts = db.prepare('select post from posts').all();
 res.render("posts.ejs", {posts: posts});
});

app.post('/save-post', (req, res) => {

  let input = req.body.xssInput;
  const notSafe = req.body.xssUnSafe;

  if(!notSafe) {
    input = input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
  }

  db.prepare('Insert into posts (post) values (?)').run(input);

  res.redirect('/');
});

app.post('/clear-posts', (req, res) => {
  db.prepare('drop table posts').run();
  db.prepare('create table posts (id integer primary key autoincrement, post text not null)').run();
  res.redirect('/');
});

app.get('/useres', (req, res) => {
  const users = db.prepare('select * from users').all();
  res.render("users.ejs", {users: users});
});

app.post('/save-user', (req, res) => {
  let username = req.body.usernameInput;
  let password = req.body.passwordInput;
  let notSafe = req.body.dataUnSafe;

  if(!notSafe) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, (err, hash) => {
        db.prepare('Insert into users (username, password) values (?, ?)').run(username, hash);
        res.redirect('/');
      });
    });
  } else {
    db.prepare('Insert into users (username, password) values (?, ?)').run(username, password);
    res.redirect('/');
  }
  
});

app.post('/clear-users', (req, res) => {
  db.prepare('drop table users').run();
  db.prepare('create table users (username text, password text)').run();
  res.redirect('/');
});

app.listen(3000, () => {
   console.log('Server started on port 3000');
 });