require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set("view engine","ejs");

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());

app.use(passport.session());


mongoose.connect("mongodb+srv://admin-habibie:"+process.env.PASS+"@cluster0.ilue1.mongodb.net/myThought?retryWrites=true&w=majority");
// mongoose.set("useCreateIndex",true);

const schema = new mongoose.Schema({
  username : String,
  password : String,
  story : [{
    writer: String,
    title: String,
    content : String,
    date : String
  }
  ]
});

schema.plugin(passportLocalMongoose);

const myThought = mongoose.model("myThought", schema);
passport.use(myThought.createStrategy());
//
// passport.serializeUser(myThought.serializeUser());
// passport.deserializeUser(myThought.deserializeUser());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  myThought.findById(id, function(err, user) {
    done(err, user);
  });
});

var currentDate = new Date();
var dateString = currentDate.getDate()+"/"+(currentDate.getMonth()+1)+"/"+currentDate.getFullYear();


app.get("/",function(req,res){
  
  if (req.isAuthenticated()){
    res.redirect("/home");
  } else{
    res.redirect("/login");
  }


})
app.get("/login", function(req, res) {
  if (req.isAuthenticated()){
    res.redirect("/home");
  } else{
    res.render("login");
  }
});

app.post("/login", function(req, res) {
  // myThought.findOne({userName: req.body.email},function(err,docs){
  //   if(err){
  //     console.log(err);
  //     authenticate = false;
  //     res.redirect("/login")
  //   } else if(docs){
  //     if(docs.password==req.body.password){
  //       authenticate = true;
  //       res.render("home",{data: docs.story});
  //     } else{
  //       authenticate = false;
  //       res.redirect("/login");
  //     }
  //   } else{
  //     authenticate = false;
  //     res.redirect("/login");
  //   }
  //
  // });


  const user = new myThought({
    username : req.body.username,
    password : req.body.password
  });

  req.login(user, function(err){
    if(err){
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req,res, function(err){
        if(err){
          res.redirect("/");
        }else {res.redirect("/home");}
      });
    }
  });


});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/home", function(req,res){
  if(req.isAuthenticated()){
    myThought.findOne({username:req.user.username},function(err,docs){
      var story = docs.story;
      res.render("home", {story:story});
    })
    
  } else{
    res.redirect("/login");
  }
});

app.post("/register", function(req, res) {
  // if (req.body.password != req.body.repassword) {
  //
  //   res.send('<script>alert("your password is not match")</script>');
  // } else{
  //   const newThought = new myThought({
  //     userName: req.body.email,
  //     password : req.body.password
  //   });
  //   newThought.save(function(err){
  //     if(err){
  //       console.log(err);
  //     } else{
  //       res.render("home");
  //     }
  //   });
  //
  // }
  
  myThought.register({username: req.body.username}, req.body.password, function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req,res,function(){
        res.redirect("/home");
      });
    }
  });

});

app.get("/compose", function(req,res){
  if (req.isAuthenticated()){
    res.render("compose");
  } else {
    res.redirect("/");
  }
  
});

app.post("/compose", function(req,res){
  const filter = {username : req.user.username};
  
  myThought.findOne(filter,function(err,docs){
    if(err){
      console.log(err);
    } else {
      var storyList = docs.story;
      storyList.push({title: req.body.title, content : req.body.content, date: dateString});
      const update = {story : storyList};
      myThought.findOneAndUpdate(filter,update, function(err){
        if(err){
          console.log(err);
        } else {
          console.log("success");
          res.redirect("/home");
        }
      });
    }
  });
});

app.get("/logout",function(req,res){
  req.logOut();
  res.redirect("/");

})

app.post("/deletePost",function(req,res){
  
  myThought.updateOne(
    { 'username': req.user.username}, 
    { $pull: { story: { _id: req.body.button } } }, function(err){
      if(err){
        console.log(err);
      } else{
        res.redirect("/home");
      }
    }
);

})

app.get("/note/:post",function(req,res){
  if(req.isAuthenticated()){
    myThought.findOne({username:req.user.username},function(err,docs){
      if(err){
        console.log(err);
      } else{
        if(docs){
          var idx = docs.story.findIndex(x => x._id==req.params.post);
        
        var storySelected = docs.story[idx];
        res.render("note",{storySelected:storySelected});
        } else{
          console.log("username tidak ada");
        }
        

      }    
    })
    
  } else {
    res.redirect("/");
  }
});




app.listen(process.env.PORT||3000, function() {
  console.log("listening on 3000");
});
