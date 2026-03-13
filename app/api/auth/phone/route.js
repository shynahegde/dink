export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendSMS(to, body) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    throw new Error("Twilio env vars not configured");
  }

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twilio error: ${err}`);
  }
}

export async function POST(request) {
  try {
    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }

    const normalized = phone.replace(/[\s\-()]/g, "");
    if (!/^\+?[1-9]\d{7,14}$/.test(normalized)) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    await getAdminDb().collection("otps").doc(normalized).set({
      otp,
      expiresAt,
      attempts: 0,
      createdAt: new Date().toISOString(),
    });

    await sendSMS(normalized, `Your DINK code is: ${otp}. Valid for 10 minutes.`);

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("Phone OTP send error:", error);
    return NextResponse.json({ error: "Failed to send code. Please try again." }, { status: 500 });
  }
}
