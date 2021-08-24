var cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
});
export const config = {
    api: {
        bodyParser: {
            sizeLimit: "200mb",
        },
    },
};

export default async function handler(req, res) {
    if (req.method === "POST") {
        console.log("bakend begins...");
        // Process a POST request
        let uploaded_url = ""
        try {
            let fileStr = req.body.data;
            console.log("backend received");

            const uploadedResponse = await cloudinary.uploader.upload_large(
                fileStr,
                {
                    resource_type: "video",
                    chunk_size: 6000000,
                }
            );
            console.log("uploaded_url", uploadedResponse.secure_url)
            uploaded_url = uploadedResponse.secure_url

        } catch (error) {
            console.log("error", error);
            res.status(500).json({ error: "Something wrong" });
        }

    //     res.status(200).json({ data: uploaded_url });
    //     console.log("backend complete")
    }
}