import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "Parthk@1e",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

async function checkVisisted(currentUserId) {
  const result = await db.query(
    "SELECT country_code FROM visited_countries WHERE user_id=$1",
    [currentUserId]
  );
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  console.log(countries);
  return countries;
}

async function userActive(currentUserId) {
  const result = await db.query("SELECT * FROM users");
    users = result.rows;
    const selecetdUser = users.find((item) => item.id == currentUserId);
    return selecetdUser;
}

app.get("/", async (req, res) => {
  const countries = await checkVisisted(currentUserId);
  const selecetdUser= await userActive(currentUserId);
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: selecetdUser.color,
  });
});

app.post("/add", async (req, res) => {
  const input = req.body.country;
  const selecetdUser= await userActive(currentUserId);

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name)= $1 ;",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1,$2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
      const countries = await checkVisisted(currentUserId);

      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        users: users,
        color: selecetdUser.color,
        error: "Country has already been added, try again.",
      });
    }
  } catch (err) {
    console.log(err);
    const countries = await checkVisisted(currentUserId);
    
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: selecetdUser.color,
      error: "Country name does not exist, try again.",
    });
  }
});
app.post("/user", async (req, res) => {
  if (req.body.user) {
    currentUserId = req.body.user;
    res.redirect("/");
  } else {
    res.render("new.ejs");
  }
});

app.post("/new", async (req, res) => {
  try {
    const idSelected = await db.query(
      "INSERT INTO users (name,color) VALUES ($1,$2) RETURNING id",
      [req.body.name, req.body.color]
    );
    currentUserId = idSelected.rows[0].id;
    res.redirect("/");
  } catch (err) {
    console.log(err);
    const countries = await checkVisisted(currentUserId);
    const result = await db.query("SELECT * FROM users");
    users = result.rows;
    const selecetdUser = users.find((item) => item.id == currentUserId);
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: selecetdUser.color,
      error: "Please enter a new family member name",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
