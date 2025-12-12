import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import { ValidationError } from 'class-validator';

/**
 * 🔹 Helper para guardar imagen base64
 * 👉 Se usa en el dominio de productos, no en projects.
 */
export function saveBase64Image(dataUrl: string): string {
  try {
    const matches = dataUrl.match(
      /^data:(image\/(png|jpeg|jpg|gif));base64,(.+)$/,
    );
    if (!matches) {
      throw new Error('Formato de imagen no válido');
    }

    const mime = matches[1];
    const ext =
      mime.split('/')[1] === 'jpeg' ? '.jpg' : `.${mime.split('/')[1]}`;
    const base64Data = matches[3];
    const buffer = Buffer.from(base64Data, 'base64');

    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const uploadPath = './uploads/products';

    fs.mkdirSync(uploadPath, { recursive: true });
    const fullPath = `${uploadPath}/${filename}`;
    fs.writeFileSync(fullPath, buffer);

    return `uploads/products/${filename}`;
  } catch {
    throw new BadRequestException('No se pudo procesar la imagen base64');
  }
}

/**
 * 🔹 Helper para aplanar errores de validación de class-validator
 * 👉 Se usa en projects para devolver mensajes claros de DTO.
 */
export function flattenValidationErrors(errors: ValidationError[]): string[] {
  const messages: string[] = [];

  const collect = (errs: ValidationError[]) => {
    for (const err of errs) {
      if (err.constraints) {
        for (const key of Object.keys(err.constraints)) {
          messages.push(err.constraints[key]);
        }
      }
      if (err.children && err.children.length > 0) {
        collect(err.children);
      }
    }
  };

  collect(errors);
  return messages;
}
