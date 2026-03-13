export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function POST(request) {
  try {
    const { phone, code } = await request.json();
    if (!phone || !code) {
      return NextResponse.json({ error: "Phone and code required" }, { status: 400 });
    }

    const normalized = phone.replace(/[\s\-()]/g, "");
    const db = getAdminDb();
    const otpDoc = await db.collection("otps").doc(normalized).get();

    if (!otpDoc.exists) {
      return NextResponse.json({ error: "Code expired or not found. Request a new one." }, { status: 400 });
    }

    const { otp, expiresAt, attempts } = otpDoc.data();

    if (Date.now() > expiresAt) {
      await otpDoc.ref.delete();
      return NextResponse.json({ error: "Code has expired. Request a new one." }, { status: 400 });
    }

    if (attempts >= 5) {
      await otpDoc.ref.delete();
      return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 400 });
    }

    if (code !== otp) {
      await otpDoc.ref.update({ attempts: attempts + 1 });
      return NextResponse.json({ error: "Incorrect code. Try again." }, { status: 400 });
    }

    // Code is valid — delete it
    await otpDoc.ref.delete();

    // Find or create user by phone
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("phone", "==", normalized).limit(1).get();

    let userId, userData;
    if (snapshot.empty) {
      const newUser = {
        phone: normalized,
        name: "",
        subscribed: false,
        stripeCustomerId: null,
        region: "US",
        createdAt: new Date().toISOString(),
      };
      const ref = await usersRef.add(newUser);
      userId = ref.id;
      userData = newUser;
    } else {
      userId = snapshot.docs[0].id;
      userData = snapshot.docs[0].data();
    }

    const token = signToken({
      uid: userId,
      phone: normalized,
      name: userData.name || "",
      subscribed: userData.subscribed || false,
    });

    const response = NextResponse.json({
      user: {
        uid: userId,
        phone: normalized,
        name: userData.name || "",
        subscribed: userData.subscribed || false,
      },
    });

    response.headers.set("Set-Cookie", setAuthCookie(token)["Set-Cookie"]);
    return response;
  } catch (error) {
    console.error("Phone OTP verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
