import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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
    console.log("email", email, fullName)


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

    const existedUser = User.findOne({
        $or: [{ email }, { userName }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with these credentials already existed!")
    }

    // //4. check for images, check for avatar

    const avatarlLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0].path

    if (!avatarlLocalPath) {
        throw new ApiError(400, "Avatar file is required.")
    }
    // //5. upload them to cloudinary

    const avatar = await uploadOnCloudinary(avatarlLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required.")
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
    const createdUser = await user.findById(user._id).select("-password -refreshToken")
    if(!createdUser){
        throw new ApiError(500, "something went wron while registring a user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfuly!")
    )
})

export { registerUser }