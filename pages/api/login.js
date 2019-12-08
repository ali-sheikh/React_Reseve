import connectDb from '../../utils/connectDb'
import User from '../../models/User'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

connectDb()

export default async (req, res) =>{
    const { email, password } = req.body
    try{
        //1) check to see if a user exist in the data base with the provided email
        const user = await User.findOne({ email }).select("+password")
        // 2) return error is we don't have a user
        if(!user) {
            return res.status(404).send("No urser exist with that email")
        }
        //3) if the users pass is correct
        const passwordsMatch = await bcrypt.compare(password, user.password)
        //4)  if so, generate a token
        
        if (passwordsMatch){
            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })
             // 5) send that token to the client
             res.status(200).json(token)
        }else {
            res.status(401).send('passwords do not match')
        }
    }catch (error){
        console.error(error)
        res.send(500).send("Error logging in user")
    }
}