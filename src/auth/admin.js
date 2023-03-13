import createHttpError from "http-errors"

export const hostOnlyMiddleware = (req, res, next) => {
  if (req.user.role === "admin") {
    next()
  } else {
    next(createHttpError(403, "Admin only endpoint!"))
  }
}
