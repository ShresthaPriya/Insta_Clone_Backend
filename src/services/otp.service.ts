import otpGenerator from "otp-generator";
import { prisma } from "../lib/prisma";
import { otpValidatorType } from "../validator/otp.validator";
import { RegisterUser } from "./user.service";


export const generateOtp = async (data: otpValidatorType) => {
  const { phoneNumber, userInfo } = data;
  const maxAttempts = 5;
  const now = new Date();

  const existingUser = await prisma.user.findUnique({
    where: { phoneNumber },
  });

  if (existingUser) {
    return {
      success: false,
      message: "Phone number is already registered.",
    };
  }

  const existingOtp = await prisma.otp.findFirst({
    where: { phoneNumber },
    orderBy: { createdAt: "desc" },
  });

  let attemptCount = 1;

  if (existingOtp) {
    if (existingOtp.nextAttemptAt && now < existingOtp.nextAttemptAt) {
      const waitSeconds = Math.ceil(
        (existingOtp.nextAttemptAt.getTime() - now.getTime()) / 1000
      );
      return {
        success: false,
        message: `Please wait for ${waitSeconds}s before requesting another OTP.`,
        waitSeconds,
      };
    }

    attemptCount = existingOtp.attemptCount + 1;

    if (attemptCount > maxAttempts) {
      const time = new Date();
      time.setDate(time.getDate() + 1);
      time.setHours(0, 0, 0, 0);

      const waitSeconds = Math.ceil((time.getTime() - now.getTime()) / 1000);

      await prisma.otp.update({
        where: { id: existingOtp.id },
        data: {
          nextAttemptAt: time,
          attemptCount: existingOtp.attemptCount,
        },
      });

      return {
        success: false,
        message: "Too many attempts. Try again tomorrow.",
        waitSeconds,
      };
    }
  }

  const otpGen = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
    digits: true,
  });

  const fibonacciMinutes = [2, 3, 5, 8, 13];
  const waitMinutes = fibonacciMinutes[Math.min(attemptCount - 1, fibonacciMinutes.length - 1)];

  const nextAttemptAt = new Date(now.getTime() + waitMinutes * 60 * 1000);
  const waitSeconds = waitMinutes * 60;

  const otpRecord = existingOtp
    ? await prisma.otp.update({
        where: { id: existingOtp.id },
        data: {
          otp: otpGen,
          attemptCount,
          nextAttemptAt,
          createdAt: now,
          userInfo: userInfo ?? existingOtp.userInfo ?? {},
        },
      })
    : await prisma.otp.create({
        data: {
          phoneNumber,
          otp: otpGen,
          attemptCount,
          nextAttemptAt,
          createdAt: now,
          userInfo: userInfo ?? {},
        },
      });

  return {
    success: true,
    message: "OTP generated successfully.",
    otp: otpRecord.otp,
    attemptCount,
    waitSeconds,
  };
};



export const verifyOtp = async (data: otpValidatorType) => {
  const { phoneNumber, otp } = data;

  const otpRec = await prisma.otp.findFirst({
    where: { phoneNumber },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRec) return { success: false, message: "OTP not found." };

  const now = new Date();
  const expiresAt = new Date(otpRec.createdAt.getTime() + 2 * 60 * 1000);
  if (now > expiresAt) return { success: false, message: "OTP expired." };

  if (otpRec.otp !== otp) return { success: false, message: "Invalid OTP." };

  const userInfo: any = otpRec.userInfo;
  if (!userInfo) return { success: false, message: "User info missing!" };

  const createdUser = await RegisterUser({
    fullName: userInfo.fullName,
    userName: userInfo.userName,
    phoneNumber: userInfo.phoneNumber,
    password: userInfo.password,
    phoneVerified: true
  });

  await prisma.otp.delete({ where: { id: otpRec.id } });

  return {
    success: true,
    message: "OTP verified. User registered successfully.",
    user: createdUser,
  };
};
