# News Source Matrix

## Objetivo
Definir ao menos 5 fontes por país para ingestão de notícias em tempo real por campeonato, usando RSS/API oficial sempre que possível e scraping controlado como fallback.

## Países e fontes

### Brasil
| Fonte | Tipo | URL principal | Feed/API | Campeonatos |
| --- | --- | --- | --- | --- |
| ge | RSS | https://ge.globo.com/ | https://ge.globo.com/rss/ge/futebol/ | Brasileirão, Champions, La Liga, Premier, Copa |
| ESPN Brasil | Scrape | https://www.espn.com.br/futebol/ | - | Brasileirão, Champions, La Liga, Premier, Copa |
| UOL Esporte | Scrape | https://www.uol.com.br/esporte/futebol/ | - | Brasileirão, Copa |
| Gazeta Esportiva | Scrape | https://www.gazetaesportiva.com/futebol/ | - | Brasileirão, Champions, La Liga, Premier |
| LANCE! | Scrape | https://www.lance.com.br/ | - | Brasileirão, Champions, La Liga, Premier |

### Espanha
| Fonte | Tipo | URL principal | Feed/API | Campeonatos |
| --- | --- | --- | --- | --- |
| Marca | RSS | https://www.marca.com/ | https://e00-marca.uecdn.es/rss/futbol.xml | La Liga, Champions, Copa |
| AS | RSS | https://as.com/futbol/ | https://futbol.as.com/rss/ | La Liga, Champions, Copa |
| Mundo Deportivo | Scrape | https://www.mundodeportivo.com/futbol | - | La Liga, Champions, Copa |
| SPORT | Scrape | https://www.sport.es/es/futbol/ | - | La Liga, Champions |
| ElDesmarque | Scrape | https://www.eldesmarque.com/futbol | - | La Liga, Champions |

### Inglaterra
| Fonte | Tipo | URL principal | Feed/API | Campeonatos |
| --- | --- | --- | --- | --- |
| The Guardian Football | RSS | https://www.theguardian.com/football | https://feeds.theguardian.com/theguardian/football/rss | Premier, Champions, Copa |
| BBC Sport Football | Scrape | https://www.bbc.com/sport/football | - | Premier, Champions, Copa |
| Sky Sports Football | Scrape | https://www.skysports.com/football | - | Premier, Champions |
| The Telegraph Football | Scrape | https://www.telegraph.co.uk/football/ | - | Premier, Champions |
| The Independent Football | Scrape | https://www.independent.co.uk/sport/football | - | Premier, Champions |

### Pool europeu/oficial para Champions
| Fonte | Tipo | URL principal | Feed/API | Campeonatos |
| --- | --- | --- | --- | --- |
| UEFA | Scrape | https://www.uefa.com/uefachampionsleague/news/ | - | Champions, Copa |

## Regras de priorização
1. Priorizar fontes do país do campeonato.
2. Em empate, priorizar o idioma do sistema do usuário.
3. Em campeonatos internacionais, usar fonte oficial do torneio antes de portais genéricos.
4. Quando o usuário escolher um país preferido na conta, aplicar boost nas fontes desse país, sem esconder as fontes nativas do campeonato.
5. Não exibir duplicatas por URL canônica ou título quase idêntico.

## Estado de implementação recomendado
- v1: ge, Marca, AS, Guardian, UEFA
- v2: ESPN Brasil, UOL, Gazeta, LANCE!, BBC, Sky, Telegraph, Independent, Mundo Deportivo, SPORT, ElDesmarque
