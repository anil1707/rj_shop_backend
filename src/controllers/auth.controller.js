import { SignUpCommand, ConfirmSignUpCommand, InitiateAuthCommand, ResendConfirmationCodeCommand } 
from "@aws-sdk/client-cognito-identity-provider";
import { cognitoClient } from "../config/cognito.js";
import dotenv from 'dotenv';
import jwt from "jsonwebtoken"
import pool from "../config/db.js";

dotenv.config();

export const signup = async (req, res) => {
  try {

    const { email, password } = req.body;

    const command = new SignUpCommand({
      ClientId: process.env.CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: "email",
          Value: email
        }
      ]
    });

    const response = await cognitoClient.send(command);

    res.json(response);

  } catch (error) {

    // USER ALREADY EXISTS
    if (error.name === "UsernameExistsException") {

      try {

        const resendCommand = new ResendConfirmationCodeCommand({
          ClientId: process.env.CLIENT_ID,
          Username: req.body.email
        });

        await cognitoClient.send(resendCommand);

        return res.json({
          message: "User already exists. OTP resent.",
          email: req.body.email,
          needVerification: true
        });

      } catch (resendError) {

        return res.status(400).json({
          error: resendError
        })
      }

};
  }
}

export const verifyEmail = async (req, res) => {

  const { email, code } = req.body;

  const command = new ConfirmSignUpCommand({
    ClientId: process.env.CLIENT_ID,
    Username: email,
    ConfirmationCode: code
  });

  const response = await cognitoClient.send(command);

  res.json(response);

};

export const login = async (req, res) => {

  const { email, password } = req.body;

  try {
    const command = new InitiateAuthCommand({
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: process.env.CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password
    }
  });

  const response = await cognitoClient.send(command);
  const decoded = jwt.decode(response?.AuthenticationResult?.IdToken);
    await pool.query(
      `
    INSERT INTO users (user_id,email,role)
    VALUES ($1,$2,$3)
    ON CONFLICT (user_id) DO NOTHING
    `,
      [
        decoded?.sub,
        decoded.email,
        "user"
      ]
    );
  res.json(response.AuthenticationResult);
  } catch (error) {
    console.log("Error: ", error)
    res.status(400).json({ message: error|| "Server error" });
  }

};