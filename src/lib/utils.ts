import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&[^;]+;/g, (e) => {
      const entities: Record<string, string> = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#39;": "'",
        "&#x27;": "'",
        "&#x2F;": "/",
      };
      return entities[e] || " ";
    })
    .replace(/\s+/g, " ")
    .trim();
}
