const express = require("express")
const app = express()

const router = express.Router()

app.get("/store", (req, res) => {
    res.send({"__dir__": "This is our movie store."})
})

module.exports = router