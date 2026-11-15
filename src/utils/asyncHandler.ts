import type { RequestHandler } from "express";

export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve()
      .then(() => fn(req, res, next))
      .catch(next);
  };
};
