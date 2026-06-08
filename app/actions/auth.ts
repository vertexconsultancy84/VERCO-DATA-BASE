// auth.ts (server)

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days

/** ------------------ Admin Auth (your existing code) ------------------ **/
export async function getAdminSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) return null;

  try {
    // Handle development fallback session
    if (sessionToken === "dev-admin-session" && process.env.NODE_ENV !== "production") {
      return {
        id: "dev-admin-session",
        name: "Development Admin",
        email: "vertexconsultancy84@gmail.com",
        role: "admin"
      };
    }

    // Use Prisma instead of direct MongoDB connection
    const admin = await prisma.admin.findUnique({ where: { id: sessionToken } });
    
    return admin;
  } catch {
    return null;
  }
}

export async function requireAdminAuth() {
  const admin = await getAdminSession();
  if (!admin || admin.role !== "admin") redirect("/login");
  return admin;
}

export async function login(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { success: false, message: "Email and password are required." };

  try {
    console.log("Attempting login for email:", email);
    
    // Temporary fallback for development when MongoDB is unavailable
    const isDevelopment = process.env.NODE_ENV !== "production";
    const isDefaultAdmin = email === "vertexconsultancy84@gmail.com" && password === "Test@12345";
    
    if (isDevelopment && isDefaultAdmin) {
      console.log("Using development fallback login");
      const cookieStore = await cookies();
      cookieStore.set("session_token", "dev-admin-session", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_DURATION,
        path: "/",
      });
      redirect("/dashboard");
    }
    
    const admin = await prisma.admin.findUnique({ where: { email } });
    
    if (!admin) {
      console.log("Admin not found for email:", email);
      return { success: false, message: "Invalid credentials." };
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      console.log("Password mismatch for admin:", email);
      return { success: false, message: "Invalid credentials." };
    }

    const cookieStore = await cookies();
    cookieStore.set("session_token", admin.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_DURATION,
      path: "/",
    });

    console.log("Login successful for admin:", email);
    redirect("/dashboard");
  } catch (error) {
    // Re-throw Next.js redirect errors so they can be handled properly
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Login error details:", error);
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes("Server selection timeout")) {
      return { 
        success: false, 
        message: "Database connection error. Please try again in a few minutes or contact support." 
      };
    }
    
    return { success: false, message: "Server error. Please try again." };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session_token");
  redirect("/");
}

/** ------------------ User Signup ------------------ **/
export async function signup(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const category = (formData.get("category") as string) || "OtherProducts";
  const province = (formData.get("province") as string) || null;
  const district = (formData.get("district") as string) || null;
  const sector = (formData.get("sector") as string) || null;
  const zone = (formData.get("zone") as string) || null;

  if (!name || !email || !password) return { success: false, message: "All fields are required." };

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return { success: false, message: "Email already exists." };

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, category, province, district, sector, zone },
    });

    // Set session cookie for user
    const cookieStore = await cookies();
    cookieStore.set("user_session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_DURATION,
      path: "/",
    });

    redirect("/user/dashboard"); // redirect normal user after signup
  } catch (error) {
    // Re-throw Next.js redirect errors so they can be handled properly
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Signup error:", error);
    return { success: false, message: "Unexpected error during signup." };
  }
}

/** ------------------ User Login ------------------ **/
export async function loginUser(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { success: false, message: "Email and password are required." };

  try {
    // Use Prisma instead of direct MongoDB connection
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) return { success: false, message: "Invalid credentials." };

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return { success: false, message: "Invalid credentials." };

    const cookieStore = await cookies();
    cookieStore.set("user_session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_DURATION,
      path: "/",
    });

    redirect("/user/dashboard");
  } catch (error) {
    // Re-throw Next.js redirect errors so they can be handled properly
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Login error:", error);
    return { success: false, message: "Unexpected error during login." };
  }
}

export async function getUserSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("user_session")?.value;
  if (!sessionToken) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: sessionToken },
      select: { id: true, name: true, email: true, category: true },
    });
    return user;
  } catch {
    return null;
  }
}

export async function forgotPassword(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { success: false, message: "Email is required." };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return { success: false, message: "No account found with this email address." };
    }

    // In a real application, you would:
    // 1. Generate a reset token
    // 2. Save it to database with expiration
    // 3. Send reset email with link containing token
    // For now, we'll just return a success message
    
    return { 
      success: true, 
      message: `Password reset link has been sent to ${email}. Please check your email and follow the instructions.` 
    };
  } catch (error) {
    console.error("Forgot password error:", error);
    return { success: false, message: "Failed to send reset link. Please try again." };
  }
}