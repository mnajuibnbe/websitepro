import jwt from 'jsonwebtoken';

const TOKEN_EXPIRATION = '2h'; // 2 hours to allow pausing and seeking during a typical lesson

export interface StreamTokenPayload {
  fileId: string;
}

/**
 * Generates a signed JWT token for streaming a specific video file.
 */
export const generateStreamToken = (payload: StreamTokenPayload): string => {
  const secret = process.env.STREAMING_TOKEN_SECRET;
  if (!secret) {
    throw new Error('STREAMING_TOKEN_SECRET is not configured');
  }

  // Generate token including only fileId
  return jwt.sign(payload, secret, { expiresIn: TOKEN_EXPIRATION });
};

/**
 * Verifies a streaming token and returns its payload.
 */
export const verifyStreamToken = (token: string): StreamTokenPayload => {
  const secret = process.env.STREAMING_TOKEN_SECRET;
  if (!secret) {
    throw new Error('STREAMING_TOKEN_SECRET is not configured');
  }

  try {
    const decoded = jwt.verify(token, secret) as StreamTokenPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired streaming token');
  }
};
