import { getUserByUsername, createUser } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function initializeAdminUser() {
  try {
    const admin = await getUserByUsername("admin");

    if (!admin) {
      const passwordHash = await hashPassword("admin");
      await createUser({
        username: "admin",
        password_hash: passwordHash,
        coin: 0,
        is_admin: true,
      });
      console.log("Admin user created successfully");
    } else {
      console.debug('Admin user already exists:', admin.username);
    }
  } catch (err) {
    console.error('initializeAdminUser error:', err);
  }
}
