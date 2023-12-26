const mongoose=require('mongoose')
const playlistShema = mongoose.Schema({
    name:{
        type: String,
        required:true
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'user',
        required: true,
    },
    poster:{
        type: String,
        default: '/images/def.png',
    },
    songs:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:'song'
        }
    ]
})
module.exports = mongoose.model('playlist', playlistShema)