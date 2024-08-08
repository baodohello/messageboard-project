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
   const boardData = await Board.findOne({ name: board })
   .select('threads') // Only select the threads field
   .lean(); // Use .lean() to get plain JavaScript objects instead of Mongoose documents

 if (!boardData) {
   return res.status(404).send('Board not found');
 }

 // Sort threads by bumped_on in descending order and take the most recent 10
 let threads = boardData.threads
   .sort((a, b) => b.bumped_on - a.bumped_on)
   .slice(0, 10);

 // For each thread, sort the replies by creation date in descending order and take the most recent 3
 threads = threads.map(thread => {
   return {
     _id: thread._id,
     text: thread.text,
     created_on: thread.created_on,
     bumped_on: thread.bumped_on,
     replycount: thread.replycount,
     replies: thread.replies
       .sort((a, b) => b.created_on - a.created_on)
       .slice(0, 3)
       .map(reply => ({
         _id: reply._id,
         text: reply.text,
         created_on: reply.created_on
       }))
   };
 });

 // Send the threads array back to the client
 return res.json(threads);
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
  res.send(newThread)
  })

  .put(async function(req,res){
    const {board,thread_id} = req.body
    const boardData = await Board.findOne({ name: board });
    if(!boardData){
      return res.send('reported')
    }
    let threadData = boardData.threads.id(thread_id)
    if(!threadData){
      return res.send('reported')
    }
    const date = new Date()
    threadData.reported = true
    threadData.bumped_on = date
    await boardData.save()
    return res.send('reported')
    

    })

  .delete(async function(req,res){
    const {board} = req.params
    const {thread_id, delete_password} = req.body
   const boardData = await Board.findOne({ name: board });
   if (!boardData) {
     return res.send('Board not found');
   }
   const threadToDelete = boardData.threads.id(thread_id);
   if (!threadToDelete) {
     return res.send('Thread not found');
   }
   if (delete_password !== threadToDelete.delete_password) {
     return res.send('incorrect password');
   }
   threadToDelete.deleteOne(); 
   await boardData.save();
   return res.send('success');
  })
  
  
  app.route('/api/replies/:board')
  .get(async function(req, res) {

    const { board } = req.params;
    const { thread_id } = req.query;
    const boardData = await Board.findOne({ name: board })
        .select('threads') // Only select the threads field
        .lean(); // Use .lean() to get plain JavaScript objects instead of Mongoose documents
      if (!boardData) {
        return res.status(404).send('Board not found');
      }
       // Find the specific thread by its _id manually
    const thread = boardData.threads.find(thread => thread._id.toString() === thread_id);
      if (!thread) {
        return res.status(404).send('Thread not found');
      }
      const threadResponse = {
        _id: thread._id,
        text: thread.text,
        created_on: thread.created_on,
        bumped_on: thread.bumped_on,
        replycount: thread.replycount,
        replies: thread.replies.map(reply => ({
          _id: reply._id,
          text: reply.text,
          created_on: reply.created_on
        }))
      };
      return res.json(threadResponse);
  })

  
  .post(async function(req,res){
    const date = new Date()
    const {board} = req.params
    const {thread_id,text,delete_password}= req.body
    
    const boardData = await Board.findOne({ name: board });
    if (!boardData) {
      return res.status(404).send('Board not found');
    }
  const thread = boardData.threads.id(thread_id);
  if (!thread) {
    return res.status(404).send('Thread not found');
  }
  const newReply = new Reply({
  text:text,
  delete_password:delete_password,
  created_on:date,
  bumped_on:date,
  })
  thread.replies.push(newReply);
  thread.bumped_on = date
  await boardData.save();
  res.send(thread);
    })

    .delete(async function(req,res){
    

      const {board} = req.params
      const {thread_id,reply_id, delete_password} = req.body
     const boardData = await Board.findOne({ name: board });
     if (!boardData) {
       return res.send('Board not found');
     }
     const threadData = boardData.threads.id(thread_id);
     if (!threadData) {
       return res.send('Thread not found');
     }
     const replyToDelete = threadData.replies.id(reply_id);
     if (!replyToDelete) {
       return res.send('Reply not found');
     }
     if (delete_password !== replyToDelete.delete_password) {
       return res.send('incorrect password');
     }
     replyToDelete.text = '[deleted]';

     await threadData.save();
     await boardData.save();
     return res.send('success');
    })

    .put(async function(req,res){
      //   console.log(req.params)
      // console.log(req.query)
      // console.log(req.body)
      const {board,thread_id,reply_id} = req.body
      const boardData = await Board.findOne({ name: board });
      if(!boardData){
        return res.send('reported')
      }
      let threadData = boardData.threads.id(thread_id)
      if(!threadData){
        return res.send('reported')
      }
      let replyData = threadData.replies.id(reply_id)
      if(!replyData){
        return res.send('reported')
      }
      const date = new Date()

      replyData.reported = true
      replyData.bumped_on = date
      await boardData.save()
      return res.send('reported')
      
  
      })
    

};

