
import express from 'express';
import { dbStore } from '../db/store.js';
import {
  hashPassword,
  verifyPassword,
  generateTokens,
  rotateRefreshToken,
  mockOtpProvider
} from '../services/authService.js';
import { authenticate, requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  signupSchema,
  loginSchema,
  refreshSchema,
  otpSendSchema,
  otpVerifySchema
} from '../validators/schemas.js';

const router = express.Router();

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...sanitized } = user;
  return sanitized;
}

// GET /api/v1/auth/personas - List all personas for 1-click test login
router.get('/personas', (req, res) => {
  const users = dbStore.getUsers();
  res.json({
    success: true,
    count: users.length,
    data: users.map(sanitizeUser)
  });
});

// POST /api/v1/auth/signup - Email + Password Registration with Argon2
router.post('/signup', validateBody(signupSchema), async (req, res) => {
  try {
    const { email, password, fullName, phone, role = 'PASSENGER' } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Email, password, and full name are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check existing email
    const existing = dbStore.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'USER_ALREADY_EXISTS',
        message: `A user with email ${email} already exists.`
      });
    }

    // Hash with Argon2id
    const passwordHash = await hashPassword(password);

    const newUser = dbStore.createUser({
      email,
      fullName,
      phone,
      role: ['ADMIN', 'DRIVER', 'PASSENGER'].includes(role) ? role : 'PASSENGER',
      passwordHash,
      isEmailVerified: true
    });

    const tokens = generateTokens(newUser);

    res.status(201).json({
      success: true,
      message: 'Account created successfully with secure Argon2 credentials',
      data: {
        user: sanitizeUser(newUser),
        ...tokens
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'SIGNUP_FAILED', message: err.message });
  }
});

// POST /api/v1/auth/login - Persona, Phone, Email+Password, or Email+OTP Login
router.post('/login', validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password, personaId, phoneNumber, otp } = req.body;

    let user = null;

    // 1. Persona ID login (for 1-click test & backward compatibility)
    if (personaId) {
      user = dbStore.getUserById(personaId);
    }
    // 2. Email + OTP login
    else if (email && otp) {
      const verifyRes = await mockOtpProvider.verifyOtp(email, otp);
      if (!verifyRes.success) {
        return res.status(401).json({
          success: false,
          error: verifyRes.error || 'INVALID_OTP',
          message: 'The OTP entered is invalid or expired.'
        });
      }
      user = dbStore.getUserByEmail(email);
      if (!user) {
        user = dbStore.createUser({
          email,
          fullName: email.split('@')[0],
          isEmailVerified: true
        });
      }
    }
    // 3. Email + Password login (Argon2 verified)
    else if (email && password) {
      user = dbStore.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.'
        });
      }

      // If user has passwordHash, verify with Argon2; if persona demo without password, check default demo password
      let isValid = false;
      if (user.passwordHash) {
        isValid = await verifyPassword(user.passwordHash, password);
      } else if (password === 'password123' || password === 'SwariSecure@2026') {
        isValid = true;
      }

      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.'
        });
      }
    }
    // 4. Phone login (legacy test fallback)
    else if (phoneNumber) {
      user = dbStore.getUserByPhone(phoneNumber);
      if (!user) {
        user = dbStore.createUser({
          fullName: 'New Traveler',
          phone: phoneNumber,
          role: 'PASSENGER'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'Must provide either (email, password), (email, otp), personaId, or phoneNumber.'
      });
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'USER_NOT_FOUND', message: 'User could not be found' });
    }

    const tokens = generateTokens(user);

    res.json({
      success: true,
      message: 'Authentication successful',
      data: {
        user: sanitizeUser(user),
        ...tokens
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'LOGIN_FAILED', message: err.message });
  }
});

// POST /api/v1/auth/refresh - Refresh Token Rotation
router.post('/refresh', validateBody(refreshSchema), (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'refreshToken is required in request body.'
      });
    }

    // Decode to find user
    const decoded = jwtDecode(refreshToken);
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid or malformed.'
      });
    }

    const user = dbStore.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User associated with refresh token no longer exists.'
      });
    }

    const rotated = rotateRefreshToken(refreshToken, user);

    res.json({
      success: true,
      message: 'Tokens rotated successfully under refresh rotation security policy',
      data: rotated
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'REFRESH_TOKEN_EXPIRED_OR_REUSED',
      message: err.message || 'Invalid or revoked refresh token.'
    });
  }
});

function jwtDecode(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

// POST /api/v1/auth/otp/send - Send Simulated OTP
router.post('/otp/send', validateBody(otpSendSchema), async (req, res) => {
  try {
    const { destination, email } = req.body;
    const dest = destination || email;
    if (!dest) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'email or destination is required'
      });
    }

    const result = await mockOtpProvider.sendOtp(dest);
    res.json({
      success: true,
      message: result.message,
      provider: result.provider,
      referenceId: result.referenceId,
      mockOtp: result.mockOtp // Available in test/demo mode
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'OTP_SEND_FAILED', message: err.message });
  }
});

// POST /api/v1/auth/otp/verify - Verify Simulated OTP
router.post('/otp/verify', validateBody(otpVerifySchema), async (req, res) => {
  try {
    const { destination, email, otp } = req.body;
    const dest = destination || email;
    if (!dest || !otp) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'destination/email and otp are required'
      });
    }

    const verifyRes = await mockOtpProvider.verifyOtp(dest, otp);
    if (!verifyRes.success) {
      return res.status(401).json({
        success: false,
        error: verifyRes.error,
        message: 'OTP verification failed or expired'
      });
    }

    let user = dbStore.getUserByEmail(dest) || dbStore.getUserByPhone(dest);
    if (!user) {
      user = dbStore.createUser({
        email: dest.includes('@') ? dest : undefined,
        phone: !dest.includes('@') ? dest : undefined,
        fullName: dest.includes('@') ? dest.split('@')[0] : 'Verified Traveler',
        isEmailVerified: dest.includes('@'),
        isPhoneVerified: !dest.includes('@')
      });
    }

    const tokens = generateTokens(user);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        user: sanitizeUser(user),
        ...tokens
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'OTP_VERIFY_FAILED', message: err.message });
  }
});

// GET /api/v1/auth/me - Current User Profile (Protected)
router.get('/me', authenticate, requireAuth, (req, res) => {
  const user = dbStore.getUserById(req.user.id) || req.user;
  res.json({
    success: true,
    data: sanitizeUser(user)
  });
});

export default router;
