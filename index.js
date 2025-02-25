require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

// Define and Mount Middlewares
app.use(cors())
app.use(express.static('public'))
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}))

// Define Schema
const userSchema = new mongoose.Schema({
  username: {type: String, required: true},
})
const User = mongoose.model('User', userSchema)

const exerciseSchema = new mongoose.Schema({
  user_id: String,
  date: Date,
  duration: Number,
  description: String,
})
const Exercise = mongoose.model('Exercise', exerciseSchema)

// Homepage
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.route('/api/users').post(async(req, res) => {
  const userObj = new User({
    username: req.body.username
  })
  const user = await userObj.save()
  res.json(user)
}).get(async (req, res) => {
  const users = await User.find({}).select("_id username")
  if(!users) {
    res.json({msg:"no user found"})
  } else{
    res.json(users)
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;

  const user = await User.findById(id)

  if (user) {
    const exerciseObj = new Exercise({
      user_id: user._id,
      description,
      duration,
      date: date ? new Date(date) : new Date()
    })
    const exercise = await exerciseObj.save()
    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: new Date(exercise.date).toDateString()
    })
  } else {
    res.json({error: "User not found"})
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const searchItem = req.params._id
  const person = await User.findOne({_id:searchItem})
  let { to, from, limit } = req.query
  
  if (person !== null) {
    let dateObj = {}
    if(from) { dateObj['$gte'] = new Date(from) }
    if(to) { dateObj['$lte'] = new Date(to)}
    let filter = {user_id: person._id}
    if(from || to) {
      filter.date = dateObj
    }

    const exercises = await Exercise.find(filter).limit(+limit ?? 50)
    const log = exercises.map((e) => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString()
    }))

    const count = await Exercise.countDocuments({user_id: person._id})

    res.json({
      _id: person._id,
      username: person.username,
      count: count,
      log
    })
  } else {
    res.json({error: "Person not found"})
  }
})

// Connect Database
mongoose.connect(process.env.DATABASE_URI, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
}).then(()=> console.log('Server Started')).catch((err)=> console.err(err))

// Listen for requests
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
