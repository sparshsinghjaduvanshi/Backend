// require('dotenv').config({path: './env'})  //one way
import dotenv from "dotenv"; //2nd way but now we need to config it
import connectDB from "./db/index.js";
import {app} from './app.js'

dotenv.config({
    path: './env'
}) // but now we cannot use it directly we need to add something in our .json file under /script/dev

/* 2nd APPROACH */
connectDB()
.then( () =>{

    app.on("error", (error) =>{           //it is a listening event for error is any 
            console.log("error", error)
            throw error
    })
    app.listen(process.env.PORT || 8000, () =>{
        console.log(`server is running at port ${process.env.PORT}`)
    })
})
.catch((err) =>{
    console.log("MONGO db connection failed !!! ", err)
})


/* FIRST APPROACH
import express from "express"
const app = new express()
//using iefi function
;(async () =>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) =>{           //it is a listening event for error is any 
            console.log("error", error)
            throw error
        })

        app.listen(process.env.PORT, () =>{
            console.log(`App is listening on port ${process.env.PORT}`)
        })
    }catch(error){
        console.log("Error:" ,error)
    }
})()
    */