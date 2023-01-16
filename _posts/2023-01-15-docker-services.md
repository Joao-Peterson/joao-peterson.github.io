---
layout: post
title:  "Como criar um serviço systemd para uma imagem docker"
author: [peterson]
date:   2023-01-15 20:35:00 -0300
description: "Como criar um serviço systemd para uma imagem docker"
categories: [linux, tutorials, docker]
keywords: [linux, sysadmin, tutorials, docker, archlinux]
published: true
katex: true
---

Olá meus nobres, neste artigo gostaria de compartilhar com vocês uma simples técnica de como realizar um mapeamento entre um serviço linux, do systemd, com uma imagem docker, que para alguns sysadmin's por aí é bastante interessante.

Um dos pontos positivos é que você terá o controle do processo via systemd, podendo utilizar os comandos start, stop e restart, e terá os logs centralizados, podendo utilizar o journalctl para visualização, bem como em ferramentas GUI como Webmin e Cockpit.

# Sumário
- [Sumário](#sumário)
- [Serviço](#serviço)
- [Diretório](#diretório)
- [Execução](#execução)
- [Explicação](#explicação)

# Serviço

Para configurar o serviço primeiramente necessitamos criar um arquivo de serviço, que pode ser dado como: 

```ini
[Unit]
Description=docker image service
Requires=docker.service multi-user.target
After=docker.service network-online.target dhcpd.service

[Service]
Restart=always
ExecStartPre=/bin/bash -c '/usr/bin/docker container inspect DOCKER_IMAGE 2> /dev/null || /usr/bin/docker run -d --privileged --name DOCKER_IMAGE  DOCKER_IMAGE_AUTHOR/DOCKER_IMAGE'
ExecStart=/usr/bin/docker start -a DOCKER_IMAGE
ExecStop=/usr/bin/docker stop -t 1 DOCKER_IMAGE
ExecReload=/usr/bin/docker restart -t 1 DOCKER_IMAGE

[Install]
WantedBy=multi-user.target
```

Onde `DOCKER_IMAGE` é o nome da imagem, e `DOCKER_IMAGE_AUTHOR` o nome do autor no docker hub.

Lembre se de substituir os nomes pelos de sua imagem docker, como se fosse realizar manualmente os comandos.

A direita do comando `/usr/bin/docker run -d` você pode/deve adicionar mais flags, como definição de variáveis de ambiente, mapeamento de portas e volumes, que são exemplos comuns. Ex:

```console
/usr/bin/docker run -d --privileged -p 3008/80 -e TZ="America/Sao_Paulo" -v /etc/image:/etc/docker-image/ --name DOCKER_IMAGE  DOCKER_IMAGE_AUTHOR/DOCKER_IMAGE
```

# Diretório

Em quase todas a distros linux será preferível que você salve o arquivo como:

```console
/usr/lib/systemd/system/docker-image-name.service
```

Usei a distro Archlinux para este serviço, talvez em sua distro seja diferente.

# Execução

Agora para iniciar o serviço basta executar:

```console
$ sudo systemctl enable docker-image-name.service --now
```

E para parar:

```console
$ sudo systemctl stop docker-image-name.service
```

Se deseja que o serviço não seja mais executado toda vez que a máquina for iniciada.

```console
$ sudo systemctl disable docker-image-name.service
```

# Explicação

Note que o serviço que irá abrigar nossa imagem docker necessita do serviço `docker` e do serviço de rede, `network-online` e `dhcp`, isso é importante e bastante usual na criação de serviços do systemd, pois assim criamos relações entre eles, neste caso a nossa imagem docker só pode ser executada quando o serviço docker estiver rodando e tivermos acesso a rede.

Caso você não saiba, o serviço docker é o serviço responsável por executar as imagens docker, sem ele não virtualização destas e nem forma de gerencia las.

Na seção `Service`, temos os comandos, onde o comando `ExecStart`, `ExecStop` e `ExecReload` são mapeados diretamente para os comandos docker `start`, `stop` e `restart` respectivamente. A parte realmente interessante é o comando `ExecStartPre`, que é executado antes de todo comando start, ou seja, o comando que é executado quando o sistema é iniciado, vamos analisar melhor.

O comando é um comando de shell simples:

```console
/bin/bash -c '/usr/bin/docker container inspect DOCKER_IMAGE 2> /dev/null || /usr/bin/docker run -d --privileged --name DOCKER_IMAGE  DOCKER_IMAGE_AUTHOR/DOCKER_IMAGE'
```

Vamos analisar as partes individuais. Primeiramente temos:

```console
/usr/bin/docker container inspect DOCKER_IMAGE 2> /dev/null'
```

Que irá utilizar o comando docker para inspecionar o container, se o mesmo existir, o inspect retornará um resultado em texto no terminal e um código de retorno, mas por que? Porque imagens docker quando são habilitadas elas ficam registradas no serviço docker, comando `docker run`, e podem ser controladas via `start` e `stop`, o problemas é que quando tal imagem não foi registrada ainda, precisamos executar `docker run` isso se a imagem ainda não existir, por isso usamos inspect.

Portanto, quando o inspect retornar falso, a shell irá avaliar a expressão além do operador `||`, e então avaliará a seguinte expressão:

```console
/usr/bin/docker run -d --privileged --name DOCKER_IMAGE  DOCKER_IMAGE_AUTHOR/DOCKER_IMAGE
```

Que de fato roda a imagem docker e a registra no serviço docker.

O operador `||`, or, implica que se qualquer parte for verdadeira, então o resultado será verdadeiro também, por isso, ao rodar inspect, se a imagem existir, o comando irá retornar um código booleano verdadeiro, portando não necessidade de se avaliar a expressão a direita, pois o or já é verdadeiro:

```console
a || b = ?
1 || b = ?
1 || b = 1
```

Porém se o resultado da expressão a esquerda for falso, então será avaliado a expressão a direita:

```console
a || b = ?
0 || b = ?
0 || 1 = ?
0 || 1 = 1
```

Efetivamente executando o comando `docker run` toda vez que `docker inspect` for falso. E quando inspect for verdadeiro, nada acontece, apenas o fluxo normal onde posteriormente `ExecStart` irá rodar o comando `docker start`. Então se aquela imagem for removida posteriormente o serviço saberá cria la novamente.

O redirecionador `2> /dev/null` server como forma de mandar o resultado de inspect não para a stdout, mas para /dev/null, ou seja, nada será impresso para stdout, deixando o log de saída menos verboso.

Por fim, irá encontrar se um problema quando executado o comando da seguinte forma:

```console
/usr/bin/docker container inspect DOCKER_IMAGE 2> /dev/null || /usr/bin/docker run -d --privileged --name DOCKER_IMAGE  DOCKER_IMAGE_AUTHOR/DOCKER_IMAGE
```

A execução desta expressão não irá ocorrer da forma esperada, aparentemente o systemd só executa a primeira parte a esquerda, só o inspect, e não a parte direita da expressão, por isso devemos encapsular a expressão booleana dentro de um comando bash, pedindo para o mesmo executar, e assim temos a forma vista no exemplo:

```console
$ /bin/bash -c '/usr/bin/docker container inspect DOCKER_IMAGE 2> /dev/null || /usr/bin/docker run -d --privileged --name DOCKER_IMAGE  DOCKER_IMAGE_AUTHOR/DOCKER_IMAGE'
```
