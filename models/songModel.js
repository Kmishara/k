const mongoose=require('mongoose')
const songShema = mongoose.Schema({
    title:String,
    artist:String,
    album:String,
    category:[
        {
            type:String,
            enum:['pinjabi','gujrati']
        }
    ],// enum m sirf vo save krwate jo hme dekhna hota,limit

    likes:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:'user'
    }],
    size:Number,

    poster:String,

    filename:{
        type:String,
        required:true,
    }

})

module.exports = mongoose.model('song', songShema)