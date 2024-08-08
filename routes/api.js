'use strict';

const shortid = require('shortid');

const mongoose = require('mongoose');

// Define the Thread schema
const threadSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toHexString() }, // Generate a new ObjectId if not provided
  text: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false },
  delete_password: { type: String, required: true },
  replies: [{ type: mongoose.Schema.Types.Mixed }], // You can define a separate schema for replies if needed
  replycount: { type: Number, default: 0 }
});
// Define the schema
const boardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  threads: [threadSchema] // Embed the Thread schema here

});

// Create the model
const Board = mongoose.model('Board', boardSchema);




let demoGeneralBoardData = [
{
  _id:'669fd5258492370013aec959',
  text:'5',
  created_on: '2024-07-23T16:07:01.438Z',
  bumped_on:'2024-07-23T16:07:01.438Z',
  reported: false,
  delete_password:'5',
  replies:[],
  replycount:0


}
]
module.exports = function (app) {
  
  app.route('/api/threads/:board')
  .get(async function(req,res){
  
    console.log(req.params)
    console.log(req.query)
    console.log(req.body)

    try{
    const {board} = req.params

      let result = await Board.findOne({ name: board });
      
      if (!result) {
      console.log('Board not found, creating new ...');

        result = new Board({ name: board });
      await result.save();
      console.log('Board created successfully:');

      }

    const {threads} = await Board.findOne({ name: board });
    res.send(threads)

    } 
    catch(e){
      console.log(e)

    }

    
    })
  .post(async function(req,res){
    console.log(req.params)
    console.log(req.query)
    console.log(req.body)
    const {board} = req.params
  const {text,delete_password} = req.body

  let boardData = await Board.findOne({ name: board });


  boardData.threads.push({
    _id:shortid.generate(),
  text: text,
  created_on: new Date().toISOString(),
  bumped_on:new Date().toISOString(),
  reported: false,
  delete_password:delete_password,
  replies:[],
  replycount:0
  })
  await boardData.save();
  console.log('Thread added successfully:');
  res.redirect(`/b/${board}/`);


  })
  .put(function(req,res){

    console.log(req.params)
    console.log(req.query)
    console.log(req.body)
  
    res.send({})
  
    });
    
  app.route('/api/replies/:board')
  .get(function(req,res){
    console.log(req.params)
    console.log(req.query)
    console.log(req.body)
  
    res.send({})
    });

};
