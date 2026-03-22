---
layout: post
title:  "Problemas com ventoinhas em 100% no Dell G15 com archlinux depois do kernel 6.14"
author: [peterson]
date:   2026-03-21 23:00:00 -0300
description: "Como diagnostiquei e resolvi o problema de fans girando a 5000 RPM constantemente após atualização do kernel no Dell G15 rodando Arch Linux"
categories: [linux, hardware, kernel, dell]
keywords: [linux, hardware, archlinux]
published: true
---
 
# Sumário
- [Sumário](#sumário)
- [Introdução](#introdução)
- [O Problema](#o-problema)
- [Diagnóstico](#diagnóstico)
  - [Descartando temperatura](#descartando-temperatura)
  - [Identificando o culpado](#identificando-o-culpado)
  - [Entendendo a causa raiz](#entendendo-a-causa-raiz)
- [A Solução](#a-solução)
    - [Teste de stress](#teste-de-stress)
    - [O que você perde ao blacklistar](#o-que-você-perde-ao-blacklistar)
    - [O que continua funcionando](#o-que-continua-funcionando)
- [Soluções Alternativas](#soluções-alternativas)
- [Rollback](#rollback)
- [Referências](#referências)
 
---
 
# Introdução
 
Após uma atualização completa do sistema no Arch Linux (`sudo pacman -Syu`), meu Dell G15 começou a operar com os fans em velocidade máxima constante — algo em torno de 5000 RPM — mesmo sem nenhuma carga relevante no sistema. O laptop estava funcionando perfeitamente antes da atualização, e as temperaturas estavam completamente normais.
 
Este post documenta todo o processo de diagnóstico e a solução que encontrei, que envolveu uma regressão introduzida no kernel 6.14+ relacionada ao driver `alienware_wmi`.
 
> Nota: Fiquei meses sem atualizar meu sistema devido a espaço de armazenamento, portanto algo possa ter passado batido devido a esse gap sem atualizações.

---
 
# O Problema
 
Logo após a atualização, o laptop estava visivelmente mais barulhento que o normal. Rodando `sensors`, a situação era clara:
 
```
dell_smm-virtual-0
Adapter: Virtual device
fan1:        5004 RPM  (min =    0 RPM, max = 3700 RPM)
fan2:        5004 RPM  (min =    0 RPM, max = 4000 RPM)
pwm1:            128%  MANUAL CONTROL
pwm2:            128%  MANUAL CONTROL
```
 
Os fans estavam girando **acima do limite máximo declarado** e em modo **MANUAL CONTROL** — ou seja, algo havia tomado controle manual dos fans e os travado em velocidade máxima.
 
---
 
# Diagnóstico
 
## Descartando temperatura
 
O primeiro passo foi verificar se o problema era térmico — talvez o sistema estivesse realmente quente e os fans estivessem reagindo corretamente.
 
```bash
sensors
```
 
```
coretemp-isa-0000
Package id 0:  +45.0°C  (high = +100.0°C, crit = +100.0°C)
...
alienware_wmi-virtual-0
CPU:          +45.0°C
GPU:          +37.0°C
```
 
Temperaturas completamente normais para idle. 

Rodando `htop` e `nvidia-smi` e verificando a carga na CPU e GPU, não havia nada utilizando nenhuma das duas de maneira demasiada.

O problema não era térmico — era o controle dos fans que estava quebrado.
 
## Identificando o culpado
 
Inspecionando os dispositivos hwmon disponíveis:
 
```bash
grep -r "" /sys/class/hwmon/hwmon*/name 2>/dev/null
```
 
```
/sys/class/hwmon/hwmon4/name: dell_smm
/sys/class/hwmon/hwmon5/name: alienware_wmi
```
 
O sistema expõe dois interfaces de controle de fans: `dell_smm` (hwmon4) e `alienware_wmi` (hwmon5). Verificando os valores de boost no `alienware_wmi`:
 
```bash
cat /sys/class/hwmon/hwmon5/fan1_boost
cat /sys/class/hwmon/hwmon5/fan2_boost
```
 
```
100
100
```
 
**Os dois fans estavam com boost em 100** — valor máximo. E o perfil de plataforma estava definido como `performance`:
 
```bash
cat /sys/firmware/acpi/platform_profile
```
 
```
performance
```
 
Tentativas de escrever diretamente nos arquivos `pwm` do `dell_smm` retornavam erro:
 
```bash
sudo sh -c 'echo 100 > /sys/class/hwmon/hwmon4/pwm1'
# Invalid argument
```
 
O `alienware_wmi` estava bloqueando o acesso direto via `dell_smm`.
 
## Entendendo a causa raiz
 
Analisando o histórico de patches do kernel, identifiquei que o suporte a controle manual de fans via `alienware_wmi` foi introduzido no kernel **6.15** (patch `v7 08/12` por Kurt Borja), e chegou ao Arch Linux a partir do kernel **6.14.4**.
 
O problema é que o driver `alienware_wmi`, ao ser carregado, **não inicializa o valor de `fan_boost` — ele simplesmente lê o que o EC (Embedded Controller) tem armazenado**, que no caso do G15 é `100` (boost máximo). O driver implementa corretamente o reset para `0` durante suspend/resume, mas esquece de fazer o mesmo durante o `probe` inicial do módulo.
 
Isso é essencialmente um **bug de regressão no driver** — o comportamento correto seria inicializar o boost para `0` no carregamento, deixando o controle automático da BIOS assumir. O comportamento durante suspend já está correto no código:
 
```c
// drivers/platform/x86/dell/alienware-wmi-wmax.c
static void awcc_hwmon_suspend(struct device *dev)
{
    // ...
    awcc_op_set_fan_boost(priv->wdev, fan->id, 0); // correto no suspend
}
// mas não existe equivalente no probe/init
```
 
Outro usuário no Arch Forums relatou o mesmo problema após atualizar para o kernel **6.14.4** em um desktop Dell, confirmando que a regressão não é exclusiva do G15.
 
---
 
# A Solução
 
A solução mais limpa e estável encontrada foi **blacklistar o módulo `alienware_wmi`**, deixando a BIOS assumir controle total dos fans sem interferência do kernel.
 
```bash
# Blacklist o módulo
echo "blacklist alienware_wmi" | sudo tee /etc/modprobe.d/alienware-wmi.conf
 
# Descarregar imediatamente sem precisar reiniciar
sudo modprobe -r alienware_wmi
 
# Reconstruir o initramfs para garantir que o blacklist seja aplicado no boot
sudo mkinitcpio -P
```
 
Após isso, os fans voltaram a operar em velocidade automática controlada pela BIOS:
 
```
dell_smm-virtual-0
fan1:        2267 RPM  (min =    0 RPM, max = 3700 RPM)
fan2:        2614 RPM  (min =    0 RPM, max = 4000 RPM)
pwm1:             64%  MANUAL CONTROL
```
 
### Teste de stress
 
Para validar que a BIOS ainda controla corretamente os fans sob carga:
 
```bash
stress-ng --cpu 0 --vm 2 --vm-bytes 1G --timeout 120s
```
 
Resultado: fans subiram automaticamente de ~2300 RPM para ~4200 RPM conforme as temperaturas subiam, e voltaram para ~2300 RPM em menos de um minuto após o fim do teste. A curva de fan da BIOS funciona corretamente sem o módulo.
 
### O que você perde ao blacklistar
 
- Controle de perfil de plataforma via userspace (`balanced`/`performance`) — irrelevante, pois a BIOS gerencia os fans automaticamente
- Leituras do hwmon `alienware_wmi` — o `dell_smm` e `dell_ddv` ainda fornecem todas as leituras de temperatura e RPM
- G-Mode via software — não crítico para uso diário
 
### O que continua funcionando
 
- Backlight do teclado (`dell-laptop` module, independente)
- Todas as leituras de temperatura e RPM via `dell_smm` e `dell_ddv`
- Controle automático de fans pela BIOS
 
---
 
# Soluções Alternativas
 
Caso você não queira blacklistar o módulo, existem outras abordagens:
 
**1. Serviço systemd para reset do boost no boot**
 
Cria um serviço que reseta o `fan_boost` para `0` após o carregamento do módulo, imitando o que o driver deveria fazer automaticamente:
 
```bash
sudo tee /etc/systemd/system/alienware-fan-fix.service << 'EOF'
[Unit]
Description=Reset Alienware fan boost on boot
After=multi-user.target
 
[Service]
Type=oneshot
ExecStart=/bin/sh -c 'echo 0 > /sys/class/hwmon/hwmon5/fan1_boost'
ExecStart=/bin/sh -c 'echo 0 > /sys/class/hwmon/hwmon5/fan2_boost'
RemainAfterExit=yes
 
[Install]
WantedBy=multi-user.target
EOF
 
sudo systemctl enable --now alienware-fan-fix.service
```
 
> **Atenção:** Com `fan_boost=0` e perfil `balanced`, a BIOS pode deixar os fans completamente parados em idle, o que pode causar temperaturas mais altas (~60°C) em repouso dependendo do modelo. Ajuste o valor de boost (0-255) conforme necessário.
 
**2. Patch no driver do kernel**
 
A correção upstream seria adicionar a inicialização do boost durante o `probe` do módulo, espelhando o que já é feito no suspend. Um patch simples em `drivers/platform/x86/dell/alienware-wmi-wmax.c` resolveria o problema para todos os usuários. Se você quiser contribuir, o mantenedor do driver é **Kurt Borja** (`kuurtb@gmail.com`) e a lista de discussão relevante é `platform-driver-x86@vger.kernel.org`.
 
---
 
# Rollback
 
Caso precise reverter e reativar o módulo:
 
```bash
# Remover o blacklist
sudo rm /etc/modprobe.d/alienware-wmi.conf
 
# Reconstruir initramfs
sudo mkinitcpio -P
 
# Carregar o módulo imediatamente sem reiniciar
sudo modprobe alienware_wmi
 
# Verificar
lsmod | grep alienware
sensors | grep -A5 alienware
```
 
Se não conseguir bootar, use um live USB do Arch, faça chroot e remova o blacklist:
 
```bash
mount /dev/sua-particao-root /mnt
arch-chroot /mnt
rm /etc/modprobe.d/alienware-wmi.conf
mkinitcpio -P
exit && umount /mnt && reboot
```
 
---
 
# Referências
 
* [Kernel patch — alienware-wmi-wmax: Add support for manual fan control (v2 08/10)](https://www.spinics.net/lists/platform-driver-x86/msg51368.html)
* [Kernel patch series — HWMON support + DebugFS + Improvements (LWN)](https://lwn.net/Articles/1013222/)
* [Documentação oficial do driver alienware-wmi](https://docs.kernel.org/admin-guide/laptops/alienware-wmi.html)
* [Arch Linux Forums — Very noisy fans on Dell desktop after upgrade to 6.14.4](https://bbs.archlinux.org/viewtopic.php?id=305314)
* [Arch Linux Forums — Alienware fans not working](https://bbs.archlinux.org/viewtopic.php?id=300540)
* [ArchWiki — Fan speed control](https://wiki.archlinux.org/title/Fan_speed_control)
* [ArchWiki — Kernel downgrading](https://wiki.archlinux.org/title/Downgrading_packages)