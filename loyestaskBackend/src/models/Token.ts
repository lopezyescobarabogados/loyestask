import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IToken extends Document {
    token: string
    user: Types.ObjectId
    createdAt: Date
}

const tokenSchema : Schema = new Schema({
    token: {
        type: String,
        require: true
    },
    user: {
        type: Types.ObjectId,
        ref: 'User'
    },
    expiresAt: {
        type: Date,
        default: Date.now,
        expires: "10m"
    }
})

const Token = mongoose.model<IToken>('Token', tokenSchema)
export default Token 
