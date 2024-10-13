var express = require('express');
var router = express.Router();
var users = require('../models/userModels');
var sonModel = require('../models/songModel');
var playlistModel = require('../models/playlistModel');
var passport = require('passport');
var localStrategy = require('passport-local');
 var multer = require('multer')
 var id3 = require('node-id3')
 var crypto = require('crypto')
 const { Readable } = require('stream')
 passport.use(new localStrategy(users.authenticate()))
const mongoose = require('mongoose');
const songModel = require('../models/songModel');
const userModels = require('../models/userModels');

mongoose.connect('mongodb+srv://pawarharsh191:harsh123@cluster0.bq00w.mongodb.net/khushi').then(() => {
  console.log('connected to database')
}).catch(err => {
  console.log(err)
})

const conn = mongoose.connection

var gfsBucket, gfsBucketPoster
conn.once('open', () => {
  gfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'audio'
  })
  gfsBucketPoster = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'poster'
  })
})

/* GET home page. */

/* user authentication routes */

router.post('/register', (req, res, next) => {



  var newUser = {
    //user data here
    username: req.body.username,
    email: req.body.email
    //user data here
  };
  users
    .register(newUser, req.body.password)
    .then((result) => {
      passport.authenticate('local')(req, res, async () => {

        const songs= await songModel.find()
        const defaultplaylist = await playlistModel.create ({
          name:req.body.username,
          owner: req.user._id,
          songs: songs.map(song => song.id)

        })
        console.log(songs.map(song => song.id))
        const newUser = await userModels.findOne({
          _id: req.user._id
        })

       newUser.playlist.push(defaultplaylist._id)
       await newUser.save() 

        
        
        res.redirect('/');
      });
    })
    .catch((err) => {
      res.send(err);
    });
});



router.get('/auth', (req, res, next) => {
  res.render('register')
})
router.post(
  '/auth',
 passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/auth',
  }),
  (req, res, next) => { } 
);

router.get('/logout', (req, res, next) => {
  if (req.isAuthenticated())
    req.logout((err) => {
      if (err) res.send(err);
      else res.redirect('/');
    });
  else {
    res.redirect('/');
  }
});
function isloggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  else res.redirect('/auth');
}

function isAdmin(req,res,next){
  if(req.user.isAdmin) return next()
  else return res.redirect('/')
//next represent the function after req,res,next admin ko database se he true krna hoga
}
/* user authentication routes */

router.get('/',isloggedIn, async function(req, res, next) {
  console.log(req.user)
  const currentUser = await userModels.findOne({
    _id: req.user._id
  }).populate('playlist').populate({
    path:'playlist',
    populate:{
      path:'songs',
      model:'song'
    }
  })
  res.render('index', {currentUser});
});

router.get('/poster/:posterName' , (req,res,next)=>{
  gfsBucketPoster.openDownloadStreamByName(req.params.posterName).pipe(res)
  console.log(req.params.posterName);
})
const storage = multer.memoryStorage()
 const upload = multer({ storage: storage })

 
 router.post('/uploadMusic',isloggedIn,upload.array('song') , async (req, res, next) => {
  // console.log(req.file)
// req.file nhut sara file ko upload krta h default
  await Promise.all(req.files.map(async file=>{

 
  const randomName = crypto.randomBytes(20).toString('hex')

  const songData = id3.read(file.buffer)

  Readable.from(file.buffer).pipe(gfsBucket.openUploadStream(randomName))
  Readable.from(songData.image.imageBuffer).pipe(gfsBucketPoster.openUploadStream(randomName + 'poster'))
  await songModel.create({
    title: songData.title,
    artist: songData.artist,
    album: songData.album,
    //console.log(req.file)
    size:file.size,
    poster: randomName + 'poster',
    filename: randomName
  })
}))
  res.send('songs uploaded')
});
 //press shift key to select multiple song
router.get('/uploadMusic', isloggedIn ,(req,res,next) => {
  res.render('uploadMusic')
})

router.get('/stream/:Musicname', async (req,res,next)=>{
    const currentsong = await sonModel.findOne({
    filename:req.params.Musicname
})

console.log(currentsong);

   const stream =  gfsBucket.openDownloadStreamByName(req.params.Musicname)
   //--------- set the response headers for the media -------  control speed-------------//
    res.set('Content-Type', 'audio/mpeg'); 
    res.set("Content-Length", currentsong.size + 1)
    res.set('Content-Ranges','bytes')
    res.set('Content-Range',`bytes ${0}-${currentsong.size - 1}/${currentsong.size}`)
    res.status(206)
   
    stream.pipe(res);
 })
   router.get('/search', (req,res,next)=>{
res.render('search')
   })


  router.post('/search',async (req,res,next)=>{
   const songmusic = await songModel.find({
    title: { $regex: req.body.search}
   })
   res.json({
    songs: songmusic
   })
  })
module.exports = router; 


//   res.set('Content.Type','audio/mpeg') 
  //(kon sa content bhej rhe h bk s )
  //  res.set('Content.Length', currentsong.size + 1)
  //(size bhejta h + 1 is liye qki vo hme  btata h package khtm ho gya h ye empty )
  //   res.set('Content.Ranges','byte')
  //   res.set('Content.Range','bytes 0 - ${currentsong.size - 1}/${currentsong.size}')
  //  kaha se kaha tk ka packet
  //   res.status(206)
  // pura content nhi bheja ek partial part bheja h 