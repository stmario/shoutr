"use server"

import { put } from "@vercel/blob"
import { getCurrentUser } from "@/lib/auth"

export async function uploadImage(formData: FormData) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to upload images" }
    }

    const file = formData.get("file") as File

    if (!file) {
      return { success: false, message: "No file provided" }
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      return { success: false, message: "Invalid file type. Please upload an image (JPEG, PNG, GIF, or WEBP)" }
    }

    // Validate file size (max 4MB)
    const maxSize = 4 * 1024 * 1024 // 4MB
    if (file.size > maxSize) {
      return { success: false, message: "File too large. Maximum size is 4MB" }
    }

    // Generate a unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 10)
    const filename = `${currentUser.id}-${timestamp}-${randomString}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    })

    return {
      success: true,
      url: blob.url,
      contentType: file.type,
      size: file.size,
    }
  } catch (error) {
    console.error("Error uploading image:", error)
    return { success: false, message: "Failed to upload image" }
  }
}
