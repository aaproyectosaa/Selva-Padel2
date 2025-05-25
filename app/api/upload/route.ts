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
          if (error) reject(error);
          resolve(result);
        }
      ).end(buffer);
    });

    // Devolver la URL relativa (desde /public)
    return NextResponse.json({ 
      url: (result as any).secure_url,
      message: 'Archivo subido correctamente' 
    });
    
  } catch (error) {
    console.error('Error al subir el archivo:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
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