export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;
  throw new Error('JWT_SECRET is required');
}
