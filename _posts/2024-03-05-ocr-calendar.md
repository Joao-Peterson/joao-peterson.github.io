---
layout: post
title:  "Lendo horários de papel/imagens e colocando como eventos no Google calendar"
author: [peterson]
date:   2024-03-05 20:00:00 -0300
description: "Lendo horários de papel/imagens e colocando como eventos no Google calendar"
categories: [linux, qol]
keywords: [linux, quality of life, ocr, tesseract, google calendar, calendar]
published: true
katex: true
---

# Sumário
- [Sumário](#sumário)
- [Introdução](#introdução)
  - [OCR](#ocr)
  - [Tratamento](#tratamento)
  - [Importando](#importando)
- [Conclusão](#conclusão)
- [Referências](#referências)

# Introdução

Hoje perdi várias aulas da minha autoescola por que eles me passaram dois prints de tela, as duas em 128p, com data e hora, seguindo de outra imagem com correções. Resultado, me perdi, e agora devo R$150 reais em aulas atrasadas, nunca mais!

Vamos pegar essas imagens, pegar o texto e exportar os eventos pro google calendar.

## OCR

Vamos utilizar o [Tesseract](https://github.com/tesseract-ocr/tesseract) com o auxilio da GUI [gImageReader](https://github.com/manisandro/gImageReader) para retirar os dados da imagem, vamos aumentar o contraste para 10 e a escala da imagem em 200, duas vezes né.

![]({{"assets/ocr-gc-1.png" | relative_url}})

Ao lado vemos o resultado da identificação. Fazemos isso para uma segunda imagem também.

## Tratamento

Montamos um CSV na mão mesmo com esses dados e formatamos conforme sugere o [Google Calendar](https://support.google.com/calendar/answer/37118?hl=en&co=GENIE.Platform=Desktop#zippy=%2Ccreate-or-edit-a-csv-file).

![]({{"assets/ocr-gc-2.png" | relative_url}})

Falta colocar o horário de término, para isso usaremos o LibreOffice Calc, ou Excel, para somar os horários de inicio com o período das aulas.

![]({{"assets/ocr-gc-3.png" | relative_url}})

Então formatamos o cabeçalho novamente como informado pela Google.

![]({{"assets/ocr-gc-4.png" | relative_url}})

## Importando

Para importa vá no Google Calendar para ´Settings > Import & export´ e selecione o CSV.

![]({{"assets/ocr-gc-5.png" | relative_url}})

Por fim importe e teremos os horários:

![]({{"assets/ocr-gc-6.png" | relative_url}})

# Conclusão 

CFC's e o governo são um esquema de piramide pois arrecadam cada vez mais enquanto não há retorno e os mais acima da piramide ganham mais e mais, obrigado!

# Referências

* [Tesseract](https://github.com/tesseract-ocr/tesseract)
* [gImageReader](https://github.com/manisandro/gImageReader)
* [Google Calendar](https://support.google.com/calendar/answer/37118?hl=en&co=GENIE.Platform=Desktop#zippy=%2Ccreate-or-edit-a-csv-file)