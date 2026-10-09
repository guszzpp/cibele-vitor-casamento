/*
 * Configure apenas uma URL de projeto próprio e uma publishable key (sb_publishable_...).
 * É seguro expor a chave PUBLICÁVEL no frontend com políticas RLS corretas.
 * Nunca insira service_role, secret key ou tokens de pagamento neste arquivo.
 */
window.WEDDING_CONFIG = Object.freeze({
  supabaseUrl: "",
  supabasePublishableKey: "",
  weddingDate: "2027-09-18T16:30:00-03:00"
});