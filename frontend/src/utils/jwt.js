/**
 * Decodes a JWT token payload without verifying the signature.
 * Signature verification is done server-side.
 */
export const jwtDecode = (token) => {
  if (!token) throw new Error("No token provided");
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT structure");
  const payload = parts[1];
  // Base64url → Base64 → JSON
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const jsonStr = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
  );
  return JSON.parse(jsonStr);
};
