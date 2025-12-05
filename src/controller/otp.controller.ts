import { Request, Response } from "express";
import { generateOtp, verifyOtp } from "../services/otp.service";
import { otpValidatorType, generateOtpScema } from "../validator/otp.validator";

export const generateOtpController = async (req: Request, res: Response) => {
  try {
    const data: otpValidatorType = req.body;
    const otpRes = await generateOtp(data);
    res.status(200).json(otpRes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error", error: err });
  }
};

export const verifyOtpController = async (req: Request, res: Response) => {
  try {
    const data: otpValidatorType = generateOtpScema.parse(req.body);
    const otpRes = await verifyOtp(data);
    res.status(200).json(otpRes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error", error: err });
  }
};
