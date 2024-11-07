---
layout: post
title:  "Configurando Git para uso pessoal e trabalho"
author: [peterson]
date:   2024-11-07 17:00:00 -0300
description: "Configurando Git para uso pessoal e trabalho"
categories: [linux, tutorials]
keywords: [linux, git, ssh, github, gitlab, gitea]
published: true
katex: true
---

# Sumário
- [Sumário](#sumário)
- [Introdução](#introdução)
- [Referências](#referências)

# Introdução

Provavelmente se você já usou o git no seu trabalho se deparou com a necessidade de alterar o endereço de email que aparece nos commits, ou então usar uma chave ssh diferente para realizar push/pull's remotos. De forma bem rápida, para resolver, basta primeiramente ter em mãos o seu email novo, e opcionalmente sua chave ssh bem como já tê-la registrada no servidor git do trabalho.

Primeiramente vamos criar uma pasta onde todos os subdiretórios com projetos git irão usar a configuração especial do trabalho, por exemplo `~/trabalho`. 

Depois vamos alterar o git config para adicionar um `infludeIf` de um outro arquivo config quando estivermos em nosso diretório de trabalho:

`.gitconfig`:
```ini
[user]
    email = emailPessoal@email.com
    name = fulaninho

[core]
    editor = vim

[includeIf "gitdir/i:~/trabalho/"]
    path = "~/.gitconfig-trabalho"
```

E por fim nosso config de trabalho:

`.gitconfig-trabalho`:
```ini
[user]
    email = emailDoTrabalho@trabalho.com
    name = Fulano Dev

[core]
    editor = vim
    sshCommand = "ssh -i ~/.ssh/id_rsa_trabalho"
```

Pronto, agora qualquer repositório criando ou clonado em subdiretórios de `trabalho/` irão usar o email e shave ssh configurados.

# Referências

* [How to separate your Git for work and Git for personal](https://dev.to/fadilnatakusumah/how-to-separate-your-git-for-work-and-git-for-personal-2n8b)