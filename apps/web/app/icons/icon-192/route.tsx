import { renderAppIcon } from "@/lib/seo/app-icon";

export async function GET() {
  return renderAppIcon(192);
}
