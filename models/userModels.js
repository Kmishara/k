const mongoose=require('mongoose')
var plm = require('passport-local-mongoose');

const userSchema = mongoose.Schema({
    username:String,
    email: String,
    contact: String,
    playlist:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:'playlist'
    }
],
    liked:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:'playlist'
    }],
    profileimage:
    {
        type:String,
        default:'/images/def.png',
    },
    isAdmin:{
        type:Boolean,
        default:false,
    }

})
userSchema.plugin(plm);
module.exports = mongoose.model('user', userSchema)