'use strict';


const mongoose = require('mongoose');


const date = new Date()

const replySchema = new mongoose.Schema({
  text:{type:String},
  delete_password:{type:String},
  created_on:{type:Date,default:date},
  bumped_on:{type:Date,default:date},
  reported:{type:Boolean,default:false},
})
const Reply = mongoose.model("Reply", replySchema)

const threadSchema = new mongoose.Schema({
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  created_on: { type: Date, default: date },
  bumped_on: { type: Date, default: date },
  reported: { type: Boolean, default: false },
  replies: { type: [replySchema] }, // You can define a separate schema for replies if needed
});
const Thread = mongoose.model('Thread', threadSchema);

const boardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  threads:{type:[threadSchema]} // Embed the Thread schema here

});
const Board = mongoose.model('Board', boardSchema);




module.exports = function (app) {
  
  app.route('/api/threads/:board')
  .get(async function(req,res){
  const {board} = req.params
  let boardData = await Board.findOne({ name: board });
  if (!boardData) {
  boardData = createBoard(board)
  }
  res.json(boardData.threads)
})
  .post(async function(req,res){
    const {board} = req.params
  const {text,delete_password} = req.body
   
  const newThread = new Thread({
    text: text,
    delete_password:delete_password,
    replies:[]
  })
  console.log("New thread created")
  let boardData =await Board.findOne({name: board})
  if(!boardData){
    boardData = new Board({name:board,threads:[]})
    console.log("New board created")
 
  }
  boardData.threads.push(newThread)

  await boardData.save()
  res.json(newThread)
  })

  .put(function(req,res){

  
    res.send({})
  
    })

  .delete(function(req,res){
    const {board} = req.params
    const {thread_id, delete_password} = req.body

    let threadData = Thread.find({_id:thread_id})
    if(!threadData){
      console.log("cannot find thread")
    }

  })
  
  
  app.route('/api/replies/:board')
  .post(async function(req,res){
    const {board,thread_id,text,delete_password}= req.body
    
    
  const newReply = new Reply({
  text:text,
  delete_password:delete_password,
  })


    res.json({})
    });

};

