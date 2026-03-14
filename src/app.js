import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    Credentials: true
    }
)) //to config. cors

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public")) // if we want to store some assets to my server i can use this to save in folder public
app.use(cookieParser())

// export default app // OR
export {app}