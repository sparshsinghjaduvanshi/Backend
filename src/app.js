import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}
)) //to config. cors

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public")) // if we want to store some assets to my server i can use this to save in folder public
app.use(cookieParser())

app.get("/test", (req, res) => {
    console.log("hello world")
    res.send("Test route working")
})

//routes
import userRouter from './routes/user.routes.js'

//routes declaration
app.use("/api/v1/users", userRouter)//("prefix",what route to go)

// export default app // OR
export { app }