if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require('express')
const app = express()
const port = 3000
const cors = require('cors')
const Controller = require('./controllers/controller')

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.post('/login', Controller.login)
app.get('/questions', Controller.getQuestion)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
