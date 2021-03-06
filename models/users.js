const mongoose = require('mongoose');
mongoose.pluralize(null);
const validator = require('validator');
const bcrypt = require('bcryptjs');

//Create the Schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error('Email is invalid');
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if(value) {
                if(value.toLowerCase().includes('password')) {
                    throw new Error('Password cannot contain "password"')
                }
            }
        }
    }
})

// userSchema.statics.findByCredentials = async (email, password) => {
//     const user = await User.findOne({email});
//     if(!user) {
//         throw new Error('Unable to login');
//     }
//     const isMatch=  await bcrypt.compare(password, user.password)
//     if(!isMatch) {
//         throw new Error ('Unable to login');
//     }
//     return user;
// }

userSchema.pre('save', async function(next) {
    const user = this
    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    next();
})

const User = mongoose.model('Users', userSchema)

module.exports = User
