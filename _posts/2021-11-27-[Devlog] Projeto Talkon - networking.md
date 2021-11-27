---
layout: post
title:  "[Devlog] Projeto Talkon - networking"
author: [peterson]
date:   2021-11-27 03:40:00 -0300
description: "[Devlog] Projeto Talkon - networking"
categories: [networking, devlog, c_lang]
keywords: [C, terminal, cli, talkon, devlog]
published: true
---

Terminando a comunicação multicast UDP no meu programinha de troca de mensagens, muito bacana aprender mais e explorar programação em sockets em mais baixo nível. Ao lado direito tenho duas instâncias rodando, pode se ver ambas recebendo e enviando pacotes, cujo conteúdo é no formato json e possuí meta informação sobre o protocolo de mensagem, neste caso o ping e resposta ao ping de descobrimento de nós na rede. Logo quando terminar vou estar postando um vídeo no meu canal sobre o programa e o processo de desenvolvimento.


Repositório: [https://github.com/Joao-Peterson/talkon](https://github.com/Joao-Peterson/talkon)

![screenshot]({{"../assets/talkon-screenshot.png" | relative_url}})