const cookieParser=require('cookie-parser');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const app = express();
const port = 6789;

const fs = require('fs')
const session = require('express-session');
var db;
var sqlite3=require('sqlite3');
app.use(cookieParser());

// directorul 'views' va conține fișierele .ejs (html + js executat la server)
app.set('view engine', 'ejs');
// suport pentru layout-uri - implicit fișierul care reprezintă template-ul site-ului este views/layout.ejs
app.use(expressLayouts);
// directorul 'public' va conține toate resursele accesibile direct de către client (e.g., fișiere css, javascript, imagini)
app.use(express.static('public'))
// corpul mesajului poate fi interpretat ca json; datele de la formular se găsesc în format json în req.body
app.use(bodyParser.json());
// utilizarea unui algoritm de deep parsing care suportă obiecte în obiecte
app.use(bodyParser.urlencoded({ extended: true }));
// la accesarea din browser adresei http://localhost:6789/ se va returna textul 'Hello World'/re/ proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res
app.use(session({
   secret:'random string',
   resave:false,
   saveUninitialized:false,
}));
app.get('/', (req, res) => {
   res.clearCookie('mesajEroare');
	var jocuri = null;
	const sqlite3 = require('sqlite3').verbose();

// Create a connection to the SQLite database
const db = new sqlite3.Database('cumparaturi.db');

// Query the table and retrieve the data
db.all('SELECT * FROM jocuri', function (error, rows) {
  if (error) {
    console.error(error);
    // Handle the error appropriately (e.g., render an error page)
  } else {
    // Pass the retrieved data to the EJS template
    res.render('index', { jocuri: rows,"session":req.session });
  }

  // Close the database connection
  db.close();
});

	
	
});
app.get('/autentificare', (req, res) => {
   res.clearCookie('err')
   res.render('autentificare', {"err":req.cookies.err, "session":req.session, layout: 'autentificare'})
});

app.post('/verificare-autentificare', (req,res)=>{
   fs.readFile('res/utilizatori.json', (err, data) => {
   var user = JSON.parse(data).find(it=>it.user == req.body.user)
   if(user == undefined){
      res.cookie("err", "Username gresit!")
      res.redirect('../autentificare')
   }else if(user.pass == req.body.pass){
      req.session.user = req.body.user
      res.redirect('../')
   }else{
      res.cookie("err", "Parola gresita!")
      res.redirect('../autentificare')
   }
   });
});
app.get('/delogare', (req, res) => {

   delete req.session.user
   res.redirect('..')
});
app.get('/creare-bd', (req, res) => {
	db = new sqlite3.Database('cumparaturi.db', (err) => {
		if (err) throw err;
			  
			db.serialize(() => {
					// Create the 'jocuri' table if it doesn't exist
				db.run(
					  'CREATE TABLE IF NOT EXISTS jocuri (id INTEGER PRIMARY KEY AUTOINCREMENT, nume TEXT UNIQUE, pret REAL)',
				(err) => {
				if (err) throw err;
				console.log('Tabela "jocuri" a fost creată cu succes sau deja există.');
			  
						// Add some random game records to the table
				const games = [
				{ id: 1, nume: 'God of WAR', pret: 70.0 },
				{ id: 2, nume: 'Elden Ring', pret: 70.0 },
				{ id: 3, nume: 'Just Cause 4', pret: 20.0 }
				];
            const insertQuery = 'INSERT OR IGNORE INTO jocuri (id, nume, pret) VALUES (?, ?, ?)';
				games.forEach((game) => {
				db.run(insertQuery, [game.id, game.nume, game.pret], function (err) {
					if (err) throw err;
					if (this.changes > 0) {
					console.log(`Jocul "${game.nume}" adăugată cu succes.`);
					} else {
					console.log(`Jocul "${game.nume}" deja există în tabel.`);
					}
					});
						});
			  
			  
						res.redirect('/');
					  }
					);
				  });
				});
			  });
       
         
           app.get('/inserare-bd', (req, res) => {
            db = new sqlite3.Database('cumparaturi.db', (err) => {
               if (err) throw err;
               db.serialize(() => {
              // Connect to the database server and open a connection to the database
               console.log('Conexiunea la baza de date a fost realizată cu succes.'); 
               // Insert multiple games into the 'jocuri' table
               const games = [
                 { id: 4, nume: 'Wallpaper Engine', pret: 17 },
                 { id: 5, nume: 'Osu', pret: 10 }
                 
               ];
           
               const insertQuery = 'INSERT INTO jocuri (id, nume, pret) VALUES (?, ?, ?)';
               games.forEach((game) => {
                 db.run(insertQuery, [game.id, game.nume, game.pret], (err) => {
                  if (err) throw err;
                  console.log(`game-ul "${game.nume}"a fost inserat cu succes.`);
                 });
               });
           
               // Close the database connection
               db.close((err) => {
                 if (err) throw err;
                 console.log('Conexiunea cu baza de date a fost închisă.');
           
                 // Redirect the client to "/"
                 res.redirect('/');
               });
              });
            });
           });
         
// la accesarea din browser adresei http://localhost:6789/chestionar se va apela funcția specificată
app.get('/chestionar', (req, res) => {
   fs.readFile("res/intrebari.json", (err, data) => {
     let param = JSON.parse(data)
     param.session = req.session
     res.render('chestionar', param);
   });
  });
  app.post('/rezultat-chestionar', (req, res) => {
   fs.readFile("res/intrebari.json", (err, data) => {
      let correct = 0
      let date = JSON.parse(data);
      for(let i = 0; i<date.intrebari.length; i++){
         if(req.body[i] == date.intrebari[i].corect){
            correct++;
         }
      }
      date.corecte = correct;
      date.session = req.session
      res.render('chestionar', date);
    });
});

app.get('/vizualizare-cos', (req, res) =>{
	
	res.render('vizualizare-cos', {bauturi:req.session.cos_cumparaturi,"session":req.session});
});

app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:`));