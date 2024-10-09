const http = require("node:http");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 6060 ;
const app = express(); 
app.use(express.json())
require('dotenv').config()


const db = new sqlite3.Database(process.env.DB_PATH,(err)=>{
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

            db.run(`CREATE TABLE IF NOT EXISTS task (
            
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'pending'
                )`,(err)=>{
                    if(err){
                        console.log("Erro in create task table",err.message);
                    }else{
                        console.log("successfully create task table")
                    }
                })
    }
    console.log(`connected in database `)
})

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
app.post("/register",(req,res)=>{
    const { username, password, email, phone, role } = req.body;  
    if (!username || !password || !email || !phone) {
        return res.status(404).send("please provide all details")
    }
    const userRole = role || 'normal user';
    db.get(`SELECT email FROM user WHERE email = ?`, [email], (err, row) => {
        if (err) {
            console.log("Error fetching data", err.message); 
            return res.status(500).send("Error fetching data🧨")
        }
        if (row) {
            return res.status(409).send("User already exists")
        } 
    })
    const hashedPassword = bcrypt.hashSync(password, 10); 
    db.run(`INSERT INTO user ( username, password, email, phone, role ) VALUES (?, ?, ?, ?, ?)`,[username, hashedPassword, email, phone, userRole],(err)=>{
        if (err) {
            console.log("Erro inserting data in table user",err.message)
           return res.status(500).send("Erro inserting data in table user")
        } 
            res.status(201).send("user registered successfully😁")
    })
})

// login user  
app.post("/login",(req,res)=>{
    const { password , email } = req.body;
    if (!password || !email) {
        return res.status(404).send("please provide all details")
    }
    db.get(`SELECT * FROM user WHERE email = ?`,[email],(err,user)=>{
        if (err) {
            return res.status(500).send("Error accessing the database🧨")
        }
        if (!user) {
            return res.status(400).send("Invalid email ")
        }
        const validpassword = bcrypt.compareSync(password,user.password)
        if (!validpassword) {
            return res.status(400).send("Invalid  password")
        }
        const token = jwt.sign({email : user.email, id : user.id, role :user.role },process.env.JWT_SECRET,{ expiresIn : '1h' })
        res.send(`Login successful🫡🫡 \n\ntoken for you : ${token}`)
    })
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