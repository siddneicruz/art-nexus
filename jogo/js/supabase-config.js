/* ============================================================================
   CONFIGURAÇÃO DO SUPABASE (opcional)
   Preencha URL e chave para o jogo carregar obras extras da sua tabela
   "obras" além das 162 já embutidas. Deixe como está (null) para o jogo
   continuar funcionando 100% offline, do jeito que sempre funcionou.

   Onde pegar esses dois valores no painel do Supabase:
     Project Settings → API → Project URL          (SUPABASE_CONFIG.url)
     Project Settings → API → anon public key       (SUPABASE_CONFIG.anonKey)
   A "anon key" é pública por natureza (o app do navegador sempre expõe ela);
   a segurança real vem da regra de "só leitura" (RLS) criada no schema.sql.
   ============================================================================ */
const SUPABASE_CONFIG = {
  url: "https://bcvfkusmpcsgbhyyrqnk.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjdmZrdXNtcGNzZ2JoeXlycW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMDA1MTcsImV4cCI6MjEwNTc3NjUxN30.PhKhAh2xITCZAxrK2Sn88J_Ph-RqaEHf_el7oH9tHRM",  // chave "anon" (pública por natureza)
  bucket: "Obras de Arte",
};
