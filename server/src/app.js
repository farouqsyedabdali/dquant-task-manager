const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

const taskRoutes = require('./routes/taskRoutes')

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.use('/tasks', taskRoutes)

module.exports = app
