import {v2 as cloudinary} from "cloudinary"
import fs from "fs" //this is a default filesystem it works: read, write , remove, open, async etc.

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) =>{
    try {
        if(!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        //file has beed uploaded successfully
        console.log("File is uploaded successfully on cloudinary.",response.url)
        return response
        
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

//another short way to upload
// cloudinary.v2.uploader.upload("file-path", {public_id: "filename"},
//     function(error, res){
//         console.log(res)
// })


export {uploadOnCloudinary}