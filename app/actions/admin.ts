"use server";

import { prisma } from "@/lib/prisma";

export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        products: {
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add product count manually and handle potential null values
    const usersWithCount = users.map(user => ({
      ...user,
      updatedAt: user.updatedAt || new Date(), // Handle null updatedAt
      _count: {
        products: user.products.length
      }
    }));

    return { success: true, data: usersWithCount };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, message: "Failed to fetch users." };
  }
}

export async function getAllProductsForAdmin() {
  try {
    const products = await prisma.product.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Handle potential null values
    const productsWithDefaults = products.map(product => ({
      ...product,
      updatedAt: product.updatedAt || new Date(), // Handle null updatedAt
    }));

    return { success: true, data: productsWithDefaults };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { success: false, message: "Failed to fetch products." };
  }
}

export async function deleteUser(userId: string) {
  try {
    // Check if user has products
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        products: true,
      },
    });

    if (!user) {
      return { success: false, message: "User not found." };
    }

    // Delete user and their products (cascade delete should handle this)
    await prisma.user.delete({
      where: { id: userId },
    });

    return { 
      success: true, 
      message: `User ${user.name} and their ${user.products.length} products have been deleted successfully.` 
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, message: "Failed to delete user." };
  }
}

export async function deleteProductByAdmin(productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!product) {
      return { success: false, message: "Product not found." };
    }

    // Delete the product
    await prisma.product.delete({
      where: { id: productId },
    });

    // Also delete associated media records from ProductMedia collection
    try {
      await (prisma as any).productMedia.deleteMany({
        where: { productId: productId },
      });
      console.log(`✅ Also deleted media records for product: ${productId}`);
    } catch (mediaError: any) {
      console.log("⚠️  Could not delete media records:", mediaError.message);
      // Don't fail the deletion if media cleanup fails
    }

    return { 
      success: true, 
      message: `Product "${product.title}" by ${product.user.name} has been deleted successfully.` 
    };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { success: false, message: "Failed to delete product." };
  }
}

export async function hideProductByAdmin(productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!product) {
      return { success: false, message: "Product not found." };
    }

    // Hide product by setting hidden to true using Prisma
    await prisma.product.update({
      where: { id: productId },
      data: { hidden: true }
    });

    return { 
      success: true, 
      message: `Product "${product.title}" has been hidden from public view.` 
    };
  } catch (error) {
    console.error("Error hiding product:", error);
    return { success: false, message: "Failed to hide product." };
  }
}

export async function unhideProductByAdmin(productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!product) {
      return { success: false, message: "Product not found." };
    }

    // Unhide product by setting hidden to false using Prisma
    await prisma.product.update({
      where: { id: productId },
      data: { hidden: false }
    });

    return { 
      success: true, 
      message: `Product "${product.title}" has been made visible to public.` 
    };
  } catch (error) {
    console.error("Error unhiding product:", error);
    return { success: false, message: "Failed to unhide product." };
  }
}

export async function getAdminStats() {
  try {
    const [totalUsers, totalProducts, recentUsers, recentProducts] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      }),
      prisma.product.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        totalUsers,
        totalProducts,
        recentUsers,
        recentProducts,
      },
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return { success: false, message: "Failed to fetch statistics." };
  }
}
