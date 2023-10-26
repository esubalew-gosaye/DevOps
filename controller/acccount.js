const express = require("express")
const app = express()

const router = express.Router()

app.get("/forgot_password", (req, res) => {
    res.send({"__dir__": "Account password reset"})
})

module.exports = router