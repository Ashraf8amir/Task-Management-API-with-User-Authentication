const http = require("node:http")
const express = require("express")
const sqlite3 = require("sqlite3").verbose()
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const port = process.env.port || 6060
const app = express()
app.use(express.json())


const db = new sqlite3.Database("./database/db.sqlite3",(err)=>{
    if (err) {
        console.log(`Erro in database connection `,err.message)
    } else {
        db.run(`CREATE TABLE IF NOT EXISTS user (
            
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT NOT NULL UNIQUE,
            role TEXT DEFAULT 'normal user'
            )`,(err)=>{
                if(err){
                    console.log("Erro in create user table",err.message);
                }else{
                    console.log("successfully create user table")
                }
            })
    }
    console.log(`connected in database `)
})


// register user 
app.post("/register",(req,res)=>{

    
    const { username, password, email, phone, role } = req.body;  
    if (!username || !password || !email || !phone) {
        return res.status(404).send("please provide all details")
    }
    const userRole = role || 'normal user';
    db.get(`SELECT email FROM user WHERE email = ?`, [email], (err, row) => {
        if (err) {
            console.log("Error fetching data", err.message); 
            return res.status(500).send("Error fetching data");
        }
        if (row) {
            return res.status(409).send("User already exists");
        } 
    })
 
    const hashedPassword = bcrypt.hashSync(password, 10); 
    db.run(`INSERT INTO user ( username, password, email, phone, role ) VALUES (?, ?, ?, ?, ?)`,[username, hashedPassword, email, phone, userRole],(err)=>{
        if (err) {
            console.log("Erro inserting data",err.message)
            res.status(500).send("Erro inserting data")
        } 
            res.status(201).send("user registered successfully")
    })
})
const validtoken = (req,res,next)=>{
    const token = req.headers['authorization']?.split(" ")[1];
    if (!token) {
        return res.status(401).send("Unauthorized")
    }
    jwt.verify(token,"a_i_m",(err,decoded)=>{
        if (err) {
            return res.status(403).send("forbidden")
        }
        req.userid = decoded.id
        req.userrole = decoded.role
        req.useremail = decoded.email

        next(); 
    })
} 
// login user  
app.post("/login",(req,res)=>{

    const { password , email } = req.body;
    if (!password || !email) {
        return res.status(404).send("please provide all details")
    }
    db.get(`SELECT * FROM user WHERE email = ?`,[email],(err,user)=>{
        if (err) {
            return res.status(500).send("Error accessing the database")
        }

        if (!user) {
            return res.status(400).send("Invalid email ")
        }

        const validpassword = bcrypt.compareSync(password,user.password)
        if (!validpassword) {
            return res.status(400).send("Invalid  password")
        }

        const token = jwt.sign({email : user.email, id : user.id, role :user.role },"a_i_m",{ expiresIn : '1h' })
        
        res.send(`Login successful🫡🫡 \n\ntoken for you : ${token}`)
    })
})

app.get('/tasks/manage', validtoken, (req, res) => {
    
    if (req.userrole !== 'admin') {
      return res.status(403).send('Access denied: Admins only');
    }

    res.send("'Welcome Admin 😁'")
  });

app.listen(port,()=>{
    console.log("listening to port",port)
})





/*-----------------------------------------------------------------------------------*/
//tasks 


db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES user(id)
)`, (err) => {
    if (err) {
        console.log("Error creating tasks table", err.message);
    } else {
        console.log("Successfully created tasks table");
    }
});



// Only admin can create a task
app.post("/tasks", validtoken, (req, res) => {
    const { title, description, status } = req.body;

    if (req.userrole !== 'admin') {
        return res.status(403).send("Access denied: Only admins can create tasks");
    }

    if (!title || !description) {
        return res.status(400).send("Please provide all necessary details");
    }

    db.run(`INSERT INTO tasks (title, description, status, user_id) VALUES (?, ?, ?, ?)`,
        [title, description, status || 'pending', req.userid], (err) => {
            if (err) {
                return res.status(500).send("Error creating task");
            }
            res.status(201).send("Task created successfully");
        });
});


// All users can view tasks
app.get("/tasks", validtoken, (req, res) => {
    db.all(`SELECT * FROM tasks`, [], (err, rows) => {
        if (err) {
            return res.status(500).send("Error rech tasks");
        }
        res.send(rows);
    });
});




// update tasks
app.put("/tasks/:id", validtoken, (req, res) => {
    const { id } = req.params;
    const { title, description, status } = req.body;

    if (req.userrole !== 'admin') {
        return res.status(403).send("Access denied: Only admins can update tasks");
    }

    db.get(`SELECT * FROM tasks WHERE id = ?`, [id], (err, task) => {
        if (err) return res.status(500).send("Error fetching task");
        if (!task) return res.status(404).send("Task not found");

        const updatedTitle = title || task.title;
        const updatedDescription = description || task.description;
        const updatedStatus = status || task.status;

        db.run(`UPDATE tasks SET title = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [updatedTitle, updatedDescription, updatedStatus, id], (err) => {
                if (err) return res.status(500).send("Error updating task");
                res.send("Task updated successfully");
            });
    });
});


// delete spasfic task
app.delete('/tasks/:id', validtoken, (req, res) => {
    const taskId = req.params.id;  

    db.run(`DELETE FROM tasks WHERE id = ?`, taskId, function (err) {
        if (err) {
            return res.status(500).send("Error deleting task: " + err.message);
        }
        if (this.changes === 0) {
            return res.status(404).send("Task not found");
        }
        res.send("Task deleted successfully");
    });
});



