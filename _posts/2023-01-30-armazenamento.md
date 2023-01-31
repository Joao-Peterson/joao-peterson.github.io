---
layout: post
title:  "Criando armazenamento de rede para Windows/Linux, com sincronização e criptografia"
author: [peterson]
date:   2023-01-30 15:00:00 -0300
description: "Criando armazenamento de rede para Windows/Linux, com sincronização e criptografia"
categories: [linux, homelab, tutorials, networking, sysadmin]
keywords: [linux, homelab, tutorials, archlinux, samba, veracrypt, syncthing]
published: true
katex: true
---

Olá novamente meu povo, hoje quero trazer para vocês uma solução para armazenamento de rede, composta por partições que sejam montáveis em Windows e no Linux ao mesmo tempo, para isso utilizaremos [Samba](https://www.samba.org), também sincronização dupla via entre partições utilizando [Syncthing](https://syncthing.net), ou seja, teremos uma cópia de um diretório em um servidor e em uma máquina local onde ambas sempre serão espelhadas, ideal para backup. E ainda também quero trazer para vocês como criar uma partição criptografada em rede, acessível do Windows e Linux também, utilizando [Veracrypt](https://www.veracrypt.fr).

* *Estaremos utilizando a mesma máquina Arch linux configurada no artigo [Configurando uma máquina Linux e acesso remoto via SSH]({% post_url 2022-12-06-ssh %}). Lembre se de conectar-se a máquina remota antes de fazer os procedimentos.*

# Sumário
- [Sumário](#sumário)
- [Partições de rede com Samba](#partições-de-rede-com-samba)
	- [Formatação e montagem](#formatação-e-montagem)
	- [Samba](#samba)
- [Clientes de rede](#clientes-de-rede)
	- [Linux](#linux)
	- [Windows](#windows)
- [Sincronização (Syncthing)](#sincronização-syncthing)
	- [Instalação](#instalação)
	- [Configuração](#configuração)
	- [Pastas para sincronizar](#pastas-para-sincronizar)
	- [Proxy reverso Nginx](#proxy-reverso-nginx)
- [Criptografia (Veracrypt)](#criptografia-veracrypt)
	- [Instalação](#instalação-1)
	- [Criando volume](#criando-volume)
- [Pensamentos finais](#pensamentos-finais)
- [Referências](#referências)

# Partições de rede com Samba

Samba é nome de um projeto e nome fantasia que se assemelha a SMB, o protocolo de rede da Microsoft que possibilita o funcionamento de partições de armazenamento em rede e também de impressoras de rede. Com isso poderemos configurar uma partição em nosso servidor e ela estará disponível para computadores Linux e Windows.

Para começar utilizaremos um disco rígido vazio do servidor para abrigar as partições, pessoalmente tenho um disco de $$250 Gb$$, onde criarei três diretórios, um para uma partição de rede normal, outra que será sincronizada e outra que abrigará um volume Veracrypt, veremos mais a frente como as últimas duas funcionam.

## Formatação e montagem 

Primeiramente vamos formatar a partição, no Arch linux usarei fdisk no meu HD, que é o device `sdb`:

```console
$ sudo fdisk /dev/sdb

> Command (m for help): g

Created a new GPT disklabel (GUID: DE953452-DEC1-9750-80AF-00454883FF6F)

> Command (m for help): n

Partition number (1-128, default 1): 1
First sector (2048-488397134, default 2048): Enter
Last sector, +/-sectors or +/-size{K,M,G,T,P} (2048-488397134, default 488396799): Enter

Created a new partition 1 of type 'Linux filesystem' and of size 232.9 GiB.

> Command (m for help): p

Disk /dev/sdb: 250.0 GiB, ### bytes, ### sectors
Disk model: ###
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 4096 bytes
I/O size (minimum/optimal): 4096 bytes / 4096 bytes
Disklabel type: gpt
Disk identifier: DE953452-DEC1-9750-80AF-00454883FF6F

Device         Start       End   Sectors   Size Type
/dev/sdb1       2048 488396799 #########   250G Linux filesystem

> Command (m for help): w

The partition table has been altered.
Calling ioctl() to re-read partition table.
Syncing disks.
```

Agora criaremos um filesystem xfs como é recomendado pelo samba.

Instalando o utilitário de criação:
```console
$ sudo pacman -S xfsprogs
```

Criando o fs com configurações padrões, só ir apertando enter. Exemplo de output:
```console
$ mkfs.xfs /dev/sdb1

meta-data=/dev/device            isize=256    agcount=4, agsize=3277258 blks
         =                       sectsz=512   attr=2
data     =                       bsize=4096   blocks=13109032, imaxpct=25
         =                       sunit=0      swidth=0 blks
naming   =version 2              bsize=4096   ascii-ci=0
log      =internal log           bsize=4096   blocks=6400, version=2
         =                       sectsz=512   sunit=0 blks, lazy-count=1
realtime =none                   extsz=4096   blocks=0, rtextents=0
```

Montar:
```console
$ sudo mkdir /mnt/drive1
$ sudo mount /dev/sdb1 /mnt/drive1
```

Agora já podemos acessar a partição, mas vamos antes adicionar um entry no fstab para que ela seja montada toda vez na inicialização do servidor:

`/etc/fstab`:
```ini
...
# /dev/sdb1
UUID=DE953452-DEC1-9750-80AF-00454883FF6F /mnt/drive1 +++xfs rw,relatime,attr2,inode64,logbufs=8,logbsize=32k, +++noquota 0 2
...
```

E por fim as pastas para cada tipo de armazenamento que desejarmos:

```console
$ sudo mkdir /mnt/drive1/share
$ sudo mkdir /mnt/drive1/synced
$ sudo mkdir /mnt/drive1/shareEnc
```

## Samba

Vamos baixar o samba em nosso servidor:
```console
$ sudo pacman -S samba
```

Vamos criar um arquivo de configuração:

`/etc/samba/smb.conf`:
```ini
[global]
server role = standalone
logging = systemd
server smb encrypt = desired

; performance
use sendfile = yes
min receivefile size = 16384

; disable printers
load printers = no
printing = bsd
printcap name = /dev/null
disable spoolss = yes
show add printer wizard = no

[share]
comment = Regular share
valid users = {INSERT YOUR USER HERE}
path = /mnt/drive1/share
writable = yes
read only = no
browsable = no
public = yes
printable = no

[shareEnc]
comment = Regular share for vercrypt
valid users = {INSERT YOUR USER HERE}
path = /mnt/drive1/shareEnc
writable = yes
read only = no
browsable = no
public = yes
printable = no

[synced]
comment = Synced share
valid users = {INSERT YOUR USER HERE}
path = /mnt/drive1/synced
writable = yes
read only = no
browsable = no
public = yes
printable = no
```

Onde definimos algumas opções básicas na seção `global`, e definimos partições de rede para cada um dos diretórios criados, sendo estas `share` (partição normal), `shareEnc` (partição futura para o Veracrypt) e `synced` (partição que será sincronizada). Se desejar criar mais partições distintas para usuários distintos basta ir adicionando novas seções.

* **Lembre de mudar e colocar seu nome de usuário em `{INSERT YOUR USER HERE}`.**

Para mais opções leia este [artigo da arch wiki](https://wiki.archlinux.org/title/Samba).

Agora adicionar este mesmo usuário como o usuário a ser usado pelo samba para acessar os arquivos, ou seja, **arquivos acessados por rede por outros computadores terão as mesmas permissões deste usuário, lembre se disto**, pois caso der erro de permissão você precisa manualmente dar permissão para os arquivos no servidor para este mesmo usuário.

```console
$ sudo smbpasswd -a {INSERT YOUR USER HERE}
```

E definir uma senha a ser usada para se conectar a esta partição:

```console
$ sudo smbpasswd {INSERT YOUR USER HERE}

{INSERT YOUR PASS NOW}
```

**Lembre se dela!**

Cada usuário adicionado possui sua própria senha e pode ser atribuído a uma ou mais partições, e cada partição pode possuir um ou mais usuários, utilize isto em sua vantagem, para criar controle de acesso para partições distintas.


Por fim vamos abrir uma exceção no firewall: 

```console
$ sudo ufw allow CIFS
```

E ativar o serviço:

```console
$ sudo systemctl enable smb.service --now
```

Agora as partições estão prontas para serem usadas em rede, se deseje utilizar já as partições, você pode monta las como na seção [Clientes de Rede](#clientes-de-rede), se deseja configurar o resto, leia as seções de [Sincronização](#sincronização-syncthing) e [Criptografia](#criptografia-veracrypt).

# Clientes de rede

* **Lembre se que estas configurações são para os clientes, portanto não realize os comandos em seu servidor**

## Linux

No linux temos várias opções para montar partições de rede com samba, recomendo ler este [artigo da archwiki](https://wiki.archlinux.org/title/Samba#Automatic_mounting), usaremos montagem pelo systemd por livre escolha, eu gosto de fazer as coisas com systemd 😛.

Como visto na [Archwiki](https://wiki.archlinux.org/title/Samba#As_systemd_unit) faremos :

`/etc/systemd/system/mnt-archshare.mount`:
```systemd
# https://wiki.archlinux.org/title/Samba#As_systemd_unit
[Unit]
Description=Automount samba share
After=nss-lookup.target

[Mount]
What=//archserver.lan/share
Where=/mnt/archshare
Options=noauto,_netdev,credentials=/etc/samba/credentials/archshare,iocharset=utf8,rw,uid={YOUR LOCAL USER}
Type=cifs
TimeoutSec=30
ForceUnmount=true

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/mnt-archsynced.mount`:
```systemd
# https://wiki.archlinux.org/title/Samba#As_systemd_unit
[Unit]
Description=Automount samba synced share
After=nss-lookup.target

[Mount]
What=//archserver.lan/synced
Where=/mnt/archsynced
Options=noauto,_netdev,credentials=/etc/samba/credentials/archshare,iocharset=utf8,rw,uid={YOUR LOCAL USER}
Type=cifs
TimeoutSec=30
ForceUnmount=true

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/mnt-archshareEnc.mount`:
```systemd
# https://wiki.archlinux.org/title/Samba#As_systemd_unit
[Unit]
Description=Automount samba veracript share
After=nss-lookup.target

[Mount]
What=//archserver.lan/shareEnc
Where=/mnt/archshareEnc
Options=noauto,_netdev,credentials=/etc/samba/credentials/archshare,iocharset=utf8,rw,uid={YOUR LOCAL USER}
Type=cifs
TimeoutSec=30
ForceUnmount=true

[Install]
WantedBy=multi-user.target
```

Note que criamos arquivos em `/etc/systemd/system` para cada partição de rede, e que o nome de cada uma é igual o diretório onde serão montadas, trocando `/` por `-`, assim a partição normal samba `archShare` que desejamos montar no diretório `/mnt/archShare` terá o nome `mnt-archShare.mount`.

O caminho de rede para cada partição é do formato: `//archserver.lan/share`, onde `archserver.lan` é nosso servidor e `share` o nome da partição definida no arquivo `/etc/samba/smb.conf` no servidor. 

Só podemos utilizar `archserver.lan` pois temos o cliente conectado no nosso servidor DNS local, como visto no artigo do blog [Configurando um servidor DNS local com Pihole em servidor Linux]({% post_url 2023-01-16-pihole %}), pois qualquer query DNS feita para o domínio `archserver.lan` será resolvida para o IP do servidor, caso não tenha DNS local, basta substituir o domínio pelo IP da máquina, lembrando sempre de configurar um IP fixo para o servidor.

O usuário `{YOUR LOCAL USER}` deve ser o usuário qual será usado para montar esta partição no computador local, **lembre se de trocar**.

Agora basta ativar com o systemd:

```console
$ sudo systemctl enable mnt-archShare.mount --now
$ sudo systemctl enable mnt-archShareEnc.mount --now
$ sudo systemctl enable mnt-archSynced.mount --now
```

E as partições serão montadas automaticamente em cada reinicialização. Caso der pau sempre pode se olhar o log para ver os erros, Ex:

```console
$ sudo journalctl -eu mnt-archShare.mount
```

Ou apenas os status:
```console
$ sudo systemctl status mnt-archShare.mount
```

E aqui está um exemplo de como fica quando montamos em um cliente com interface gráfica, no meu caso, KDE plasma com o explorador de arquivos Dolphin:

![]({{"../../../assets/Screenshot_20230130_163523.png" | relative_url}})

## Windows

**A escrever ...**

# Sincronização (Syncthing)

O Syncthing é um utilitário se sincronização dupla, parecido com clientes como Google Drive, Mega ou Dropbox, eles continuamente checam os arquivos locais e remotes e garantem que ambos são iguais a todo momento, criando um espelhamento de dados, ótimo para backup e acesso remoto. Syncthing é open source.

## Instalação

Para usa lo necessitamos instalar e configurar no servidor e nos clientes, que será a mesma coisa, portanto **lembre se de realiza los em ambos o servidor e cliente**.

Instalação Windows:

Baixe um instalador em [Syncthing Downloads](https://syncthing.net/downloads/), next, next, install, finish, easy.

Instalação Linux:

```console
$ sudo pacman -S syncthing
```

Habilite o serviço

```console
$ sudo systemctl enable syncthing@YOUR_USER.service --now
```

Onde `YOUR_USER` é o usuário detentor dos privilégios de acesso as arquivos, sendo os arquivos de interesse devendo ter permissões relacionadas a este usuário.

## Configuração

Com o serviço rodando podemos configura lo, para isto acesse a interface web em [http://localhost:8384](http://localhost:8384), ou no caso do servidor, acesse de sua máquina local com o IP do servidor e mesma porta, 8384, talvez seja melhor que você configure um [subdomínio como proxy reverso](#proxy-reverso-nginx).

Agora com o serviço rodando e interface gráfica podemos configurar o resto. Vamos configurar o Syncthing só para modo local, mas se você tiver um domínio e IP públicos você pode expor este serviço para internet e sincronizar seus dispositivos de forma remota, só lembre se de habilitar https para interface web.

Para modo local vá em `Actions > Settings > Connections` e configure conforme a figura:

![]({{"../../../assets/Screenshot_20230131_110314.png" | relative_url}})

Também é interessante colocar uma senha para interface gráfica em `Actions > Settings > GUI`.

## Pastas para sincronizar

No servidor, na interface principal clique em `Add folder`, dê um nome/label e o local da pasta, em nosso caso queremos sincronizar o diretório `/mnt/drive1/synced` então este será o caminho/path, podemos deixar o resto da opções como padrão e criar a pasta.

![]({{"../../../assets/Screenshot_20230131_110137.png" | relative_url}})

Agora vamos adicionar nosso computador local, ou vice versa, tanto faz, para isto na interface principal clique em `Add remote device > General` e coloque o ID do dispositivo e o nome e na aba `Sharing` selecione a pasta que acabou de criar, salve e pronto. 

Em suas máquinas verifique se ambas possuem a outra como `Remote devices`, caso não repita o procedimento acima novamente na máquina que não possui.

Em seu servidor você tem a pasta criada, agora em sua máquina local, crie o diretório onde deseja que os arquivos sejam sincronizados, vá na interface do Syncthing local, e crie a pasta sincronizada e marque em `Sharing` o seu servidor remoto e pronto, ambas as pastas serão sincronizadas, espelhadas, em rede local.

## Proxy reverso Nginx

No servidor é bom que você habilite a interface web através do Nginx, aqui está uma configuração exemplo para o mesmo:

`/etc/nginx/conf.d/apps/syncthing.conf`:
```nginx
server {
	listen 80;
	server_name syncthing.archserver.lan;
	proxy_buffering off;

	location / {
		proxy_pass http://127.0.0.1:8384;
	}
} 
```

Veja este artigo do blog para maior referência: [Configurando Nginx em servidor Linux]({% post_url 2023-01-19-nginx %}).

# Criptografia (Veracrypt)

Veracrypt é um suite de programas para criptografia de partições, dispositivos e diretórios que funcionam tanto em Windows quanto no Linux.

Conforme está página oficial do Veracrypt: [Veracrypt on network share](https://veracrypt.fr/en/Sharing%20over%20Network.html), para podermos ter uma partição criptografada de rede precisamos ou montar um volume criptografado ou um arquivo criptografado, eu escolhi o arquivo pois assim o volume permanece criptografado quando em rede e podendo ser montado sob demanda nos clientes de rede.

## Instalação

No windows baixe um instalador em [Veracrypt Downloads](https://www.veracrypt.fr/en/Downloads.html) e instale.

No linux:

```console
$ sudo pacman -S veracrypt
```

## Criando volume

Para criar a partição criptografada basta usar o Veracrypt em nosso computador local e guardar o volume criptografado em nossa partição de rede dedicada.

Abra o Veracrypt, clique em `Create volume`, `Create an encrypted file container`, `Standard Veracrypt`, de o local da partição de rede, `/mnt/archSharedEnc/veracrypt.enc` por exemplo, e vá seguindo as opções padrões, eu criei um volume de $$60Gb$$. Para mais opções verifique a documentação oficial, o importante é que o volume seja do tipo container criptografado e tenha uma boa senha, qual deve ser guardada muito bem, de preferência em um gerenciador como [KeepassXC](https://keepassxc.org).

Para montar o volume apena clique em `Select File...` e selecione o arquivo da partição de rede, clique em `Mount`, dê a senha chave e depois a senha de administrador do computador para terminar de montar, e pronto, agora você um volume criptografado em rede.

![]({{"../../../assets/Screenshot_20230131_114327.png" | relative_url}})

# Pensamentos finais

Este post foi feito como forma de abordar diferentes tecnologias e técnicas que possam ser interessantes para uso pessoal e profissional, como é o caso de partições de rede para diferentes sistemas operacionais, sincronização de arquivos e volumes criptografados, e como essas técnicas podem ser usadas de diferentes maneiras em conjunto para se ter resultados esperados. 

Fica aqui então este post como referência de como fazer cada umas destas coisas de forma conjunta, e por tabela, de forma separada também.

Tenho certeza que você deve ter achado interessante e que achará um caso de uso interessante para você, obrigado e até a próxima.

# Referências

* [XFS](https://wiki.archlinux.org/title/XFS)
* [Samba](https://wiki.archlinux.org/title/Samba)
* [Samba docs](https://www.samba.org/samba/docs/current/man-html/smb.conf.5.html)
* [Syncthing](https://wiki.archlinux.org/title/Syncthing)
* [Syncthing Get started](https://docs.syncthing.net/intro/getting-started.html)
* [Veracrypt on network share](https://veracrypt.fr/en/Sharing%20over%20Network.html)
