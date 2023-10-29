require("dotenv").config()
const express =          require('express')
const bodyParser =       require('body-parser')
const multer =           require('multer')
const connection =       require('./helper/mysqldb_conn')
const path =             require("path")
const acc =              require("./controller/acccount")
const mv =               require('./controller/movies')
const session =          require('express-session')
const flush =            require('connect-flash')

const diskStorage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'public/movie_cover/')
    },
    filename: function(req, file, cb){
        cb(null, file.originalname.split('.')[0] + Date.now() + '.' + file.originalname.split('.')[1])
    }
})

const upload = multer({storage: diskStorage})
const app =    express()

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))
app.use(flush())
app.use(express.static(path.join(__dirname, "public")))
app.set("view engine", "ejs")

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

app.use(acc)
app.use(mv)

app.get('/', function(req, res){
    let query = "Select * from movies"
    connection.query(query, function(err, result){
        if(err){
            res.render("index",{message: 'We can\'t fetch movies', error: err})
        }{
            res.render("index",{message: "Object successfully fetched", result: result})
        }
    })
})

app.get('/movies', (req, res) => {
    let query = "Select * from movies"
    connection.query(query, function(err, result){
        if(err){
            res.render("list",{message: 'We can\'t fetch movies', error: err})
        }{
            res.render("list",{message: "Object successfully fetched", result: result})
        }
    })
})

app.get('/movie/:id', (req, res) => {
    let query = "Select * from movies where id = ?"
    connection.query(query, req.params.id ,function(err, result){
        if(err){
            res.render("details", {message: 'We can\'t fetch movies', error: err})
        }{
            if(result.length == 0){
                res.render("details", {message: 'We can\'t fetch movies', error: "Id doesn't exist", result: result[0]})
            }else{
                res.render("details", {message: "Object successfully fetched", result: result[0]})
            }
        }
    })
})
app.get('/delete/:id', (req, res) => {
    let sql = "DELETE FROM movies where id = ?"
    connection.query(sql, req.params.id, function(err, result){
        if(err){
            res.render("list", {message: 'Object is not deleted', error: err})
        }{
            res.render("list", {message: "Object successfully deleted", result: result})
        }
    })
})

app.get('/update/:id', upload.none(), async (req, res) => {
    data = req.body
    let sql = "SELECT * FROM movies WHERE id = ?"
    connection.query(sql, req.params.id, function(err, result){
        if(err){
            res.send({message: 'Object is not updated or inserted', error: err})
        }else{
            if(result.length == 0){
                let find_id = 100;
                let sql = "INSERT  INTO movies (id, name, type, year) VALUES (?, ?, ?, ?)"
                connection.query("SELECT MAX(id) as id FROM movies" , function(err, result){
                    find_id = result[0].id === null ? 100 : result[0].id + 1
                })
                if(data.name && data.year && data.type){
                    connection.query(sql, [req.params.id, data.name, data.type, data.year], function(err, result){
                        if(err){
                            res.send({message: 'Object is not inserted', id: find_id, error: err})
                        }else{
                            res.send({message: "Object successfully inserted", result: result})
                        }
                    })
                }else{
                    res.send({message: 'Please provide all details'})
                }
            }else{
                if(data.name && data.year && data.type){
                    let sql = "UPDATE movies SET name = ?, type = ?, year = ? WHERE id = ?"
                    connection.query(sql, [data.name, data.type, data.year, req.params.id], function(err, result){
                        if(err){
                            res.send({message: 'Object is not updated', error: err})
                        }{
                            res.send({message: "Object successfully updated", result: result})
                        }
                    })
                }else{
                    res.send({message: 'Please provide all details'})
                }
            }
        }
    })
})
app.post('/create', upload.none(), (req, res) => {
    form_data = req.body
    file = req.file

    if(form_data.title && form_data.date && form_data.genre ){
        connection.query("SELECT MAX(id) as id FROM movies" , function(err, result){
            let find_id = result[0].id === null ? 100 : result[0].id + 1
            
            let sql = "INSERT  INTO movies (id, title, genre, price, date, poster) VALUES (?, ?, ?, ?, ?)"
            connection.query(sql, [find_id, form_data.title, form_data.genre, form_data.price, form_data.date, file.filename], function(err, result){
                if(err){
                    res.render("upload_movie", {message: 'Movie is not inserted', id: find_id, error: err})
                }else{
                    res.render("index", {message: "Movie successfully inserted", result: result})
                } 
            })
        })
    }else{
        req.flash('success', 'Movie is not inserted')
        req.flash('error', 'Please provide all details')
        res.redirect("upload")
    }
})
app.get('/login', function(req, res){
    res.render("login", {message: req.flush("success")})
})
app.post("/login", upload.none(), (req, res) => {
   let data = req.body
   let sqlQuery = "SELECT * FROM users WHERE email= ? and password= ?"
   connection.query(sqlQuery, [data.email, data.password], function(err, results){
    if(err){
        res.redirect(login)
    }else{
        if(results.length >= 1){
            req.session.userId = results[0].id
            req.session.full_name = results[0].full_name
            req.flush("success", "User successfully logged in")
            req.flush("success", "Please find your suitable video from the list")
            res.redirect("movies")
        }else{
            req.flush("error", "User Doesn't logged in")
            req.flush("success", "Please find your suitable video from the list")
            res.redirect("login")
        }
    }
   })
//    connection.query(sqlQuery, [data.email, data.password], function(err, result){
//         if(!err){
//             if(result[0] >= 1){
//                 res.session.user = result
//                 res.json({dud: result + "sucesss"})
//                 res.json({dud: 'movies'})
//             }else{
//                 res.json({dud: "user doesnt find"})
//                 res.json({dud: 'login'})
//             }
//         }else{
//             res.json({dud: data.email})
//             res.json({dud: data.password})
//             res.json({dud: result})
//         }
//    })
   
})
app.get('/register', function(req, res){
    res.render("register")
})

app.post("/register", (req, res) => {
    let data = req.body
    let sqlQuery = "INSERT INTO users(full_name, email, password) values('" + data.full_name + "', '"+ data.email+ "', '"+ data.password+"')"
    connection.query(sqlQuery, function(err, result){
        if(!err){
            res.redirect(200, "movies")
        }else{
            res.redirect('register')
        }
    })
 })

app.get('/upload', function(req, res){
    res.render("upload_movie")
})

app.get('/admin/list_movies', (req, res) => {
    res.redirect('/movies')
})


app.use((req, res, next) => {
    res.render("404")
});

app.listen(3000, function(err){
    console.log("http://127.0.0.1:3000")
})
