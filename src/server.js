import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import listEndpoints from "express-list-endpoints"
import userRouter from "./api/users/index.js"
import productRouter from "./api/products/index.js"

import {
  unauthorizedHandler,
  forbiddenHandler,
  catchAllHandler,
  notFoundHandler,
  badRequestHandler,
} from "./errorHandlers.js"

const server = express()

const port = process.env.PORT || 3002

// ****************************************************** MIDDLEWARES **********************************************

server.use(cors())
server.use(express.json())

// ******************************************************* ENDPOINTS ***********************************************

server.use("/users", userRouter)
server.use("/products", productRouter)

// ***************************************************** ERROR HANDLERS ********************************************
server.use(badRequestHandler)
server.use(unauthorizedHandler)
server.use(forbiddenHandler)
server.use(catchAllHandler)
server.use(notFoundHandler)

mongoose.connect(process.env.MONGO_CONNECTION_URL)

mongoose.connection.on("connected", () => {
  console.log("Successfully connected to Mongo!")
  server.listen(port, () => {
    console.table(listEndpoints(server))
    console.log(`Server is running on port ${port}`)
  })
})
