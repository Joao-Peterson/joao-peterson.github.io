---
layout: post
title:  "Remapeando teclas no linux usando keyd"
author: [peterson]
date:   2023-08-01 12:00:00 -0300
description: "Remapeando teclas no linux usando keyd"
categories: [linux, tutorials, keyboard]
keywords: [linux, tutorials, keyboard, keyd]
published: true
katex: true
---

Se você deseja remapear teclas específicas no linux, ou até criar macros e outras modificações, verá que é um trabalho não muito trivial. Em um post passado mostro como [remapear a tecla caps lock para ser usada com a teclas direcionais para criar uma navegação com pgup, pgdown, homme e end]({% post_url 2023-04-13-capslock%}), mas acaba que na prática tal técnica acaba nao sendo tão suave quanto deveria ser, e ainda por cima só funciona em ambiente gráfico, não funcionando nas tty's.

Para resolver essas e outras fui de atrás de uma melhor solução, e encontrei o keyd, um daemon que remapeia e realiza várias funcionalidades com mínima e elegante configuração, e quer funciona tanto nos terminais quanto em ambiente gráfico, pois de fato emula um teclado virtual.

# Instalação 

## Archlinux (aur)

```console
$ yay -S keyd
```

## Colocando rodar

Para colocar rodar basta:

```console
$ sudo systemctl enable --now keyd
```

# Configuração

A [man page do keyd](https://github.com/rvaiya/keyd/blob/master/docs/keyd.scdoc) é bastante explicativa, portanto para o exemplo a seguir vamos emitir algumas explicações e focar no resultado desejado, então para seu caso de uso recomendo a leitura na íntegra do manual.

Em meu caso de uso, tenho um teclado que quando usado no linux emite teclas multimedia quando deveria emitir as teclas funcionais f1, f2 e etc. Como no teclado há apenas a linha de teclas numéricas, quando eu pressiono `fn+1`, ele deveria emitir `f1`, mas emite `brightnessdown`, que diminuí o brilho da minha tela. Para fazer funcionar, precisei remapear ester eventos para as teclas de função.

Para isso basta criar o seguinte arquivo:

`/etc/keyd/default.conf`:
```ini
[ids]

*

[main]

# Maps capslock to escape when pressed and control when held.
# capslock = overload(control, esc)

# Remaps the escape key to capslock
#esc = capslock

brightnessdown = f1
brightnessup = f2
scale = f3
dashboard = f4
kbdillumdown = f5
kbdillumup = f6
previoussong = f7
playpause = f8
nextsong = f9
mute = f10
volumedown = f11
volumeup = f12

# activates nav while held, but a tap is a normal capslock
capslock = overload(nav, capslock)

[nav]

up = pageup
down = pagedown
left = home
right = end
```

Onde pode se ver que as ações de multimedia foram remapeadas para as teclas de função correspondentes.

Para descobrir os códigos de cada ação multimedia, eu executei o seguinte comando para monitorar o teclado e verificar estas:

```console
$ sudo keyd monitor
```

Por fim, para ativar a configuração, basta salvar o arquivo e realizar o seguinte comando:

```console
$ sudo keyd reload
```

Nota se ainda no arquivo de config as opções de navegação que eu desejo, home, end e pgup e down nas teclas direcionais, isso é feito a partir do mecanismo de layers do keyd. Cada layer no keyd é uma separação lógica de teclas que são remapeadas somente dada a condição, a layer main é onde tudo acontece mas podem definidas layers separadas, que podem ser ativadas por comandos, como o pressionar de um modificador, como ctrl, shift e etc. A tecla capslock é remapeada para o action de overload, que permite que quando capslock seja apenas tocada, execute a função de capslock normal, mas quando segurada, ativa a layer nav, layer que remapeia as teclas direcionais para as desejadas.

# Conclusão

keyd é com certeza um dos melhores sistemas de remapeamento, emula um teclado virtual, funciona tanto em terminal quando ambiente gráfico, configuração simples e várias funcionalidades, que aqui não foram exploradas. Melhor do que isso provavelmente só montando um teclado customizado e utilizando um firmware como [QMK](https://qmk.fm/) para se ter mais controle ainda.

Definitivamente leia o manual, um dos melhores software linux, é até chato ver que este não está presente em repositórios oficiais nas distribuições.

# Referências

* [keyd man page](https://github.com/rvaiya/keyd/blob/master/docs/keyd.scdoc)
