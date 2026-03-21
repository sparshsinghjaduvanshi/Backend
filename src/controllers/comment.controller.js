import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params
  const { page = 1, limit = 10 } = req.query

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video id")
  }

  const pipeline = [
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId)
      }
    },
    {
      $sort: {
        createdAt: -1
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner"
      }
    },
    {
      $addFields: {
        owner: { $first: "$owner" }
      }
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        owner: {
          userName: 1,
          avatar: 1
        }
      }
    }
  ]

  const options = {
    httponly: true,
    limit: parseInt(limit),
    secure: true
  }

  const comments = await Comment.aggregatePaginate(Comment.aggregate(pipeline), options)
  return res.status(200)
    .json(new ApiResponse(200, { comments }, "Comments fetched successfully"))
})

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params
  const { content } = req.body
  if (!isValidateObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id")
  }
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Content is required")
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id
  })

  return res.status(201)
    .json(new ApiResponse(201, { comment }, "Comment added successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params
  const { content } = req.body
  if (!isValidateObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id")
  }
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Content is required")
  }
  const comment = await Comment.findById(commentId)
  if (!comment) {
    throw new ApiError(404, "Comment not found")
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this comment")
  }

  comment.content = content
  await comment.save()
  return res.status(200)
    .json(new ApiResponse(200, { comment }, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment

  const { commentId } = req.params
  if (!isValidateObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id")
  }
  const comment = await Comment.findById(commentId)
  if (!comment) {
    throw new ApiError(404, "Comment not found")
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this comment")
  }
  comment.deleteOne()
  return res.status(200)
    .json(new ApiResponse(200, null, "Comment deleted successfully"))
})

export {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment
}