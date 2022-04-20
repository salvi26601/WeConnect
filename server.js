const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const session = require("express-session");                                 //Level 5 Security
const passport = require("passport");                                       //Level 5 Security
const passportLocalMongoose = require("passport-local-mongoose");           //Level 5 Security

const app = express();
var myuser = "";
var other = "";
var collect = "";
var followcollect = "";
var countFollowers = 0;
var countFollowings = 0;
var flag = 0;

app.use(express.json());

const http = require('http').createServer(app);
const PORT = process.env.PORT || 3000;


app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set("view engine" , "ejs" );

app.use(session({                                                       //Level 5 Security - initialize session
    secret: "Our little secret.",
    resave: false,          
    saveUninitialized: false    
}));

app.use(passport.initialize());      // Level 5 Security - initialize passport
app.use(passport.session());         //Level 5 Security - deal passport with sessions

mongoose.connect("mongodb://localhost:27017/infoDB" , {useNewUrlParser:true , useUnifiedTopology:true});
//mongoose.set("useCreateIndex" , true);              //Level 5 Security


const userSchema = new mongoose.Schema({              //a collection to store all the registered users
    username: String,
    email: String,
    password: String,
    dob: String,
    gender: String,
});

userSchema.plugin(passportLocalMongoose);                      //Level 5 Security
const User = mongoose.model("User" , userSchema);             //create users collection

const blogSchema = new mongoose.Schema({                       //Schema to store each post of the users
    title: String,
    content: String,
    date: Date
});

const followSchema = new mongoose.Schema({                     //Schema to store the info of followers and followings of each user 
    follower_id: mongoose.ObjectId,
    followee_id: mongoose.ObjectId
});

const models=[];
const getModel = (collectionName , genuser) => {
    if(!(collectionName in models)) {
        models[collectionName] = mongoose.model(genuser+"Blog" , blogSchema);            //create a dynamic collection of posts of users
    }
    return models[collectionName];
}

const followermodels=[];
const followgetModel = (collectionName , genuser) => {
    if(!(collectionName in followermodels)) {
        followermodels[collectionName] = mongoose.model(genuser+"Follow" , followSchema);            //create a dynamic collection
    }                                                                                          //of followers and followings      
    return followermodels[collectionName];
}


passport.use(User.createStrategy());                                    //Level 5 Security
passport.serializeUser(User.serializeUser());                           //Level 5 Security - creates a cookie
passport.deserializeUser(User.deserializeUser());                       //Level 5 Security - destroys the cookie


//Socket feature to use
const io = require("socket.io")(http);                                  //Requiring socket.io package

io.on("connection" , function(socket){
    console.log("Connected");                                           //Setting the connection

    socket.on("message" , function(msg){
        socket.broadcast.emit("message" , msg);
    });
});

["/" , "/register"].forEach(function(path){
    app.get(  path , function(req , res){
        res.render("sign-up" , {sign: "register" , pageTitle: "Register"});
    });
});


app.get("/follow" , function(req , res){
    console.log("inside /follow"); 
    let myfollowCollection = followermodels[myuser.username+"Follow"];
    let status = new myfollowCollection({
        followee_id: other._id
    });
    status.save();

    
    myfollowCollection = followermodels[other.username+"Follow"];
    status = new myfollowCollection({
        follower_id: myuser._id 
    });
    status.save();
});

app.get("/login" , function(req , res){
    res.render("sign-up" , {sign: "login" , pageTitle: "Register"});
});

app.get("/createPost" , function(req , res){
    if(req.isAuthenticated()) {
        res.render("create-post" , {user: myuser , pageTitle: "Your Post"});
    } else {
        res.redirect("/");
    } 
});

app.get( "/profile" , function(req , res){
    if(req.isAuthenticated()) {

        let myfollowCollection = followermodels[myuser.username+"Follow"];
        myfollowCollection.countDocuments({followee_id: {$ne : null}} , function(err , count){
            if(err) {
                console.log(err);
            } else {
                
                countFollowings = count;
                console.log("countFollowings" + countFollowings);
            }
        });
        myfollowCollection.countDocuments({follower_id: {$ne : null}} , function(err , count){
            if(err) {
                console.log(err);
            } else {
                
                countFollowers = count;
                console.log("countFollowers" + countFollowers);
            }
        });
        collect = getModel(myuser.username+"Blog" , myuser.username).findOne({});
        collect.find({} , function(err , posts){
            res.render("profile" , {user: myuser , curruser: myuser , pageTitle: "Profile" , posts: posts , countFollowers: countFollowers , countFollowings: countFollowings});
        });
    } else {
        res.redirect("/");
    }
});

