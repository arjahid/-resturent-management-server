require('dotenv').config(); // <-- Move this to the very top

const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const e = require('express');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_KEY)
// const { ObjectId } = require('mongodb');
const port = process.env.PORT || 3000;



app.use(cors());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
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
    // await client.connect();
    const userCollection = client.db('resturentDb').collection('users');
    const menuCollection = client.db('resturentDb').collection('menu');
    const reviewCollection = client.db('resturentDb').collection('reviews');
    const cardCollection = client.db('resturentDb').collection('carts');
    const paymentCollection = client.db('resturentDb').collection('payments');


    // jwt token
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5h' });
      res.send({ token });
    })

    // verify jwt middleware
    const verifyToken = (req, res, next) => {

      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' })
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })


    }
    // verify admin middleware
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      next();
    }

    // users collection
    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {

      const result = await userCollection.find().toArray();
      res.send(result)
    })
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }
      const result = await userCollection.insertOne(user);
      res.send(result)
    })
    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result)
    })
    // verify admin after verify token
    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;


      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      const query = { email: email }

      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });




    });


    // menu releted api
    app.patch('/users/admin/:id',verifyToken,verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

    app.delete('/menu/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      let result;
      try {
        // Try deleting by ObjectId
        result = await menuCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
          // If not found, try deleting by string id
          result = await menuCollection.deleteOne({ _id: id });
        }
      } catch (e) {
        // If ObjectId conversion fails, try deleting by string id
        result = await menuCollection.deleteOne({ _id: id });
      }
      res.send(result);
    })

    app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      let result;
      try {
        result = await userCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
          result = await userCollection.deleteOne({ _id: id });
        }
      } catch (e) {
        result = await userCollection.deleteOne({ _id: id });
      }
      res.send(result);
    })

    app.get('/menu', async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result)

    })
    app.post('/menu',verifyToken,verifyAdmin,async(req,res)=>{
      const menuItem = req.body;
      const result=await menuCollection.insertOne(menuItem);
      res.send(result);

    })
    app.patch('/menu/:id',verifyToken,verifyAdmin,async(req,res)=>{
      const item=req.body;
      const id=req.params.id;
      let result;
      const updateDoc = {
        $set: {
          name: item.name,
          recipe: item.recipe,
          price: item.price,
          category: item.category,
          image: item.image,
        }
      };
      try {
        result = await menuCollection.updateOne({ _id: new ObjectId(id) }, updateDoc);
        if (result.matchedCount === 0) {
          result = await menuCollection.updateOne({ _id: id }, updateDoc);
        }
      } catch (e) {
        result = await menuCollection.updateOne({ _id: id }, updateDoc);
      }
      res.send(result);
    })
    app.delete('/menu/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      let result;
      try {
        // Try deleting by ObjectId
        result = await menuCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
          // If not found, try deleting by string id
          result = await menuCollection.deleteOne({ _id: id });
        }
      } catch (e) {
        // If ObjectId conversion fails, try deleting by string id
        result = await menuCollection.deleteOne({ _id: id });
      }
      res.send(result);
    })
    app.get('/menu/:id',async(req,res)=>{
      const id = req.params.id;
      let result;
      try {
        result = await menuCollection.findOne({ _id: new ObjectId(id) });
        if (!result) {
          result = await menuCollection.findOne({ _id: id });
        }
      } catch (e) {
        result = await menuCollection.findOne({ _id: id });
      }
      res.send(result)
    })

    app.get('/reviews', async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result)
    })
    //  cart collection
    app.get('/carts', async (req, res) => {
      const email = req.query.email;
      const query = { email: email }
      const result = await cardCollection.find(query).toArray();
      res.send(result)
    })
    app.post('/carts', async (req, res) => {
      const cartItem = req.body;
      const result = await cardCollection.insertOne(cartItem);
      res.send(result);
    });

    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      let result;
      try {
        result = await cardCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
          result = await cardCollection.deleteOne({ _id: id });
        }
      } catch (e) {
        result = await cardCollection.deleteOne({ _id: id });
      }
      res.send(result);
    })

    // Payment related api


    app.post('/create-payment-intent', async (req, res) => {
      const {price}=req.body;
      const amount=parseInt(price*100);
      const paymentIntent =await stripe.paymentIntents.create({
        amount:amount,
        currency:'usd',
        payment_method_types:['card']
      })
      res.send({
        clientSecret:paymentIntent.client_secret,
      })
    })
    app.post('/payments',async(req,res)=>{
      const payment=req.body;
      const paymentResul=await paymentCollection.insertOne(payment);
      console.log('payment info',payment);
      // carefully delete each item from cart
      const query={_id:{
        $in: payment.cartId.map(id=>new ObjectId(id))}}
        const deleteResult =await cardCollection.deleteMany(query);
        res.send({paymentResul,deleteResult})
    })
    app.get('/payments/:email', verifyToken, async (req, res) => {
      // Check if the email in the URL param matches the decoded token's email
      if (req.params.email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      const query = { email: req.params.email };
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    })
    // stats and anylysis related api
    app.get('/admin-stats',verifyToken,verifyAdmin, async (req, res) => {
      const users = await userCollection.estimatedDocumentCount();
      const menuItem = await menuCollection.estimatedDocumentCount();
      const orders=await paymentCollection.estimatedDocumentCount();
      // this not best system
      // const payments=await paymentCollection.find().toArray();
      // const revineu=payments.reduce((total,item)=>total+item.price,0)
      const result=await paymentCollection.aggregate([
        {
          $group:{
            _id:null,
            totalRevineu:{$sum:'$price'}

          }
        }
      ]).toArray();
      const revineu=result.length>0 ? result[0].totalRevineu:0;

      res.send({
        users,
        menuItem,
        orders,
        revineu
      });
    })
    // using aggregate pipeline
    app.get('/order-stats',async(req,res)=>{
      const result=await paymentCollection.aggregate([
        {
          $unwind:'$menuItemId'
        },
        {
          $lookup:{
            from:'menu',
            localField:'menuItemId',
            foreignField:'_id',
            as:'menuItems'
          }
        },
        {
          $unwind:'$menuItems'
        },
        {
          $group:{
            _id:'$menuItems.category',
            quntity:{$sum:1},
            revenue:{$sum:'$menuItems.price'},
          }
        },
        {
          $project:{
            category:'$_id',
            quntity:'$quntity',
            revenue:'$revenue',
            _id:0
          }
        }

      ]).toArray();
      res.send(result);
    })




    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('boss is here')
})
app.listen(port, () => {
  console.log(`server is running at http://localhost:${port}`)
})