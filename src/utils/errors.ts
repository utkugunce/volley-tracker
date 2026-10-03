/**
 * `catch` bloklarında yakalanan `unknown` değerden okunan, hataya benzer alanlar.
 * (Node/Supabase/web-push hataları `message` ve bazen `statusCode` taşır.)
 */
export interface ErrorLike {
  message?: string;
  statusCode?: number;
}

/**
 * Yakalanan değeri güvenle `ErrorLike` olarak döndürür. Nesne değilse boş nesne verir
 * (önceki `any` davranışında `.message` okumak `undefined` döndürürdü).
 */
export function toErrorLike(err: unknown): ErrorLike {
  return typeof err === "object" && err !== null ? (err as ErrorLike) : {};
}
