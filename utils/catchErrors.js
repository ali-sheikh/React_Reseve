function catchErrors(error, displayError){
    let errorMsg
    if(error.response){
        //The request was made and the server responded with a 
        //status code that is not in the range of 2xx
        errorMsg = error.response.data
        console.error("Errpr Response", errorMsg)
    } else if (error.resquest){
        //The request was made but no response was recieved
        errorMsg = error.resquest
        console.error("Error request", errorMsg)

        //For Cloudinary image uploads 
        if(error.response.data.error){
            errorMsg = error.response.data.error.message
        }
    } else {
        //There was something else happened in making the request that triggerd an error
        errorMsg = error.message
        console.error("Error message", errorMsg)
    }
    displayError(errorMsg)
}

export default catchErrors