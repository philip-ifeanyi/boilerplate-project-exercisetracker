require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

// Define and Mount Middlewares
app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: true}))

// Define Schema
const userSchema = new mongoose.Schema({
  username: {type: String, required: true},
})
const User = mongoose.model('User', userSchema)

const exerciseSchema = new mongoose.Schema({
  user_id: String,
  date: String,
  duration: String,
  description: String,
})
const Exercise = mongoose.model('Exercise', exerciseSchema)

// Homepage
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.route('/api/users').post(async(req, res) => {
  const user = new User({
    username: req.body.username
  })
  await user.save()
  res.json({_id:user._id, username: user.username})
}).get(async (req, res) => {
  const users = await User.find()
  if(!users) {
    res.json({msg:"no user found"})
  } else{
    res.json(users)
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const user = req.params._id;
  let { description, duration, date } = req.body;

  if(date === '') {
    date = new Date(Date.now())
    date = date.toDateString()
  }

  const person = await User.findOne({_id:user})

  if (person !== null) {
    const exercise = new Exercise({
      user_id: person._id,
      description,
      duration,
      date
    })
  
    await exercise.save()
    res.json({
      user_id: person._id,
      username: person.username,
      description,
      duration,
      date
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