app.get("/profile/:id" , function(req , res){
    if(req.isAuthenticated()) {
        flag=0;

        User.findOne({_id: req.params.id} , function(err , result){
            if(err) {
                console.log(err);
            } else {
                other = result; 
                console.log("before flag=" + flag);
                let myfollowCollection = followermodels[myuser.username+"Follow"];
                console.log(myfollowCollection);
                myfollowCollection.findOne({followee_id: result._id} , function(err , result){
                    console.log("gotcha");
                    if(err) {
                        console.log(err);
                    } else {
                        flag=1;
                        console.log("after flag=" + flag);
                    }
                });
                
                followcollect = followgetModel(other.username+"Follow" , other.username).findOne({});
                console.log("inside /profile/id");
                console.log(followcollect);
                myfollowCollection = followermodels[other.username+"Follow"];
                myfollowCollection.countDocuments({followee_id: {$ne : null}} , function(err , count){
                    if(err) {
                        console.log(err);
                    } else {
                        
                        countFollowings = count;
                        console.log("countFollowings" + countFollowings);
                    }
                });
                myfollowCollection.countDocuments({follower_id: {$ne : null}} , function(err , count){
                    if(err) {
                        console.log(err);
                    } else {
                        
                        countFollowers = count;
                        console.log("countFollowers" + countFollowers);
                    }
                });             
                collect = getModel(result.username+"Blog" , result.username).findOne({});
                collect.find({} , function(err , posts){
                    console.log("rendering profile");
                    res.render("profile" , {user: myuser , curruser: result , pageTitle: result.username + "Profile" , posts: posts , flag: flag , countFollowers: countFollowers , countFollowings: countFollowings});
                });
            }
        });
    } else {
        res.redirect("/");
    }
});

app.get("/unfollow" , function(req , res){
    console.log("inside /unfollow");
});

app.get("/main" , function(req , res){
    if(req.isAuthenticated()) {                                       //render the main page only if the user is authenticated
        collect = getModel(myuser.username+"Blog" , myuser.username).findOne({});
        collect.find({} , function(err , posts){
            res.render("main" , {user: myuser , pageTitle: "Main" , posts: posts});
        });
    } else {
        res.redirect("/");
    }
});


app.get("/logout" , function(req , res){
    req.logout();
    res.redirect("/");
});

app.post("/getUsers" , async function(req , res){
    let payload = req.body.payload.trim();
    let search = await User.find({username: {$regex: new RegExp("^" + payload + ".*" , "i")}}).exec();

    search = search.slice(0,10);
    res.send({payload: search});
});

app.post("/register" , function(req , res){                   //Level 5 Security - Register route

    //myuser = req.body.username;

    const newUser = new User({                                 
        username: req.body.username,
        email: req.body.Email,                        
        dob: req.body.dateOfBirth,
        gender: req.body.gender,
    });
    
    myuser = newUser;

    User.register( newUser , req.body.password , function(err , user){
        if(err) {
            console.log(err);
            res.redirect("/");
        } else {
            passport.authenticate("local")(req , res , function(){     //Authenticating the user and setting the logged in session
                collect = getModel(myuser.username+"Blog" , myuser.username).findOne({});
                followcollect = followgetModel(myuser.username+"Follow" , myuser.username).findOne({});
                console.log("inside register");
                console.log(followcollect);
                res.redirect("/main");
            });
        }
    });
});


app.post("/login" , function(req , res){                             //Level 5 Security - Login route

    //myuser = req.body.username;

    const olduser = new User({
        username: req.body.username,
        password: req.body.password
    });

    myuser = olduser;

    req.login( olduser , function(err){
        if(err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req , res , function(){     
                collect = getModel(myuser.username+"Blog" , myuser.username).findOne({});
                followcollect = followgetModel(myuser.username+"Follow" , myuser.username).findOne({});
                console.log("inside login");
                console.log(followcollect);
                res.redirect("/main");
            });
        }
    });
});


app.post("/compose" , function(req , res){

    const mycollection = models[myuser.username+"Blog"];
    console.log(mycollection);

    const newpost = new mycollection({
        title: req.body.postTitle,
        content: req.body.postBody,
        date: Date.now()
    });

    if(req.isAuthenticated()) {
        newpost.save(function(err){
            if(err) {
                console.log(err);
            } else {
                console.log("New post saved");
                res.redirect("/main");
            }
        });
    }
});


http.listen(PORT , function(req , res){
    console.log(`Server listening on port ${PORT}`);
});