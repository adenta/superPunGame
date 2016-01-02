// =======================
// get the packages we need ============
// =======================
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config.js'); // get our config file
var Flickr = require('flickr').Flickr;
var client = new Flickr(config.flickrConnect.api, config.flickrConnect.secret);
var User = require('./app/models/user'); // get our mongoose model
var Room = require('./app/models/room'); // get room model.
var crypto = require('crypto'),
  algorithm = 'aes-256-ctr',
  password = 'd6F3Efeq';
var cors = require('cors');

 var corsOptions = {
   origin: 'http://puns.denta.co'
 };
// =======================
// configuration =========
// =======================

var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
mongoose.connect(config.db.database); // connect to database
app.set('superSecret', config.db.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/view'));
// use morgan to log requests to the console
app.use(morgan('dev'));
app.use(cors());





//function encrypts a piece of text, and calls another function.
function encrypt(text, callback) {
  try {
    var cipher = crypto.createCipher(algorithm, password)
    var crypted = cipher.update(text, 'utf8', 'hex')
    crypted += cipher.final('hex');
    console.log("encrypted: " + text + " as " + crypted);
  } catch (err) {
    callback(err, crypted);
  }
  callback(null, crypted);
}

//function decrypts a piece of text, and calls another function.
function decrypt(text, callback) {
  try {
    var decipher = crypto.createDecipher(algorithm, password)
    var dec = decipher.update(text, 'hex', 'utf8')
    dec += decipher.final('utf8');
  } catch (err) {
    callback(err, dec);
  }
  callback(null, dec);
}

// =======================
// routes ================
// =======================
// basic route
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/view/index.html');
});

app.get('/createUser', function(req, res) {
  res.sendFile(__dirname + '/view/createUser.html');
});

app.post('/setup', function(req, res) {
  console.log(req.body);
  // create a sample user
  encrypt(req.body.password, function(err, enc) {
    if (err)   console.log(err);
    var newUser = new User({
      name: req.body.name,
      password: enc,
      pun: "",
      first: req.body.first,
      last: req.body.last,
      phone: req.body.phone,
      score: 0
    });
    console.log(newUser);

    // save the sample user
    newUser.save(function(err) {
      if (err) {
        console.log(err);
        res.json({
          success: false,
          message: "Error: Name taken. Please try again."
        });
      } else {
        res.json({
          success: true,
          message: "User saved successfully!"
        });
      }
    });


  });

});
// API ROUTES -------------------
// we'll get to these in a second
// get an instance of the router for api routes
// API ROUTES -------------------

// get an instance of the router for api routes
var apiRoutes = express.Router();


// route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRoutes.post('/authenticate', function(req, res) {
  console.log("request from: " + req.body.name + req.body.password);
  // find the user
  User.findOne({
    name: req.body.name
  }, function(err, user) {
    console.log("found user: " + JSON.stringify(user));
    if (err) throw err;

    if (!user) {
      res.json({
        success: false,
        message: 'Authentication failed. User not found.'
      });
    } else if (user) {

      // check if password matches
      encrypt(req.body.password, function(err, enc) {
        if (err) {
          console.log(err);
        }

        if (enc != user.password) {
          res.json({
            success: false,
            message: 'Authentication failed. Wrong password.'
          });

        } else {
          console.log("user is verified.");
          // if user is found and password is right
          // create a token
          var token = jwt.sign({
            name: user.name
          }, app.get('superSecret'), {
            expiresInMinutes: 1440
          });
          console.log("token:" + token);
          // return the information including token as JSON
          res.json({
            success: true,
            message: 'Logged in!',
            token: token
          });
        }
      });
    }
  });
});
// route middleware to verify a token
apiRoutes.use(function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers[
    'x-access-token'];
  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {
      if (err) {
        return res.json({
          success: false,
          message: 'Failed to authenticate user.'
        });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.status(403).send({
      success: false,
      message: 'No user token provided.'
    });

  }
});

// route to show a random message (GET http://localhost:8080/api/)
apiRoutes.get('/', function(req, res) {
  res.json({
    message: 'logged in to API portal'
  });
});

apiRoutes.post('/roomInfo', function(req, res) {
  Room.findOne({}, function(err, room) {
    console.log("comparing: " + room.judge + " to " + JSON.stringify(req.body));

    if (room.judge == req.body.name) {

      User.find({}, function(err, users) {
        res.json({
          success: true,
          message: "Logged in as Admin.",
          view: "admin",
          contents: users,
          room: room
        });
        console.log(JSON.stringify(room));
      });

    } else {
      User.findOne({name:req.body.name},function(err,user){
        res.json({
          success: true,
          message: "Logged in as Player.",
          view: "public",
          room: room,
          score: user.score
        });
      });
    }
  });
});

// route to return all users (GET http://localhost:8080/api/users)
apiRoutes.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});

apiRoutes.post('/submitPun', function(req, res) {
  User.findOne({
    name: req.body.name
  }, function(err, toUpdate) {
    if (err) {
      res.json({
        success: false,
        message: "Serve side Error.",
        status: "error: " + err
      });
    }
    toUpdate.pun = req.body.pun;
    toUpdate.save(function(error) {
      if (error) {
        res.json({
          success: false,
          message: "Could not submit pun. Try again.",
          status: "failed to update: " + error
        });
      }
      res.json({
        success: true,
        message: "Pun Submitted!",
        status: "OK"
      });
    });
  });
});

apiRoutes.post('/selectWinner', function(req, res) {
  console.log(req.body);
  User.update(
    {score: {$gte: 0}},
    {$set: {pun: ""}},
    {multi: true},
    function(err, count) {
    if (err) console.log(err);

    console.log(count);
  });

  User.findOne({
    name: req.body.selectedName
  }, function(err, toUpdate) {
    if (err) {
      res.json({
        success: false,
        message: "Could not select winner. Try again.",
        status: "error: , message:" + err
      });
    }
    toUpdate.score++;
    toUpdate.save(function(error) {
      if (error) {
        res.json({
          success: false,
          message: "Could not select winner. Try again.",
          status: "failed to update: " + error
        });
      }
      Room.findOne({}, function(err, room) {
        if (err) {
          res.json({
            success: false,
            message: "Couldnt find your room. Try again.",
            status: err
          });
        }

        var flickr_params = {
          text: "caption contest",
          media: "photos",
          per_page: 500,
          page: 1,
          extras: "url_z"
        };
        client.executeAPIRequest("flickr.photos.search", flickr_params, false, function(err, result) {
          // Show the error if we got one
          if (err) {
            console.log("FLICKR ERROR: " + err);
            return;
          }

          // Do something with flicker photos
          User.findOneRandom(function(err, roomResult) {
            if (!err) {
              room.url = result.photos.photo[Math.floor(Math.random()*500)].url_z;
              room.judge = roomResult.name;
              console.log("new judge: " + roomResult.name);

              room.save(function(error) {
                if (error) {
                  res.json({
                    success: false,
                    message: "Couldnt get picture from flickr.",
                    status: "failed to update: " + error
                  })
                }

                console.log(roomResult);
                res.json({
                  success: true,
                  message: "Winner selected!",
                  status: "OK"
                });
              });
            }
          });
        });
      });
    });
  });
});

// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);
// =======================
// start the server ======
// =======================
app.listen(port);
console.log('Server live at port:' + port);
