import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import pool from "../config/db.js";

const client = jwksClient({
  jwksUri: `https://cognito-idp.${process.env.REGION}.amazonaws.com/${process.env.USER_POOL_ID}/.well-known/jwks.json`
});

const getKey = (header, callback) => {
  client.getSigningKey(header.kid, function (err, key) {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
};

export const verifyToken = (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "No token provided"
      });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(
      token,
      getKey,
      {
        issuer: `https://cognito-idp.${process.env.REGION}.amazonaws.com/${process.env.USER_POOL_ID}`
      },
      async (err, decoded) => {

        if (err) {
          console.log("JWT ERROR:", err);
          return res.status(401).json({
            message: "Invalid token"
          });
        }

        /**
         * decoded.sub = Cognito userId
         */
        const user = await pool.query(
          "SELECT * FROM users WHERE user_id=$1",
          [decoded.sub]
        );

        if (!user.rows.length) {
          return res.status(403).json({
            message: "User not registered"
          });
        }

        req.user = user.rows[0];

        next();
      }
    );

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Authentication failed"
    });

  }
};