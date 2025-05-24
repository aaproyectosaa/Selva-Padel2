import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "@/lib/uploadthing";
 
// Exporta los controladores GET y POST
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
}); 