"use server";

import { prisma } from "@/lib/prisma";

export async function getAllTeamMembers() {
  try {
    const teamMembers = await prisma.team.findMany({
      orderBy: { order: 'asc' }
    });
    
    return { success: true, data: teamMembers };
  } catch (error) {
    console.error("Error fetching team members:", error);
    return { success: false, message: "Failed to fetch team members." };
  }
}

export async function createTeamMember(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const position = formData.get("position") as string;
  const imageFile = formData.get("image") as File;
  const order = parseInt(formData.get("order") as string) || 0;

  if (!name || !position) {
    return { success: false, message: "Name and position are required." };
  }

  try {
    // Get current team members to determine the order
    const currentMembers = await prisma.team.findMany({
      orderBy: { order: 'desc' },
      take: 1
    });
    
    const nextOrder = order > 0 ? order : (currentMembers[0]?.order || 0) + 1;

    // Handle image upload
    let imageUrl = "/images/placeholder.jpg";
    if (imageFile && imageFile.size > 0) {
      // For now, convert to base64. In production, you'd upload to Cloudinary
      imageUrl = `data:${imageFile.type};base64,${Buffer.from(await imageFile.arrayBuffer()).toString("base64")}`;
    }

    // Create new team member in database
    const newMember = await prisma.team.create({
      data: {
        name,
        position,
        image: imageUrl,
        order: nextOrder,
      },
    });

    return { success: true, message: "Team member added successfully!", teamMember: newMember };
  } catch (error) {
    console.error("Error creating team member:", error);
    return { success: false, message: "Failed to add team member." };
  }
}

export async function updateTeamMember(prevState: any, formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const position = formData.get("position") as string;
  const imageFile = formData.get("image") as File;
  const order = parseInt(formData.get("order") as string) || 0;

  if (!id || !name || !position) {
    return { success: false, message: "ID, name, and position are required." };
  }

  try {
    // Handle image upload
    let imageUrl = undefined;
    if (imageFile && imageFile.size > 0) {
      // For now, convert to base64. In production, you'd upload to Cloudinary
      imageUrl = `data:${imageFile.type};base64,${Buffer.from(await imageFile.arrayBuffer()).toString("base64")}`;
    }

    // Update team member in database
    const updatedMember = await prisma.team.update({
      where: { id },
      data: {
        name,
        position,
        order,
        ...(imageUrl && { image: imageUrl }),
      },
    });

    return { success: true, message: "Team member updated successfully!", teamMember: updatedMember };
  } catch (error) {
    console.error("Error updating team member:", error);
    return { success: false, message: "Failed to update team member." };
  }
}

export async function deleteTeamMember(teamMemberId: string) {
  try {
    const teamMember = await prisma.team.findUnique({
      where: { id: teamMemberId }
    });

    if (!teamMember) {
      return { success: false, message: "Team member not found." };
    }

    await prisma.team.delete({
      where: { id: teamMemberId }
    });

    return { 
      success: true, 
      message: `Team member "${teamMember.name}" has been deleted successfully.` 
    };
  } catch (error) {
    console.error("Error deleting team member:", error);
    return { success: false, message: "Failed to delete team member." };
  }
}
