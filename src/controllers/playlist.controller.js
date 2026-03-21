import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    //TODO: create playlist
    if (!(name || name.trim()) == "") {
        throw new ApiError("Playlist name is required", 400)
    }
    if (!(description || description.trim()) == "") {
        throw new ApiError("Playlist description is required", 400)
    }

    const playlist = new Playlist({
        name,
        description,
        owner: req.user._id
    })
    await playlist.save()
    return res.status(201)
        .json(new ApiResponse(201, { playlist }, "Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists

    if (!isValidObjectId(userId)) {
        throw new ApiError("Invalid user ID", 400)
    }

    const playLists = (await Playlist.find({ owner: userId })).sort({ createdAt: -1 })
    if (!playLists) {
        throw new ApiError("No playlists found for this user", 404)
    }
    return res.status(200)
        .json(new ApiResponse(200, { playLists }, "User playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError("Invalid playlist ID", 400)
    }

    const playList = await Playlist
        .findById(playlistId)
        .populate("videos")
        .populate("owner", "username avatar")
    if (!playList) {
        throw new ApiError("Playlist not found", 404)
    }

    return res.status(200)
        .json(new ApiResponse(200, { playList }, "Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError("Invalid playlist ID", 400)
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError("Invalid video ID", 400)
    }

    const playList = await Playlist.findById(playlistId)
    if (!playList) {
        throw new ApiError("Playlist not found", 404)
    }
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist")
    }


    if (!playList.videos.includes(videoId)) {
        throw new ApiError("Video not found in playlist", 404)
    }

    await playList.findByIdAndUpdate(playlistId, {
        $pull: { videos: videoId }
    }, { new: true })

    return res.status(200)
        .json(new ApiResponse(200, null, "Video removed from playlist successfully"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError("Invalid playlist ID", 400)
    }
    const playList = await Playlist.findById(playlistId)
    if (!playList) {
        throw new ApiError("Playlist not found", 404)
    }
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this playlist")
    }
    await Playlist.findByIdAndDelete(playlistId)
    return res.status(200)
        .json(new ApiResponse(200, null, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist

    if (!isValidObjectId(playlistId)) {
        throw new ApiError("Invalid playlist ID", 400)
    }
    if (!(name || name.trim()) == "") {
        throw new ApiError("Playlist name is required", 400)
    }
    if (!(description || description.trim()) == "") {
        throw new ApiError("Playlist description is required", 400)
    }

    const playList = await Playlist.findById(playlistId)
    if (!playList) {
        throw new ApiError("Playlist not found", 404)
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this playlist")
    }   
    if (name) playList.name = name
    if (description) playList.description = description 
    await playList.save()
    return res.status(200)
        .json(new ApiResponse(200, { playList }, "Playlist updated successfully"))

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}