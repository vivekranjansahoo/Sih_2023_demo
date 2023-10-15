const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const session = require("express-session");

// const joblib = require("joblib");

const app = express();
const PORT = 5000;
const SECRET_KEY = "vivek";

// const model = joblib.load("./model/sihmodel.pkl");

// app.use(bodyParser.json());
app.use(cors());

mongoose.connect(
  "mongodb://127.0.0.1:27017/sih?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.10.1",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

app.use(express.json({ limit: "50mb" }));

app.use(bodyParser.json({ limit: "50mb", extended: true }));
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);

const User = require("./Models/User");
// const Product = require("./Models/Product");
// const Order = require("./Models/Order");
// const Bill = require("./Models/Bill");

app.post("/predict", (req, res) => {
  try {
    const inputData = req.body.input; // Input data for prediction
    const prediction = model.predict([inputData]); // Make predictions using your model

    res.json({ prediction });
  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({ error: "Prediction failed" });
  }
});

app.use(
  session({
    secret: "mern",
    resave: false,
    saveUninitialized: true,
  })
);

app.post("/register", async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const newUser = new User({ firstname, lastname, email, password });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to register user" });
  }
});

app.post("/productregister", async (req, res) => {
  try {
    const { name, image, desc, catagory, color, price } = req.body;
    const existingProduct = await Product.findOne({ name });

    if (existingProduct) {
      return res.status(400).json({ message: "product already exists" });
    }
    const newProduct = new Product({
      name,
      image,
      desc,
      catagory,
      color,
      price,
    });
    await newProduct.save();

    res.status(201).json({ message: "Product added successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to added product" });
  }
});

app.post("/orderdetails", async (req, res) => {
  try {
    const {
      name,
      country,
      streetaddress,
      city,
      state,
      pincode,
      phoneno,
      email,
      paymentmethod,
      billno,
      productdata,
      ammount,
    } = req.body;
    const newOrder = new Order({
      name,
      country,
      streetaddress,
      city,
      state,
      pincode,
      phoneno,
      email,
      paymentmethod,
      billno,
      productdata,
      ammount,
    });
    const newBill = new Bill({ billno, productdata, ammount });
    await newOrder.save();
    await newBill.save();

    res.status(201).json({ message: "Order placed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to order place" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (email === user.email && password === user.password) {
      req.session.email = email;
      req.session.success = true;
    }

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, SECRET_KEY);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Failed to login" });
  }
});

// app.post('/adminlogin', async (req, res) => {
//     try {
//       const { email, password } = req.body;
//       const user = await admin.findOne({ email });
//       res.json({ user });

//       if (!user || user.password !== password) {
//         return res.status(401).json({ message: 'Invalid  Admin credentials' });
//       }

//       const token = jwt.sign({ userId: user._id }, SECRET_KEY);
//       res.json({ token });
//     } catch (error) {
//       res.status(500).json({ error: 'Failed to login' });
//     }
//   });

const requireAuth = (req, res, next) => {
  if (req.session.email) {
    next();
  } else {
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

app.post("/user", requireAuth, (req, res) => {
  const email = req.session.email;
  res.json({ success: true, email });
});

app.get("/getproduct", async (req, res) => {
  try {
    await Product.find({}).then((data) => {
      res.send({ status: "ok", data });
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch" });
  }
});

app.get("/getorderdetails", async (req, res) => {
  try {
    await Order.find({}).then((data) => {
      res.send({ status: "ok", data });
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch" });
  }
});

app.get("/count", async (req, res) => {
  try {
    const pcount = await Product.find().count();
    const ucount = await User.find().count();
    const ocount = await Order.find().count();
    res.json({ count: ucount, ccount: pcount, cccount: ocount });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch" });
  }
});

app.get("/productdetails/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const data = await Product.findById(id);
    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ message: "Data not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch" });
  }
});

app.get("/billingaddress/:billno", async (req, res) => {
  const billno = req.params.billno;
  try {
    const data = await Order.find({ billno });
    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ message: "Data not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch" });
  }
});

app.get("/userdashboard/:catagory", async (req, res) => {
  const catagory = req.params.catagory;
  try {
    const data = await Product.find({ catagory });
    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ message: "Data not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch" });
  }
});

// app.get("/catagory/:catagory",async (req, res) => {

//   const catagory = req.params.catagory;
//   try {
//       const data = await Product.find({catagory});
//       if (data) {
//         res.json(data);
//       } else {
//         res.status(404).json({ message: 'Data not found' });
//       }
//   }
//    catch (error) {
//       res.status(500).json({ error: 'Failed to fetch' });
//   }
// })

app.get("/sortingproducts", async (req, res) => {
  try {
    const { catagory, color, sortBy } = req.query;
    let query = {};

    if (catagory) {
      query.catagory = catagory;
    }

    if (color) {
      query.color = color;
    }
    let products = await Product.find(query);

    if (sortBy) {
      products = products.sort((a, b) => {
        if (sortBy === "price-asc") {
          return a.price - b.price;
        } else if (sortBy === "price-desc") {
          return b.price - a.price;
        } else {
          return 0;
        }
      });
    }

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

app.get("/billproduct/:billno", async (req, res) => {
  const billno = req.params.billno;
  try {
    const data = await Bill.find({ billno });
    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ message: "Data not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch" });
  }
});

app.delete("/deleteproduct/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const data = await Product.findByIdAndDelete(id);
    if (!data) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json({ message: "Item deleted successfully", data });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch" });
  }
});

const verifyToken = (req, res, next) => {
  const token = req.headers.token;
  if (!token) {
    return res.status(403).json({ message: "Token not provided" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.userId = decoded.userId;
    next();
  });
};

app.get("/protected", verifyToken, (req, res) => {
  res.json({ message: "This is a protected route" });
});

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
