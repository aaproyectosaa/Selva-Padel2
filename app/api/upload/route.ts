import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { cloudinary } from "@/lib/cloudinary";

// Asegurarse de que el directorio existe
const ensureDirectoryExists = (dirPath: string) => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
};

export async function POST(request: NextRequest) {
  try {
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      console.error("Faltan variables de entorno de Cloudinary");
      return NextResponse.json(
        { error: "Error de configuración del servidor" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se ha proporcionado ningún archivo' },
        { status: 400 }
      );
    }

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'El archivo debe ser una imagen' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generar un nombre único para el archivo
    const filename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    
    // Directorio donde se guardarán las imágenes
    const imagesDir = join(process.cwd(), 'public', 'courts');
    
    // Asegurarse de que el directorio existe
    ensureDirectoryExists(imagesDir);
    
    // Ruta completa donde se guardará el archivo
    const filePath = join(imagesDir, filename);
    
    // Guardar el archivo
    await writeFile(filePath, buffer);
    
    // Subir a Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "selva-padel",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            console.error("Error de Cloudinary:", error);
            reject(error);
          }
          resolve(result);
        }
      ).end(buffer);
    });

    if (!result || !(result as any).secure_url) {
      throw new Error("No se pudo obtener la URL de la imagen");
    }

    return NextResponse.json({ url: (result as any).secure_url });
  } catch (error) {
    console.error("Error al subir la imagen:", error);
    return NextResponse.json(
      { error: "Error al subir la imagen" },
      { status: 500 }
    );
  }
}

// Límite de tamaño para las solicitudes
export const config = {
  api: {
    bodyParser: false,
  },
}; 