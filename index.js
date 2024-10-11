const http = require("node:http");
const express = require("express");
const db = require('./database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const port = process.env.PORT || 6060 ;
const app = express(); 
require('dotenv').config()
app.use(express.json())
app.use(morgan('dev'))

const validtoken = (req,res,next)=>{
    const token = req.headers['authorization']?.split(" ")[1];
    if (!token) {
        return res.status(401).send("Unauthorized")
    }
    jwt.verify(token,process.env.JWT_SECRET,(err,decoded)=>{
        if (err) {
            return res.status(403).send("forbidden")
        }
        req.userid = decoded.id
        req.userrole = decoded.role
        req.useremail = decoded.email

        next();  
    })
} 

// register user   
app.post("/register",async(req,res)=>{
    const { username, password, email, phone, role } = req.body;  
    if (!username || !password || !email || !phone) { 
        return res.status(404).send("please provide all details")
    }
    const userRole = role || 'normal user';
    try {
        const userexists = await new Promise((resolve, reject) => {
            db.get(`SELECT email FROM user WHERE email = ?`, [email], (err, row) => {
                if (err) {
                    reject(err)
                    return res.status(500).send("Error fetching data🧨")
                }
                resolve(row)
            }) 
        })
        if (userexists) {
            return res.status(409).send("User already exists")
        }
        const hashedPassword = await new Promise((resolve, reject) => {
            bcrypt.hash(password, 10, (err,hash)=>{
                if (err) {
                    reject(err);
                    return res.status(500).send("Error hashing password");
                } 
                resolve(hash)
            })
        })
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO user ( username, password, email, phone, role ) VALUES (?, ?, ?, ?, ?)`,[username, hashedPassword, email, phone, userRole],(err)=>{
                if (err) {
                    reject(err);
                    return res.status(500).send("Error inserting data in table user");
                }
                resolve()
            })
        })
        return res.status(201).send("User registered successfully 😁");
    } catch (err) {
        console.error("Error in: ", err.message);
        return res.status(500).send("Internal server error 🧨");
    }
})

// login user  
app.post("/login",async(req,res)=>{
    const { password , email } = req.body;
    if (!password || !email) {
        return res.status(404).send("please provide all details")
    }
    try {
        const emailexists = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM user WHERE email = ?`,[email],(err,user)=>{
                if (err) {
                    reject(err)
                    return res.status(500).send("Error accessing the database🧨")
                }
                resolve(user)
            })
        })
        if (!emailexists) {
            return res.status(400).send("Invalid email")
        }
        const validpassword = await bcrypt.compareSync(password,emailexists.password)
        if (!validpassword) {
            return res.status(400).send("Invalid  password")
        }
        const token = jwt.sign({email : emailexists.email, id : emailexists.id, role :emailexists.role },process.env.JWT_SECRET,{ expiresIn : '1h' })
        res.send(`Login successful🫡🫡 \n\ntoken for you : ${token}`)
    } catch (error) {
        console.error("Error in: ", err.message);
        return res.status(500).send("Internal server error 🧨");
    }
})
// create task
app.post('/tasks', validtoken, (req, res) => {
    if (req.userrole !== 'admin') {
      return res.status(404).send('Admins only');
    }
    const { title, description, status } = req.body
    const userStatus = status || 'pending'
    if (!title) {
        return res.status(400).send("Please provide a title for the task")
    }
    db.run(`INSERT INTO task ( title, description, status ) VALUES (?, ?, ?)`,[title,description,userStatus],(err)=>{
        if (err) {
            console.log("Erro inserting data in table task",err.message)
          return res.status(500).send("Erro inserting data in table task")
        } 
        res.status(201).send("task registered successfully😁")
    })
  });

// show task
app.get('/tasks',validtoken,(req,res)=>{
    db.all(`SELECT * FROM task`,[],(err,row)=>{
        if (err) {
            return res.status(500).send("Error fetching tasks🧨")
        }
        if (row.length === 0) {
          return res.status(500).send("No tasks found")
        }
        const contenttask = row.map(row => {
            return `Task : ${row.id}\nTitle: ${row.title}\nDescription: ${row.description}\nStatus: ${row.status}\n             --------------\n`;
        }).join('');
        res.send(contenttask)
    })
})

// delete task
app.delete('/tasks/:id',validtoken,(req,res)=>{
    if (req.userrole !== 'admin') {
        return res.status(404).send('Admins only')
    }
    const taskid = req.params.id;
    db.run(`DELETE FROM task WHERE id = ?`,[taskid],(err)=>{
        if (err) {
            return res.status(500).send("Error deleting task🧨")
        }
        if (this.changes === 0) {
            return res.status(404).send("Task not found")
        }
        res.send("Task deleted successfully🫡")
    }) 
})

// update task 
app.put('/tasks/:id',validtoken,(req,res)=>{
    if (req.userrole !== 'admin') {
        return res.status(404).send('Admins only');
    }
    const taskid = req.params.id;
    const { title, description, status } = req.body;
    db.run(`UPDATE task SET title = ?, description = ?, status = ? WHERE id = ?`,[title,description,status,taskid],(err)=>{
        if (err) {
            return res.status(500).send("Error updating task🧨")
        }
        if (this.changes === 0) {
            return res.status(404).send("Task not found")
        }
        res.send("Task updated successfully🫡");
    })
})

// change status by user
app.put("/tasks/:id/status", validtoken, (req, res) =>{
    const taskId = req.params.id;
    const { status } = req.body;
    db.get(`SELECT * FROM task WHERE id = ?`, [taskId], (err, task) => {
        if (err) {
            return res.status(500).send("Error fetching task🤦‍♂️");
        } 
        if (!task) {
            return res.status(404).send("Task not found");
        }
        if (task.status !== "pending") {
            return res.status(403).send("this is Done");
        }
        db.run(
            `UPDATE task SET status = ? WHERE id = ?`,[status, taskId],(err)=>{
                if (err) {
                    return res.status(500).send("Error updating task status🧨");
                }
                res.send("Done Task🫡");
            }
        );
    });
})

app.listen(port,()=>{
    console.log("listening to port",port)
})