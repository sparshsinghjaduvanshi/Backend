import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const userId = req.user._id
    //TODO: toggle like on video
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400,"Invalid video ID")
    }
    if(!isValidObjectId(userId)) {
        throw new ApiError(400,"Invalid user ID")
    }

    const existingLike = await Like.findOne({video: videoId, likedBy: userId})
    if(existingLike) { 
        await Like.deleteOne({_id: existingLike._id})
        return res.json(new ApiResponse(200, "Video unliked successfully"))
    }

    const newLike = new Like({
        video: videoId,
        likedBy: userId
    })
    await newLike.save()
    res.json(new ApiResponse(200,{ newLike }, "Video liked successfully"))


})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const userId = req.user._id
    //TODO: toggle like on comment

    if(!isValidObjectId(commentId)) {
        throw new ApiError(400,"Invalid comment ID")
    }   
    if(!isValidObjectId(userId)) {
        throw new ApiError(400,"Invalid user ID")
    }

    const existingLike = await Like.findOne({comment: commentId, likedBy: userId})
    if(existingLike) { 
        await Like.deleteOne({_id: existingLike._id})
        return res.json(new ApiResponse(200, "Comment unliked successfully"))
    }

    const newLike = new Like({
        comment: commentId,
        likedBy: userId 
    })
    await newLike.save()
    res.json(new ApiResponse(200,{ newLike }, "Comment liked successfully"))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const userId = req.user._id
    //TODO: toggle like on tweet
    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400,"Invalid tweet ID")
    }           
    if(!isValidObjectId(userId)) {
        throw new ApiError(400,"Invalid user ID")
    }   

    const existingLike = await Like.findOne({tweet: tweetId, likedBy: userId})
    if(existingLike) { 
        await Like.deleteOne({_id: existingLike._id})
        return res.json(new ApiResponse(200, "Tweet unliked successfully"))
    }

    const newLike = new Like({
        tweet: tweetId,
        likedBy: userId 
    })
    await newLike.save()
    res.json(new ApiResponse(200,{ newLike }, "Tweet liked successfully"))

})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.body
    if(!isValidObjectId(userId)) {
        throw new ApiError(400,"Invalid user ID")
    }
    const likedVideos = await Like.find({likedBy: userId, video: {$ne: null}}).populate("video")
    res.json(new ApiResponse(200, { likedVideos }, "Liked videos retrieved successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}