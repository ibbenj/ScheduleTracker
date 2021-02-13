const express = require("express")

const app = express()

app.get("/", (req, res) => {
    res.json({a:"4"})
})

app.listen(8080)

/*



*/