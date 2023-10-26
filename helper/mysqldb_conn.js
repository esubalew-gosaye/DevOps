const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database:'node'
});

// connection.connect(function(err){
//     if(err){
//         console.log(err);
//     }else{
//         console.log('\x1b[40m', 'INFO - Connected to mysql db');
//     }
// });

module.exports = connection;