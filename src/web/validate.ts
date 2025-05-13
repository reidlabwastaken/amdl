import express from "express";
import { z, ZodSchema } from "zod";

export async function validate<T extends ZodSchema>(req: express.Request, schema: T): Promise<z.infer<T>> {
    const result = await schema.parseAsync(req);
    return result;
}
