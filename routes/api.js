var express = require('express');
var router = express.Router();
var mongoose = require('mongoose')
var bodyParser = require('body-parser')
/* GET home page. */

// 'mongodb://localhost/geoShout'
let mongoURL = process.env.mongoConnectString
if(!mongoURL){
    console.log("using default mongodb://mongo url")
    mongoURL = "mongodb://mongo"
}
var db = mongoose.connect(mongoURL);
db.connection.on('error',(e)=>{log('error','mongoose connect error:'); log('error',e)});
db.connection.once('open',()=>{log('info','mongoose connection successful')});

let SHOUT_EXPIRE_TIME_SECONDS = 60*1

function log(...s){
    console.log(s)
}

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


var shoutSchema = new mongoose.Schema({
    message: {type: String, required: 'message is required'},
    location: { 
		type: [Number],
		index: '2dsphere'
    },
    createdAt: { type: Date, expires: SHOUT_EXPIRE_TIME_SECONDS, default: Date.now }
})

var Shout  = mongoose.model('Shout',shoutSchema);




router.post('/',bodyParser.json(),(request,response)=>{
    let body = request.body
    let dataBody = body.body
    switch(body.method){
        case "echo":
            response.json({
                "echoedBody":body
            })
            return;
        break;
        case "createShout":
            console.log("creating shout",dataBody.shoutData)
            let newShout=new Shout({
                message: dataBody.shoutData.message,
                location: dataBody.shoutData.location
                
            })
            newShout.save()
            .then((msg)=>{
                console.log("save successful")
            })
            .catch((error)=>{
                console.log("error saving",error)
            })
            


            response.json({
                "response_status":0,
                "echoedBody":body
            })

            return;
        break;

        case "getShoutsNear":

            Shout.geoNear(
                dataBody.location,
                {
                    spherical:true,
                    num:15
                }
            ) 
            .then((data)=>{
                console.log("type is ",typeof(data))
                response.json({
                    response_status:0,
                    data:data.map((d)=>{
                        return {
                            message:d.obj.message,
                            location:d.obj.location,
                            _id:d.obj._id

                        }
                    })
                })
            })
            
            return;
            break;
    }    
});

module.exports = router;
