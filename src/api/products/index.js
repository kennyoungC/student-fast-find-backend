import express from "express"
import createError from "http-errors"
import productModel from "./model.js"
import { JWTAuthMiddleware } from "../../auth/token.js"
import userModel from "../users/model.js"
import multer from "multer"
import { v2 as cloudinary } from "cloudinary"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import q2m from "query-to-mongo"
import { messageToSend, sendEmail } from "../../../utils/email.js"

const productRouter = express.Router()

const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "products",
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
}).single("image")

productRouter.post(
  "/",
  cloudinaryUploader,
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const result = await cloudinary.uploader.upload(req.file.path)
      const newProduct = new productModel({
        ...req.body,
        image: result.secure_url,
        cloudinaryId: result.public_id,
      })
      const product = await newProduct.save()

      res.status(201).send({ product })
    } catch (error) {
      console.log(error)
      next(error)
    }
  }
)

productRouter.put(
  "/:productId",
  cloudinaryUploader,
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const product = await productModel.findById(req.params.productId)
      if (product) {
        let result
        if (req.file) {
          await cloudinary.uploader.destroy(product.cloudinaryId)
          result = await cloudinary.uploader.upload(req.file.path)
        }
        const data = {
          ...product.toObject(),
          image: result ? result.secure_url : product.image,
          cloudinaryId: result ? result.public_id : product.cloudinaryId,
          ...req.body,
        }
        const updatedProduct = await productModel.findByIdAndUpdate(
          req.params.productId,
          data,
          {
            runValidators: true,
            new: true,
          }
        )
        res.send(updatedProduct)
      } else {
        next(
          createError(404, `Product with id ${req.params.productId} not found!`)
        )
      }
    } catch (error) {
      console.log(error)
      next(error)
    }
  }
)

productRouter.get("/", async (req, res, next) => {
  try {
    const query = q2m(req.query)
    const products = await productModel
      .find(query.criteria, query.options.fields)
      .skip(query.options.skip)
      .limit(query.options.limit)
      .sort(query.options.sort)
      .populate({
        path: "poster",
        select: "username",
      })

    res.send(products)
  } catch (error) {
    console.log(error)
    next(error)
  }
})

productRouter.get("/:productId", async (req, res, next) => {
  try {
    const product = await productModel.findById(req.params.productId).populate({
      path: "poster",
      select: ["email", "username"],
    })
    if (product) {
      res.send(product)
    } else {
      next(
        createError(404, `product with id ${req.params.productId} not found!`)
      )
    }
  } catch (error) {
    next(error)
  }
})

productRouter.get(
  "/me/:productId",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const user = await userModel.findById(req.user._id)
      if (user) {
        const product = await productModel.findById(req.params.productId)
        if (product) {
          if (product.poster.toString().split(" ")[0] === req.user._id) {
            res.send(product)
          } else {
            next(createError(403, "Not authorized"))
          }
        } else {
          next(
            createError(
              404,
              `product with id ${req.params.productId} not found!`
            )
          )
        }
      } else {
        next(createError(404, `user with id ${req.user._id} not found!`))
      }
    } catch (error) {
      next(error)
    }
  }
)
productRouter.post("/send", async (req, res, next) => {
  try {
    const { sellerEmail, buyerEmail, subject, message } = req.body

    const newText = messageToSend(subject.toUpperCase(), buyerEmail, message)
    await sendEmail(sellerEmail, subject, newText)
    res.send("Email sent")
  } catch (error) {
    next(error)
  }
})

productRouter.delete(
  "/:productId",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const deletedProduct = await productModel.findByIdAndDelete(
        req.params.productId
      )
      if (deletedProduct) {
        res.send(deletedProduct)
      } else {
        next(
          createError(404, `Product with id ${req.params.productId} not found!`)
        )
      }
    } catch (error) {
      next(error)
    }
  }
)

export default productRouter
