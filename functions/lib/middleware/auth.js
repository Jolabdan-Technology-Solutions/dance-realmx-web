"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFirebaseToken = validateFirebaseToken;
exports.requireRoles = requireRoles;
const admin = __importStar(require("firebase-admin"));
async function validateFirebaseToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        // Attach user info to request
        req.user = decodedToken;
        next();
    }
    catch (error) {
        console.error('Token validation error:', error);
        return res.status(401).json({ error: 'Invalid token' });
    }
}
function requireRoles(roles) {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            // Get user roles from Firestore
            const userDoc = await admin.firestore().collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            if (!userData) {
                return res.status(404).json({ error: 'User not found' });
            }
            const userRoles = userData.role || ['GUEST_USER'];
            const hasRequiredRole = roles.some(role => userRoles.includes(role));
            if (!hasRequiredRole && !userRoles.includes('ADMIN')) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }
            next();
        }
        catch (error) {
            console.error('Role validation error:', error);
            return res.status(500).json({ error: 'Permission check failed' });
        }
    };
}
//# sourceMappingURL=auth.js.map