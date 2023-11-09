---
layout: post
title:  "Rodando Windows 10 em máquina virtual no Linux usando QEMU e Virt Manager"
author: [peterson]
date:   2023-11-09 11:00:00 -0300
description: "Rodando Windows 10 em máquina virtual no Linux usando QEMU e Virt Manager"
categories: [linux, sysadmin, tutorials]
keywords: [linux, sysadmin, tutorials, qemu, virt manager, windows 10, kvm, github pages, github]
published: true
katex: true
---

# Introdução

Normalmente quando precisamos usar software windows mas usamos linux, recorremos a usar máquina com dual boot, que são de fato a melhor opção para interoperabilidade, porém se deseja ter o conforte de utilizar uma máquina windows dentro de seu desktop linux, máquina virtuais podem ser uma ótima solução. Neste post vamos ver como configurar uma máquina windows 10 usando QEMU e Virt Manager.

Em alguns casos é até possível utilizar uma GPU externa em uma máquina virtual windows e jogar jogos pesados e até softwares de edição de vídeo ou modelagem 3D usando [GPU passthrough](https://www.youtube.com/watch?v=IDnabc3DjYY), mas nesse post não vamos abordar esse tema, apenas video normal.

# Sumário
- [Introdução](#introdução)
- [Sumário](#sumário)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Criando uma VM Windows 10](#criando-uma-vm-windows-10)
- [Referências](#referências)

# Instalação

Pacotes a serem instalados no arch linux:

```console
$ sudo pacman -S qemu-base qemu-audio-spice qemu-chardev-spice qemu-ui-spice-app qemu-ui-spice-core spice spice-vdagent qemu-hw-display-qxl virtiofsd virt-manager
```

# Configuração

Habilitar conexão do virtmanager com o QEMU:

```console
$ sudo systemctl enable --now libvirtd.socket
```

Adicione seu usuário ao grupo do virtmanager:

```console
$ sudo usermod -aG libvirt $USER
```

Crie uma pasta onde arquivos e imagens acessadas pelo virtmanager. Ex:

```console
$ mkdir ~/machines
```

E mude as permissões para o grupo:

```console
$ chown $USER:libvirt-qemu ~/machines
```

Abra o virt manager e verifique se a conexão com QEMU está funcionando:

![]({{"assets/qemuvirt.png" | relative_url}})

Se necessário reinicie sua máquina, abra o virt manager, clique com o direito do mouse sobre `QEMU/KVM`, e clique em `Connect`.

Clique com o direito novamente em `QEMU/KVM`, depois em `Details` e configure na aba de `Virtual Networks` para iniciar no boot. Assim a rede virtual que sua máquina virtual irá usar para se conectar a internet estará sempre funcionando, habilitada quando sua máquina ligar.

![]({{"assets/qemunet.png" | relative_url}})

# Criando uma VM Windows 10

Baixe duas coisas, a imagem do windows 10 e o drivers de video e rede:

* Imagem: [Windows 10 ISO](https://www.microsoft.com/en-us/software-download/windows10ISO/)

* Drivers: [Virtio](https://fedorapeople.org/groups/virt/virtio-win/direct-downloads/stable-virtio/virtio-win.iso)

Salve ambas as ISO's em seu diretório criado anteriormente, Ex: `~/machines`.

Crie a máquina virtual:

![]({{"assets/virtnew1.png" | relative_url}})
![]({{"assets/virtnew2.png" | relative_url}})
![]({{"assets/virtnew3.png" | relative_url}})
![]({{"assets/virtnew4.png" | relative_url}})
![]({{"assets/virtnew5.png" | relative_url}})

Configurando a máquina, clique duas vezes nela, depois clique na exclamação azul:

![]({{"assets/vm1.png" | relative_url}})

Vamos configurar primeiro a rede para `virtio`:

![]({{"assets/vm2.png" | relative_url}})

Depois o display para `spice` e `opengl` desligado:

![]({{"assets/vm3.png" | relative_url}})

Depois o video para `QXL`:

![]({{"assets/vm4.png" | relative_url}})

E por último, como vamos usar os drivers como se fosse um disco ligado a máquina, precisamos primeiro adicionar o disco como `CDROM`:

![]({{"assets/vm5.png" | relative_url}})

Feito tudo isso, inicialize a máquina e instale o windows no seu disco virtual. 

![]({{"assets/vm6.png" | relative_url}})

Fica a seu critério como instalar, com uma chave oficial ou usando um Windows 10 sem licença.

Se você possuí um notebook ou computador que veio com windows de fábrica e agora você fez dual boot nele ou só instalou uma distro linux nele, você pode recuperar usar a chave do windows que está gravada na ACPI do computador, basta executar esse comando e retirar a chave:

```console
$ sudo acpidump -n MSDM
```

Talvez precise instalar o pacote `acpica` no arch linux.

![]({{"assets/winkey.png" | relative_url}})

Com o windows instalado vamos instalar os drivers, vá para o `gerenciador de dispositivos` ou `device manager`, e procure o adaptador de rede:

![]({{"assets/vm7.png" | relative_url}})

Clique em `buscar drivers nesse computador` e selecione o disco com os drivers, no meu caso foi o disco `E:`, não selecione nenhuma paste, apenas o disco. Agora você pode verificar que temos instalado o driver `Red hat virtio`:

![]({{"assets/vm8.png" | relative_url}})

Faça a mesma coisa para o adaptador de video:

![]({{"assets/vm9.png" | relative_url}})
![]({{"assets/vm10.png" | relative_url}})

E com isso agora você pode mudar a resolução da tela se desejar:

![]({{"assets/vm11.png" | relative_url}})

# Referências

* [Archwiki - QEMU](https://wiki.archlinux.org/title/QEMU)
* [Archwiki - Virt Manager](https://wiki.archlinux.org/title/Virt-manager)
* [Fast Windows 10 VM on Linux with QEMU/KVM and VirtIO](https://www.youtube.com/watch?v=ZqBJzrQy7Do)