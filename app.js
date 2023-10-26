const express =    require('express')
const bodyParser = require('body-parser')
const multer =     require('multer')
const connection = require('./helper/mysqldb_conn')
const path =       require("path")
const acc =        require("./controller/acccount")
const mv =         require('./controller/movies')

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
app.post('/create', upload.single('cover'), async (req, res) => {
    form_data = req.body
    file = req.file

    if(form_data.name && form_data.year && form_data.type && file){
        connection.query("SELECT MAX(id) as id FROM movies" , function(err, result){
            let find_id = result[0].id === null ? 100 : result[0].id + 1
            
            let sql = "INSERT  INTO movies (id, name, type, year, cover) VALUES (?, ?, ?, ?, ?)"
            connection.query(sql, [find_id, form_data.name, form_data.type, form_data.year, file.filename], function(err, result){
                if(err){
                    res.render("upload", {message: 'Movie is not inserted', id: find_id, error: err})
                }else{
                    res.render("list", {message: "Movie successfully inserted", result: result})
                }
            })
        })
    }else{
        res.render("upload",{message: 'Movie is not inserted', id: find_id, error: err})
    }
})
app.get('/login', function(req, res){
    res.render("login")
})

app.get('/register', function(req, res){
    res.render("register")
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
