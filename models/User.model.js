import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['employee', 'employer', 'admin', 'college'], required: true },
}, { timestamps: true });

userSchema.pre('save', async function (next) {  
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password,  10);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model('User', userSchema);