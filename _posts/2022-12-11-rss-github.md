---
layout: post
title:  "Configurando uma máquina Linux e acesso remoto via SSH"
author: [peterson]
date:   2022-12-06 00:00:00 -0300
description: "Configurando uma máquina Linux e acesso remoto via SSH"
categories: [linux, homelab, tutorials]
keywords: [linux, homelab, tutorials, archlinux, ssh]
published: false
katex: true
---

### 
GET https://api.github.com/feeds
Authorization: Basic Joao-Peterson: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
X-GitHub-Api-Version:2022-11-28

### 
GET https://github.com/Joao-Peterson.private.atom
?token=APQUWKBQNANVJARCORA5ZCGBUJMS6

Accept: application/atom+xml
Authorization: Basic Joao-Peterson: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
X-GitHub-Api-Version:2022-11-28

### 
GET https://github.com/dart-lang/sdk/discussions
Accept: application/atom+xml
Authorization: Basic Joao-Peterson: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
X-GitHub-Api-Version:2022-11-28

### 
GET https://github.com/security-advisories
Accept: application/atom+xml
Authorization: Basic Joao-Peterson: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
X-GitHub-Api-Version:2022-11-28

{
  "timeline_url": "https://github.com/timeline",
  "user_url": "https://github.com/{user}",
  "current_user_public_url": "https://github.com/octocat",
  "current_user_url": "https://github.com/octocat.private?token=abc123",
  "current_user_actor_url": "https://github.com/octocat.private.actor?token=abc123",
  "current_user_organization_url": "",
  "current_user_organization_urls": [
    "https://github.com/organizations/github/octocat.private.atom?token=abc123"
  ],
  "security_advisories_url": "https://github.com/security-advisories",
  "_links": {
    "timeline": {
      "href": "https://github.com/timeline",
      "type": "application/atom+xml"
    },
    "user": {
      "href": "https://github.com/{user}",
      "type": "application/atom+xml"
    },
    "current_user_public": {
      "href": "https://github.com/octocat",
      "type": "application/atom+xml"
    },
    "current_user": {
      "href": "https://github.com/octocat.private?token=abc123",
      "type": "application/atom+xml"
    },
    "current_user_actor": {
      "href": "https://github.com/octocat.private.actor?token=abc123",
      "type": "application/atom+xml"
    },
    "current_user_organization": {
      "href": "",
      "type": ""
    },
    "current_user_organizations": [
      {
        "href": "https://github.com/organizations/github/octocat.private.atom?token=abc123",
        "type": "application/atom+xml"
      }
    ],
    "security_advisories": {
      "href": "https://github.com/security-advisories",
      "type": "application/atom+xml"
    }
  }
}