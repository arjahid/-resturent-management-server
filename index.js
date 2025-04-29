const express= require('express');
const app= express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors= require('cors');
const port=process.env.PORT || 3000;
require('dotenv').config()



app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.lsdr1.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
   const menuCollection=client.db('resturentDb').collection('menu');
   const reviewCollection=client.db('resturentDb').collection('reviews');
   const cardCollection=client.db('resturentDb').collection('carts');

   app.get('/menu',async(req,res)=>{
    const result=await menuCollection.find().toArray();
    res.send(result)
   })
   app.get('/reviews',async(req,res)=>{
    const result=await reviewCollection.find().toArray();
    res.send(result)
   })
  //  cart collection
 app.get('/carts',async(req,res)=>{
  const result=await cardCollection.find().toArray();
  res.send(result)
 })
  app.post('/carts', async (req, res) => {
    const cartItem = req.body;
    const result = await cardCollection.insertOne(cartItem);
    res.send(result);
  });




    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/',(req,res)=>{
    res.send('boss is here')
})
app.listen(port,()=>{
    console.log(`server is running at http://localhost:${port}`)
})