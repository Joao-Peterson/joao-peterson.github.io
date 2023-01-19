---
layout: post
title:  "Adicionando feeds RSS do Github em seu agregador"
author: [peterson]
date:   2023-01-19 00:00:00 -0300
description: "Adicionando feeds RSS do Github em seu agregador"
categories: [linux, homelab, tutorials]
keywords: [linux, homelab, tutorials, archlinux, rss, github]
published: true
katex: true
---

Olá meus caros, hoje vim trazer um artigo rápido de como adicionar feeds do github em seu agregador RSS/Atom favorito. Para este artigo estarei utilizando o agregador FreshRSS e gostaria de ressaltar que este artigo pode ficar **desatualizado** pois o github passou por uma mudança de acesso recentemente que altera a forma como tokens e logins funcionam, portanto vale sempre a leitura oficial de como usar os feeds, veja as [Referências](#referências).

# Sumário
- [Sumário](#sumário)
- [Criando token de acesso](#criando-token-de-acesso)
- [Ver feeds disponíveis](#ver-feeds-disponíveis)
- [Feed privado](#feed-privado)
	- [FreshRSS](#freshrss)
- [Referências](#referências)

# Criando token de acesso

Os feeds serão acessados via API rest, e devemos nos autorizar conforme, porém a autorização rest básica utilizando usuário e senha github foi descontinuada, agora você precisa gerar um token, com permissões pré definidas para ter acesso.

No momento em que escrevo este artigo há dois tipos de tokens, Tokens clássicos e Tokens fine grained (ajuste fino), sendo este último a preferência devido as permissões customizadas que podemos dar.

Para criar os tokens vá para: 
* [https://github.com/settings/profile](https://github.com/settings/profile)

Role para baixo até encontrar o menu de `Preferências de desenvolvedor` (`Developer Settings`).

![]({{"../../../assets/Screenshot_20230119_001651.png" | relative_url}})]

Clique em `Fine-grained` e em `Gerar novo token`.

Digite o nome desejado, o tempo de validade e uma descrição opcional, `Repository Access` deixe como `Public Repositories (read-only)`, e não necessidade de permissões especiais, deixe tudo como está e clique ao final em `Generate token`.

**Copie o token agora e guarde se necessário pois depois você não poderá mais vê lo.**

# Ver feeds disponíveis

Agora com seu token você pode verificar todos os feeds disponíveis para seu usuário, basta fazer uma requisição Rest como esta:

```
GET https://api.github.com/feeds
Authorization: Basic <USUARIO>:<TOKEN>
X-GitHub-Api-Version:2022-11-28
```

Retorno:
```json
{
	"timeline_url": "https://github.com/timeline",
	"user_url": "https://github.com/<USUARIO>",
	"current_user_public_url": "https://github.com/<USUARIO>",
	"current_user_url": "https://github.com/<USUARIO>.private?token=abc123",
	"current_user_actor_url": "https://github.com/<USUARIO>.private.actor?token=abc123",
	"current_user_organization_url": "",
	"current_user_organization_urls": [
		"https://github.com/organizations/github/<USUARIO>.private.atom?token=abc123"
	],
	"security_advisories_url": "https://github.com/security-advisories",
	"_links": {
		"timeline": {
			"href": "https://github.com/timeline",
			"type": "application/atom+xml"
		},
		"user": {
			"href": "https://github.com/<USUARIO>",
			"type": "application/atom+xml"
		},
		"current_user_public": {
			"href": "https://github.com/<USUARIO>",
			"type": "application/atom+xml"
		},
		"current_user": {
			"href": "https://github.com/<USUARIO>.private?token=abc123",
			"type": "application/atom+xml"
		},
		"current_user_actor": {
			"href": "https://github.com/<USUARIO>.private.actor?token=abc123",
			"type": "application/atom+xml"
		},
		"current_user_organization": {
			"href": "",
			"type": ""
		},
		"current_user_organizations": [
			{
				"href": "https://github.com/organizations/github/<USUARIO>.private.atom?token=abc123",
				"type": "application/atom+xml"
			}
		],
		"security_advisories": {
			"href": "https://github.com/security-advisories",
			"type": "application/atom+xml"
		}
	}
}
```

Note que estes são os possíveis retorno conforme suas permissões, o resultado final poderá possuir menos itens.

Uma explicação dos feeds:

* `timeline`: Linha do tempo do seu usuário
* `user`: Feed de eventos publico de qualquer usuário do github
* `current_user_public`: O seu feed publico
* `current_user`: Seu feed privado, é igual aos eventos da página inicial que abre quando você loga no github
* `current_user_actor`: Não sei :P
* `current_user_organization`: Feed de eventos da sua organização
* `current_user_organizations`: Feed de eventos de qualquer organização do github
* `security_advisories`: Feed de noticias de cyber segurança do github como alertas de vulnerabilidades e avisos gerais

# Feed privado

Provavelmente o seu feed de interesse será o feed privado, e se como eu ele não apareceu ao realizar a [visualização de feeds](#ver-feeds-disponíveis), pois necessitamos de um token especial para ele, você pode fazer o seguinte.

Vá até sua página inicial do github, role até em baixo e ache o link para seu feed, ele já virá com o token de acesso especial, clique com o mouse direito e em copiar endereço.

![]({{"../../../assets/Screenshot_20230119_004749.png" | relative_url}})

Agora a sua requisição será desta forma:

```
GET https://github.com/<USUARIO>.private?token=<TOKEN_ESPECIAL>
Authorization: Basic <USUARIO>:<TOKEN>
X-GitHub-Api-Version:2022-11-28
```

## FreshRSS

No FreshRSS, clique para adicionar um novo feed e coloque sua URL copiada anteriormente, seu usá´rio github e seu token fine grained como senha HTTP.

![]({{"../../../assets/Screenshot_20230119_005228.png" | relative_url}})

E agora você terá seu feed privado:

![]({{"../../../assets/Screenshot_20230119_005500.png" | relative_url}})

# Referências

* [Github Feeds](https://docs.github.com/en/rest/activity/feeds)
* [Github Auth Methods](https://docs.github.com/pt/rest/overview/other-authentication-methods)
