import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/auth";
import { updateSiteContent } from "@/lib/site-content";

const CONTENT_PATHS = [
  "/",
  "/shop",
  "/cart",
  "/checkout",
  "/about",
  "/shipping",
  "/returns",
  "/faq",
  "/contact",
  "/terms",
];

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const content = await updateSiteContent(payload);
    CONTENT_PATHS.forEach((path) => revalidatePath(path));

    return Response.json({ content });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "İçerik kaydedilirken bir hata oluştu.",
      },
      { status: 400 },
    );
  }
}
