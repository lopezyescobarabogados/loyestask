import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
    email: string
    password: string
    name: string
    confirmed: boolean
    role: 'admin' | 'user'
}

const userSchema: Schema = new Schema({
    email : {
        type: String,
        require: true,
        lowercase: true,
        unique: true
    }, 
    password : {
        type: String,
        require: true
    },
    name : {
        type: String,
        require: true
    },
    confirmed : {
        type: Boolean,
        default: false
    },
    role : {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    }
})

const User = mongoose.model<IUser>('User', userSchema)
export default User

