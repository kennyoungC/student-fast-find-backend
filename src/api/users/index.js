import express from "express"
import createError from "http-errors"
import userModel from "./model.js"
import ProductModel from "../products/model.js"
import { hostOnlyMiddleware } from "../../auth/admin.js"
import { JWTAuthMiddleware } from "../../auth/token.js"
import { generateAccessToken } from "../../auth/tools.js"
import multer from "multer"
import { v2 as cloudinary } from "cloudinary"
import { CloudinaryStorage } from "multer-storage-cloudinary"

const userRouter = express.Router()

const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "users",
    },
  }),
  fileFilter: (req, file, multerNext) => {
    if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg") {
      multerNext(createError(400, "Only png allowed!"))
    } else {
      multerNext(null, true)
    }
  },
  limits: { fileSize: 1 * 1024 * 1024 }, // file size
}).single("avatar")

userRouter.post("/register", cloudinaryUploader, async (req, res, next) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path)
    const newUser = new userModel({
      ...req.body,
      avatar: result.secure_url,
      cloudinaryId: result.public_id,
    })
    const user = await newUser.save()

    res.status(201).send({ user })
  } catch (error) {
    console.log(error)
    next(error)
  }
})

userRouter.put(
  "/me",
  JWTAuthMiddleware,
  cloudinaryUploader,
  async (req, res, next) => {
    try {
      const user = await userModel.findById(req.user._id)
      if (user) {
        let result
        if (req.file) {
          result = await cloudinary.uploader.upload(req.file.path)
        }
        const data = {
          ...user.toObject(),
          avatar: result ? result.secure_url : user.avatar,

          ...req.body,
        }
        const updatedUser = await userModel.findByIdAndUpdate(
          req.user._id,
          data,
          {
            runValidators: true,
            new: true,
          }
        )
        res.status(200).send({ user: updatedUser })
      } else {
        next(createError(404, `User with id ${req.user._id} not found!`))
      }
    } catch (error) {
      console.log(error)
      next(error)
    }
  }
)

userRouter.get("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const me = await userModel.findById(req.user._id)
    res.send(me)
  } catch (error) {
    next(error)
  }
})
userRouter.get("/all", async (req, res, next) => {
  try {
    const all = await userModel.find()
    console.log(all)
    const emailAndUsername = all.map((user) => {
      return { email: user.email, username: user.username }
    })
    res.send(emailAndUsername)
  } catch (error) {
    next(error)
  }
})

userRouter.get("/me/products", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const me = await userModel.findById(req.user._id)
    if (me) {
      const products = await ProductModel.find({ poster: req.user._id })
      res.send(products)
    } else {
      next(createError(404, "User not found"))
    }
  } catch (error) {
    next(error)
  }
})

userRouter.delete("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    await userModel.findByIdAndDelete(req.user._id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

userRouter.get(
  "/",
  JWTAuthMiddleware,
  hostOnlyMiddleware,
  async (req, res, next) => {
    try {
      const users = await userModel.find()
      res.send(users)
    } catch (error) {
      console.log(error)
      next(error)
    }
  }
)

userRouter.get(
  "/:userId",

  async (req, res, next) => {
    try {
      const user = await userModel.findById(req.params.userId)
      if (user) {
        res.send(user)
      } else {
        next(createError(404, `User with id ${req.params.userId} not found!`))
      }
    } catch (error) {
      next(error)
    }
  }
)

userRouter.put(
  "/:userId",

  async (req, res, next) => {
    try {
      const updatedUser = await userModel.findByIdAndUpdate(
        req.params.userId,
        req.body,
        { new: true, runValidators: true }
      )
      if (updatedUser) {
        res.send(updatedUser)
      } else {
        next(createError(404, `User with id ${req.params.userId} not found!`))
      }
    } catch (error) {
      next(error)
    }
  }
)

userRouter.delete(
  "/:userId",

  async (req, res, next) => {
    try {
      const deletedUser = await userModel.findByIdAndDelete(req.params.userId)
      if (deletedUser) {
        res.send({ message: "User deleted successfully!" })
      } else {
        next(createError(404, `User with id ${req.params.userId} not found!`))
      }
    } catch (error) {
      next(error)
    }
  }
)

userRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body

    const user = await userModel.checkCredentials(email, password)

    if (user) {
      const accessToken = await generateAccessToken({
        _id: user._id,
        role: user.role,
      })
      res.send({ accessToken })
    } else {
      next(createError(401, "Username or password is incorrect"))
    }
  } catch (error) {
    next(error)
  }
})

userRouter.post("/logout", JWTAuthMiddleware, async (req, res, next) => {
  try {
    res.send({ message: "Logout successful" })
  } catch (error) {
    next(error)
  }
})

export default userRouter
