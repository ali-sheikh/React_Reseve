import Stripe from 'stripe'
import uuidv4 from 'uuid/v4'
import jwt from 'jsonwebtoken'
import Cart from '../../models/Cart'
import Order from '../../models/Order'
import calculateCartTotal from '../../utils/calculateCartTotal'

const stripe = Stripe(process.env.STRIPE_SECRET_KEY)

export default async(req, res) => {
    const { paymentData } = req.body

    try{
        //1) Verify and get user id from token
        const { userId } = jwt.verify(req.headers.authorization, 
        process.env.JWT_SECRET)
        //2) Find the card based on userId and populate
        const cart = await Cart.findOne({ user: userId}).populate({
            path: "products.product",
            model: "Product"
        })
        //3) Calculate  cart totals again from the cart products
        const { cartTotal, stripeTotal } = calculateCartTotal(cart.products)
        //4) Get the email from the payment data, see is the email is linked with existing Stripe customer
        const prevCustomer = await stripe.customers.list({
            email: paymentData.email,
            limit: 1
        })
        const isExistingCustomer = prevCustomer.data.length > 0
        //5) If not existing customer create based on thier email
        let newCustomer
        if(!isExistingCustomer){
            newCustomer = await stripe.customers.create({
                email: paymentData.email,
                source: paymentData.id
            })
        }

        const customer = (isExistingCustomer && prevCustomer.data[0].id) || newCustomer.id
        //6) Create a charge with total, send reciept email
        const charge = await stripe.charges.create({
            currency: "USD",
            amount: stripeTotal,
            receipt_email: paymentData.email,
            customer,
            description: `Checkout | ${paymentData.email} | ${paymentData.id}`
        }, {
            idempotency_key: uuidv4()
        })
        //7) Add the order data to our DB
        await new Order({
            user: userId,
            email: paymentData.email,
            total: cartTotal,
            products: cart.products
        }).save()
        //8) Clear products in cart
        await Cart.findOneAndUpdate(
            { _id: cart._id },
            { $set: { products: []} }
            )
        //9) Send back success or 200
        res.send(200).send("Checkout Successful!")
    }catch(error){
        console.error(error)
        res.status(500).send("error processing charge")
    }
}