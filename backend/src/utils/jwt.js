// BACKEND/utils/jwt.js
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-very-long-random-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-even-longer-refresh-secret';
export const HALF_HOUR = 30 * 60 * 1000;
export const ONE_DAY = 24 * 60 * 60 * 1000;
export const ONE_MONTH = 30 * ONE_DAY;
export const ACCESS_TOKEN_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
};
export const REFRESH_TOKEN_OPTIONS = {
    ...ACCESS_TOKEN_OPTIONS,
    sameSite: 'strict'
};

export const generateAccessToken = (payload) => {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '30m' }); // adjust as needed
};

// Refresh Token to be generated only during the successful-login! Expires in 30 days. Period.
export const generateRefreshToken = (payload) => {
    const jti = uuidv4();
    const token = jwt.sign({ ...payload, jti }, REFRESH_SECRET, { expiresIn: '30d' });
    return { token, jti };
};

export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, ACCESS_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
        return {};
    }
};

export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, REFRESH_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
        return {};
    }
};