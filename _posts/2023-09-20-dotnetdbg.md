---
layout: post
title:  "Debugando aplicações .NET core no Code OSS e GDB usando debugger open source"
author: [peterson]
date:   2023-08-01 12:00:00 -0300
description: "Debugando aplicações .NET core no Code OSS e GDB usando debugger open source"
categories: [linux, tutorials, keyboard, dotnet]
keywords: [linux, tutorials, keyboard, keyd, .net, dotnet, netcoredbg]
published: true
katex: true
---

Aplicações .NET core são cross platform e bastante funcionais, aplicações back end tem uma performance aí bastante boa, como foi visto na [rinha de backend 2023Q3](https://github.com/zanfranceschi/rinha-de-backend-2023-q3). O porém é que quando desejamos realizar projetos em .NET em ambientes open source as coisas ficam complicadas, por vez, você poderia simplesmente baixar o vscode na sua máquina unix, instalar a extensão do .NET e apertar F5 e tudo irá funcionar perfeitamente. 

Só que, se você é como eu vai estar provavelmente usando algum editor mais oss, como vim, emacs ou o code oss, versão open source do vscode, open core na verdade né, e ao utilizar o debugger da extensão você vai se deparar com uma mensagem dizendo que o debugger só funciona na distribuição licenciada microsoft, isso devido a microsoft é por que o debugger é uma aplicação closed source, buah buah. Para nossa alegria alguém criou uma aplicação oss para depuração de programas .NET que possui interface com o protocolo de depuração do vscode e também da interface MI para o GDB, podendo assim também estarmos utilizando o GDB. Chama-se [netcoredbg](https://github.com/Samsung/netcoredbg), incrivelmente, feito pela Samsung, deixe a sua estrelinha lá.

# Instalação

## Arch linux

Via AUR

```console
$ yay -S netcoredbg 
```

# Code oss

Em seu projeto aberto no code oss, instale a Extensão [C#](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csharp) e altere as configurações conforme desejado, por exemplo para apontar para um sdk já instalado, por que talvez a extensão instale ele para você. Então abra um projeto .NET e crie os seguintes arquivos no seu diretório:

* **lembre de alterar os campos com as opções do seu projeto**

`.vscode/tasks.json`
```json
{
	"version": "2.0.0",
	"tasks": [
		{
			"label": "build_debug",
			"command": "dotnet",
			"type": "process",
			"args": [
				"build",
				"--debug",
				"${workspaceFolder}/ARQUIVO DA SOLUÇÃO.sln",
				"/property:GenerateFullPaths=true",
				"/consoleloggerparameters:NoSummary"
			],
			"problemMatcher": "$msCompile"
		},
		{
			"label": "build",
			"command": "dotnet",
			"type": "process",
			"args": [
				"build",
				"${workspaceFolder}/ARQUIVO DA SOLUÇÃO.sln",
				"/property:GenerateFullPaths=true",
				"/consoleloggerparameters:NoSummary"
			],
			"problemMatcher": "$msCompile"
		}
	]
}
```

`.vscode/launch.json`
```json
{
	"version": "0.2.0",
	"configurations": [
		{
			"name": "netcoredbg",
			"type": "coreclr",
			"request": "launch",
			"preLaunchTask": "build_debug",
			"cwd": "${workspaceFolder}/DIRETORIO DA APLICAÇÃO",
			"program": "${workspaceFolder}/DIRETORIO DA APLICAÇÃO/APLICAÇÃO.dll",
			"stopAtEntry": false,

			"pipeTransport": {
				"pipeCwd": "${workspaceFolder}",
				"pipeProgram": "bash",
				"pipeArgs": ["-c"],
				"debuggerPath": "netcoredbg  --engineLogging=/tmp/a",
				"quoteArgs": true
			}
		}
	]
}
```

Se você conhece vscode sabe que `task.json` são scripts a serem executados, nesse caso temos a build do projeto usando o dotnet build em modo debug.

No `launch.json` temos as configurações para executar a aplicação, onde vamos definir a task pré launch como a nossa `build_debug` e o tipo de launch, nesse caso `coreclr`. O pulo do gato está em `pipeTransport`, que redireciona a chamada de launch para o nosso debugger open source, o `netcoredbg`. Agora ao apertar F5, sua aplicação deverá ser executada e como você já conhece no vscode, os menus e visualização do debugger vão aparecer.

# Referências

* [netcoredbg](https://github.com/Samsung/netcoredbg)
* [launch.json gist](https://github.com/Samsung/netcoredbg/issues/39)
