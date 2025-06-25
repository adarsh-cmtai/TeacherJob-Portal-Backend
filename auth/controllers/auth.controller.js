import { User } from '../../models/User.model.js';
import { EmployerProfile } from '../../employer/models/profile.model.js';
import { CollegeProfile } from '../../college/models/profile.model.js';
import { AdminProfile } from '../../admin/models/profile.model.js';
import { Application } from '../../employer/models/application.model.js';
import jwt from 'jsonwebtoken';

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const sendTokenResponse = (user, statusCode, res) => {
    const token = generateToken(user._id, user.role);
    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        // sameSite: 'none',
    };
    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            user: { id: user._id, email: user.email, role: user.role }
        });
};

export const signup = async (req, res) => {
    const { fullName, email, password, confirmPassword, role } = req.body;

    if (!fullName || !email || !password || !confirmPassword || !role) {
        return res.status(400).json({ success: false, message: 'Please provide all fields' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }

        const user = await User.create({ email, password, role });

        if (role === 'employer') {
            await EmployerProfile.create({ user: user._id, name: fullName });
        } else if (role === 'college') {
            await CollegeProfile.create({ user: user._id, name: fullName });
        } else if (role === 'admin') {
            await AdminProfile.create({ user: user._id, name: fullName });
        }

        sendTokenResponse(user, 201, res);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }
    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        sendTokenResponse(user, 200, res);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const logout = (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req, res) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: { id: user._id, email: user.email, role: user.role } });
};

export const updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user.id).select('+password');
        if (!(await user.comparePassword(currentPassword))) {
            return res.status(401).json({ success: false, message: 'Incorrect current password' });
        }
        user.password = newPassword;
        await user.save();
        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteAccount = async (req, res) => {
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required to delete account' });
    }
    try {
        const user = await User.findById(req.user.id).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Incorrect password' });
        }

        if (user.role === 'employer') {
            await EmployerProfile.deleteOne({ user: req.user.id });
            await Application.deleteMany({ user: req.user.id });
        } else if (user.role === 'college') {
            await CollegeProfile.deleteOne({ user: req.user.id });
        } else if (user.role === 'admin') {
            await AdminProfile.deleteOne({ user: req.user.id });
        }

        await user.deleteOne();

        res.cookie('token', 'none', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true,
        });
        res.status(200).json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
