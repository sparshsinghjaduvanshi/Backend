import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { upload } from "../middlewares/multer.middleware.js"

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        console.log("Actual error: ", error)
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}
const registerUser = asyncHandler(async (req, res) => {
    // res.status(200).json({
    //     message: "OK hello world"
    // })

    // //1. get user details from frontend
    // //2. validation and authentication
    // //3. check if user is already exists. : through username or email
    // //4. check for images, check for avatar
    // //5. upload them to cloudinary
    // //6. create user object - create entry in db
    // //7. remove password and refresh token field from response
    // //8. check for user creation 
    // //10. return response

    // //1. get user details from frontend
    const { fullName, email, userName, password } = req.body //if data is coming from form or json
    // console.log("email", email, fullName)


    // //2. validation and authentication

    // if(fullName === ""){
    //     throw new ApiError(400, "FullName is required")
    // }

    if (
        [fullName, email, userName, password].some((field) =>
            field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required. ")
    }

    // //3. check if user is already exists. : through username or email

    const existedUser = await User.findOne({
        $or: [{ email }, { userName }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with these credentials already existed!")
    }

    // //4. check for images, check for avatar

    const avatarlLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path  //because there is a ? if we do not send the coverImage the error will be shown as cannot read propertyof undefined

    //to resolve this
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        console.log("this is the cover image", req.files.coverImage)
        console.log("this is the cover image path", req.files.coverImage.path)
        coverImageLocalPath = req.files.coverImage[0].path
    } else {
        console.log("CoverImage does not exists")
    }

    console.log("FILES:", req.files)
    console.log("Avatar path:", avatarlLocalPath)

    if (!avatarlLocalPath) {
        throw new ApiError(400, "Avatar file is required.")
    }
    // //5. upload them to cloudinary

    const avatar = await uploadOnCloudinary(avatarlLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required and it is missing.")
    }

    // //6. create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase()

    })

    //this line responsible for selecting the data that i don't want to be shown in my database
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw new ApiError(500, "something went wron while registring a user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfuly!")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    //TODO'S
    //1. req body -> data
    //2. userName or email based login
    //3. find the user
    //4. password check
    //5. access and refresh token
    //6. send cookies

    //1. req body -> data
    const { email, userName, password } = req.body
    if (!userName && !email) {
        throw new ApiError(400, "username of password required!")
    }

    const user = await User.findOne({
        $or: [{ userName }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exists!")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

    //6. send cookies
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true, // now cokkies can only be modified by the server
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser, accessToken,
                refreshToken
            },
                "User logged In successfully"
            )
        )
})

const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            // new: true //deprecated
            returnDocument: "after" //new way
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

        if (!incomingRefreshToken) {
            throw new ApiError(401, "unauthorized request")
        }

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id,)
        return res.
            status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(200,
                    { accessToken, refreshToken: newRefreshToken }, "Access token refreshed"
                )
            )
    } catch (error) {
        console.log("actual error: ", error)
        throw new ApiError(401, "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmNewPassword } = req.body
    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    if (newPassword !== confirmNewPassword) {
        throw new ApiError(400, "New passwords do not match")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.status(200)
        .json(new ApiResponse(200, {}, "Password updated successfully"))
})

const currentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password -refreshToken")
    return res.status(200)
        .json(new ApiResponse(200, { user }, "Current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, userName, email } = req.body

    if (!(fullName || email)) {
        throw new ApiError(400, "At least one field is required to update")
    }

    const user = User.findByIdAndUpdate(req?.user._id, {
        $set: {
            fullName,
            email: email,
        }
    }, { returnDocument: "after" }).select("-password")

    return res.status(200)
        .json(new ApiResponse(200, { user }, "User details updated successfully"))

})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    //TODO: delete the previous avatar from cloudinary to save storage and avoid unnecessary costs

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar) {
        throw new ApiError(400, "Error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { returnDocument: "after" }.select("-password")
    )

    return res.status(200)
        .json(new ApiResponse(200, { user }, "Avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage) {
        throw new ApiError(400, "Error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { returnDocument: "after" }.select("-password")
    )

    return res.status(200)
        .json(new ApiResponse(200, { user }, "Cover image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { userName } = req.params;
    if (!userName?.trim()) {
        throw new ApiError(400, "Username is required")
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: userName.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribeTo"
            }
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" },
                channelSubscribeToCount: { $size: "$subscribeTo" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }

        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                subscribersCount: 1,
                channelSubscribeToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ]) // it returns arrays

    if (!channel?.length) {
        throw new ApiError(404, "Channel not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { channel: channel[0] }, "Channel profile fetched successfully"))
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline: {
                            $project: {
                                fullName: 1,
                                userName: 1,
                                avatar: 1
                            }
                        }
                    },
                    $addFields: {
                        $first: "$owner"

                    }
                }
            }
        }
    ])

    return res.status(200)
        .json(new ApiResponse(200, { watchHistory: user[0].watchHistory }, "Watch history fetched successfully"))
})



export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    currentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}