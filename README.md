# Art Nexus — APK

O jogo (pasta `jogo/`) lê as obras e imagens do Supabase (tabela `obras` + bucket público "Obras de Arte").
A cada push na `main` o GitHub Actions gera o APK e o publica em **Releases → Art Nexus (APK)**.

No celular: abra o link da Release, baixe `art-nexus.apk` e instale (permita "instalar de fontes desconhecidas" quando o Android pedir).
Para atualizar o jogo, troque os arquivos de `jogo/` e faça push.
