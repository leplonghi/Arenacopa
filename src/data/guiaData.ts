
// ARENA CUP - GUIA DATA (MASTER)
// Este arquivo é gerado automaticamente via scripts/generate_sedes_data.ts
// Não edite manualmente.

export interface HostCity {
    id: string;
    name: string;
    countryCode: "USA" | "MEX" | "CAN";
    population: string;
    description: string;
    highlights: string[];
    stadiumName: string;
    stadiumId: string;
    stadiumCapacity: number;
    stadiumImage?: string;
    image?: string;
    geoCoordinates: [number, number];
    curiosities: string[];
    weather: string;
    travelGuide?: {
        heroImage: string;
        transport: {
            airport: string;
            publicTransport: string;
            taxiUber: string;
        };
        gastronomy: {
            title: string;
            dishes: { name: string; description: string; priceLevel: "low" | "medium" | "high" }[];
            tips: string[];
        };
        tourism: {
            topAttractions: { name: string; description: string; image?: string }[];
            hiddenGems: string[];
        };
        accommodation: {
            avgHotelPrice: string;
            avgAirbnbPrice: string;
            bestAreas: string[];
        };
        safety: {
            level: "safe" | "caution" | "risk";
            tips: string[];
            emergencyNumbers: string[];
        };
    };
    altitude?: number;
    timezone?: string;
    avgTempSummer?: string;
    gdp?: string;
    mainEconomicActivities?: string[];
    nearestAirport?: string;
    wcMatches?: number;
    wcRole?: string;
    stadiumYearBuilt?: number;
    stadiumCost?: string;
    historicFact?: string;
    demographics?: string;
}

export interface HostCountry {
    code: "USA" | "MEX" | "CAN";
    name: string;
    flag: string;
    description: string;
    capital: string;
    population: string;
    currency: string;
    footballHistory: string;
    travelTips: string[];
    cities: HostCity[];
    gdp?: string;
    wcParticipations?: number;
}

const rawCities: HostCity[] = [
    {
        "id": "mex-cdmx",
        "name": "Cidade do México",
        "countryCode": "MEX",
        "population": "22 milhões",
        "description": "A metrópole que pulsa futebol. Única cidade a receber três aberturas de Copa.",
        "highlights": [
            "Estádio Azteca",
            "História Asteca",
            "Gastronomia"
        ],
        "stadiumName": "Estádio Azteca",
        "stadiumId": "azteca",
        "stadiumCapacity": 83264,
        "image": "https://images.unsplash.com/photo-1512813195386-6cf811ad3542",
        "geoCoordinates": [
            19.3029,
            -99.1505
        ],
        "curiosities": [
            "O Estádio Azteca será o primeiro da história a sediar três jogos de abertura de Copa do Mundo: 1970, 1986 e 2026.",
            "A Cidade do México afunda 10 a 30 cm por ano — foi construída sobre o Lago Texcoco, drenado pelos espanhóis no século XVII.",
            "Com 2.240m de altitude, é a sede mais alta da Copa — jogadores sentem falta de fôlego nas primeiras 48h.",
            "Tem mais museus por habitante do que qualquer outra cidade das Américas: são mais de 150 espaços.",
            "Foi aqui que Pelé ganhou seu terceiro título mundial em 1970 e Maradona marcou o gol do século em 1986.",
            "O Estádio Azteca comportou 114.600 pessoas em 1968 — o maior público da história em um estádio coberto."
        ],
        "weather": "Junho/Julho: Médias de 24°C / 14°C. Estação chuvosa suave.",
        "travelGuide": {
            "heroImage": "https://images.unsplash.com/photo-1512813195386-6cf811ad3542",
            "transport": {
                "airport": "Benito Juárez (MEX)",
                "publicTransport": "Metrô e Metrobús eficientes e econômicos.",
                "taxiUber": "Uber e Lyft amplamente disponíveis em todas as sedes."
            },
            "gastronomy": {
                "title": "Culinária Local",
                "dishes": [
                    {
                        "name": "Tacos al Pastor",
                        "description": "Carne de porco marinada com abacaxi.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Chiles en Nogada",
                        "description": "Pimentas recheadas com molho de nozes e romã.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Mole Poblano",
                        "description": "Molho complexo de pimenta e chocolate.",
                        "priceLevel": "medium"
                    }
                ],
                "tips": [
                    "Visite o Mercado de la Merced para a experiência gastronômica mais autêntica e barata",
                    "Tlayudas, sopes e elotes custam menos de US$3 nas barracas de rua",
                    "A altitude de 2.240m pode causar ressaca antes do álcool — beba bastante água"
                ]
            },
            "tourism": {
                "topAttractions": [
                    {
                        "name": "Zócalo",
                        "description": "O coração histórico da cidade."
                    },
                    {
                        "name": "Teotihuacán",
                        "description": "Pirâmides antigas a 30 milhas do centro."
                    },
                    {
                        "name": "Bosque de Chapultepec",
                        "description": "Um dos maiores parques urbanos do mundo."
                    }
                ],
                "hiddenGems": [
                    "Coyoacán — bairro boêmio colorido onde Frida Kahlo nasceu e viveu, com mercado aos domingos",
                    "Xochimilco — canais pré-hispânicos com trajineras coloridas e bandas de mariachi ao vivo",
                    "Mercado de Medellín — mercado de bairro autêntico em Roma Norte, longe dos roteiros turísticos",
                    "Barrio de Tepito — se for com guia local, é o epicentro da cultura popular urbana mexicana"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 120 - 350 / noite",
                "avgAirbnbPrice": "US$ 60 - 180 / noite",
                "bestAreas": [
                    "Polanco — luxo e restaurantes estrelados, 30 min do Azteca",
                    "Roma Norte — cafés, arte e vida noturna trendy, custo médio",
                    "Condesa — parques, bares e gastronomia, ótimo custo-benefício"
                ]
            },
            "safety": {
                "level": "caution",
                "tips": [
                    "Use apenas táxis de aplicativo (Uber/inDriver) — nunca táxis na rua",
                    "Evite caminhar com celular visível em zonas turísticas como Centro Histórico",
                    "Polanco, Roma Norte e Condesa são os bairros mais seguros para turistas"
                ],
                "emergencyNumbers": [
                    "911"
                ]
            }
        },
        "stadiumYearBuilt": 1966,
        "stadiumCost": "US$ 260M (ajustado)",
        "historicFact": "Palco dos gols de Pelé em 70 e da 'Mão de Deus' de Maradona em 86.",
        "gdp": "Principal hub financeiro e cultural da América Latina. PIB est. $500B.",
        "wcMatches": 5,
        "wcRole": "Abertura"
    },
    {
        "id": "usa-ny",
        "name": "Nova York / Nova Jersey",
        "countryCode": "USA",
        "population": "20.1 milhões",
        "description": "A capital do mundo e sede da Grande Final em 19 de julho de 2026.",
        "highlights": [
            "Sede da Final",
            "Empire State",
            "Multiculturalismo"
        ],
        "stadiumName": "MetLife Stadium",
        "stadiumId": "metlife",
        "stadiumCapacity": 82500,
        "image": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48",
        "geoCoordinates": [
            40.8128,
            -74.0742
        ],
        "curiosities": [
            "O MetLife Stadium será rebatizado para a grande final — a FIFA exige naming-rights neutros.",
            "Nova York é a única cidade do mundo onde mais de 800 idiomas são falados regularmente.",
            "O MetLife já sediou 2 Super Bowls e nenhuma partida de Copa do Mundo — até agora.",
            "Brooklyn tem a maior concentração de brasileiros dos EUA, estimada em 100 mil pessoas.",
            "A Grand Central Terminal tem uma sala de sussurros: quem fala num canto é ouvido no canto oposto.",
            "O Central Park tem mais espécies de árvores do que muitos países inteiros — 26.000 árvores de 200 espécies."
        ],
        "weather": "Junho/Julho: Médias de 29°C / 20°C. Quente e úmido.",
        "travelGuide": {
            "heroImage": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48",
            "transport": {
                "airport": "Newark (EWR) / JFK / LaGuardia",
                "publicTransport": "Rede de metrô 24h em NY e trens NJ Transit.",
                "taxiUber": "Uber e Lyft amplamente disponíveis em todas as sedes."
            },
            "gastronomy": {
                "title": "Culinária Local",
                "dishes": [
                    {
                        "name": "NY Pizza",
                        "description": "Fatia fina e crocante clássica.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Bagels com Lox",
                        "description": "Salmão defumado e cream cheese no bagel.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Cheesesteak (NJ Style)",
                        "description": "Carne com queijo provolone no pão hoagie.",
                        "priceLevel": "medium"
                    }
                ],
                "tips": [
                    "Coma na Koreatown (32ª rua) para o melhor custo-benefício de Manhattan",
                    "Chelsea Market tem 35+ fornecedores artesanais num complexo industrial histórico",
                    "Gorjeta de 18-20% é padrão — em muitos restaurantes já é incluída automaticamente"
                ]
            },
            "tourism": {
                "topAttractions": [
                    {
                        "name": "Times Square",
                        "description": "O cruzamento mais brilhante do mundo."
                    },
                    {
                        "name": "Estátua da Liberdade",
                        "description": "Símbolo universal de liberdade."
                    },
                    {
                        "name": "Central Park",
                        "description": "Oásis verde no meio da selva de pedra."
                    }
                ],
                "hiddenGems": [
                    "High Line Park — parque elevado numa ferrovia desativada com arte pública e vista da cidade",
                    "Smorgasburg Brooklyn — maior mercado de comida ao ar livre da América, sábados no verão",
                    "Staten Island Ferry — passeio de 25 min gratuito com vista frontal da Estátua da Liberdade",
                    "Roosevelt Island Tramway — teleférico urbano com vista única do East River e Manhattan"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Midtown Manhattan — central, perto de transporte, caro mas conveniente",
                    "Jersey City NJ — 15 min do MetLife de trem, 40% mais barato que Manhattan",
                    "Long Island City (Queens) — metrô direto a Manhattan, alternativa econômica"
                ]
            },
            "safety": {
                "level": "safe",
                "tips": [
                    "Metrô é seguro na maioria das linhas — fique atento nas estações à noite",
                    "Evite o Times Square para comer — só para fotos e cartão postal",
                    "911 para emergências, 311 para não-emergências locais"
                ],
                "emergencyNumbers": [
                    "911"
                ]
            }
        },
        "stadiumYearBuilt": 2010,
        "stadiumCost": "US$ 1.6 Bi",
        "historicFact": "Sede de dois times da NFL e local da final da Copa América Centenário.",
        "gdp": "Centro financeiro global (Wall Street). PIB est. $2.3 Trilhões.",
        "wcMatches": 8,
        "wcRole": "Final"
    },
    {
        "id": "usa-la",
        "name": "Los Angeles",
        "countryCode": "USA",
        "population": "12.9 milhões",
        "description": "Cinema, praias e inovação. A capital do entretenimento.",
        "highlights": [
            "Hollywood",
            "SoFi Stadium",
            "Pacific Coast"
        ],
        "stadiumName": "SoFi Stadium",
        "stadiumId": "sofi",
        "stadiumCapacity": 70240,
        "image": "https://images.unsplash.com/photo-1580655653885-65763b2597d0",
        "geoCoordinates": [
            33.9534,
            -118.3392
        ],
        "curiosities": [
            "O SoFi Stadium custou US$ 5,5 bilhões — o mais caro do mundo — e tem a primeira tela de 360° da NFL.",
            "Los Angeles sediará os Jogos Olímpicos de 2028 pela terceira vez na história.",
            "O letreiro de Hollywood foi instalado em 1923 como propaganda imobiliária e dizia 'Hollywoodland'.",
            "LA tem mais carros do que qualquer outra cidade dos EUA — tráfego é medido em horas, não minutos.",
            "O Grand Central Market do centro de LA funciona desde 1917, servindo todas as classes sociais.",
            "São Francisco tem mais estrelas Michelin per capita, mas LA tem a maior diversidade gastronômica do mundo."
        ],
        "weather": "Junho/Julho: Médias de 29°C / 17°C. Ensolarado e seco.",
        "travelGuide": {
            "heroImage": "https://images.unsplash.com/photo-1580655653885-65763b2597d0",
            "transport": {
                "airport": "LAX",
                "publicTransport": "Uber/Lyft recomendados. Metrô em expansão.",
                "taxiUber": "Uber e Lyft amplamente disponíveis em todas as sedes."
            },
            "gastronomy": {
                "title": "Culinária Local",
                "dishes": [
                    {
                        "name": "Fish Tacos",
                        "description": "Influência do sul da Califórnia.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "In-N-Out Burger",
                        "description": "Hambúrguer cult com estilo animal style.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Kogi BBQ Tacos",
                        "description": "Fusão Coreano-Mexicana famosa.",
                        "priceLevel": "medium"
                    }
                ],
                "tips": [
                    "A cena de food trucks de LA é a melhor dos EUA — Grand Park tem feiras todas as semanas",
                    "Grand Central Market funciona desde 1917 e tem opções de US$5 a US$30",
                    "Reservas com 2-3 dias de antecedência são necessárias nos restaurantes estrelados"
                ]
            },
            "tourism": {
                "topAttractions": [
                    {
                        "name": "Letreiro de Hollywood",
                        "description": "Ícone cinematográfico nas colinas."
                    },
                    {
                        "name": "Observatório Griffith",
                        "description": "Vista panorâmica do letreiro e da cidade."
                    },
                    {
                        "name": "Santa Monica Pier",
                        "description": "Parque de diversões clássico à beira-mar."
                    }
                ],
                "hiddenGems": [
                    "Griffith Observatory à noite — vista 360° da cidade e do letreiro com lua cheia",
                    "The Last Bookstore — livraria em um antigo banco do centro de LA, instalação de arte única",
                    "Malibu Creek State Park — trilhas com piscinas naturais e cachoeiras, a 45 min do SoFi",
                    "Abbot Kinney Blvd — rua mais cool dos EUA segundo a GQ, em Venice Beach"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Santa Monica — beira-mar, próximo ao SoFi de Uber, walkable",
                    "Inglewood — bairro do SoFi Stadium, conveniente e mais econômico",
                    "West Hollywood — central, animado e seguro, excelente para deslocamentos"
                ]
            },
            "safety": {
                "level": "safe",
                "tips": [
                    "Skid Row no centro de LA deve ser evitado a pé",
                    "Alugue carro — a cidade é enorme e o transporte público é limitado fora do metrô",
                    "Sunscreen é essencial — sol engana em LA, especialmente para quem vem de climas frios"
                ],
                "emergencyNumbers": [
                    "911"
                ]
            }
        },
        "stadiumYearBuilt": 2020,
        "stadiumCost": "US$ 5.5 Bi",
        "historicFact": "O estádio mais caro do mundo, com uma tela de 360 graus épica.",
        "gdp": "Hub de entretenimento e tecnologia (Silicon Beach). PIB est. $1.1 Trilhões.",
        "wcMatches": 8,
        "wcRole": "Quartas de Final"
    },
    {
        "id": "usa-dal",
        "name": "Dallas",
        "countryCode": "USA",
        "population": "8 milhões",
        "description": "Metrópole texana que receberá o maior número de jogos da Copa (9 jogos).",
        "highlights": [
            "AT&T Stadium",
            "Churrasco Texano",
            "Texas Size"
        ],
        "stadiumName": "AT&T Stadium",
        "stadiumId": "att-stadium",
        "stadiumCapacity": 80000,
        "image": "https://images.unsplash.com/photo-1544274431-7e8c3df1b80c",
        "geoCoordinates": [
            32.7473,
            -97.0945
        ],
        "curiosities": [
            "Dallas terá o maior número de jogos da Copa 2026: 9 partidas, incluindo uma semifinal.",
            "O AT&T Stadium (Jerry World) tem um dos maiores telões internos do mundo — 85m de largura.",
            "Dallas-Fort Worth é o aeroporto com mais rotas domésticas dos EUA, facilitando o acesso.",
            "A cidade foi palco do assassinato do presidente JFK em 22 de novembro de 1963, no Dealey Plaza.",
            "O State Fair of Texas em Dallas recebe mais de 2 milhões de visitantes por edição — o maior dos EUA.",
            "O AT&T Stadium tem uma galeria de arte permanente com obras de Damien Hirst — o único no mundo."
        ],
        "weather": "Junho/Julho: Médias de 35°C / 24°C. Muito quente.",
        "travelGuide": {
            "heroImage": "https://images.unsplash.com/photo-1544274431-7e8c3df1b80c",
            "transport": {
                "airport": "DFW Intl",
                "publicTransport": "Necessário alugar carro. DART leve para o centro.",
                "taxiUber": "Uber e Lyft amplamente disponíveis em todas as sedes."
            },
            "gastronomy": {
                "title": "Culinária Local",
                "dishes": [
                    {
                        "name": "Texas BBQ",
                        "description": "Peito de boi (brisket) defumado por horas.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Fajitas Tex-Mex",
                        "description": "Carne grelhada com pimentões e tortilhas.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Pecan Pie",
                        "description": "Torta de nozes típica do sul.",
                        "priceLevel": "medium"
                    }
                ],
                "tips": [
                    "Lockhart Smokehouse em Bishop Arts é referência nacional — filas são sinal de qualidade",
                    "Tex-Mex de Dallas é diferente da culinária mexicana autêntica — são gastronomias distintas",
                    "A gorjeta mínima aqui é 20% — menos que isso é considerado desrespeito"
                ]
            },
            "tourism": {
                "topAttractions": [
                    {
                        "name": "Dealey Plaza",
                        "description": "Local histórico do assassinato de JFK."
                    },
                    {
                        "name": "Reunion Tower",
                        "description": "Torre com vista 360 da cidade."
                    },
                    {
                        "name": "Dallas Arboretum",
                        "description": "66 acres de jardins botânicos."
                    }
                ],
                "hiddenGems": [
                    "Bishop Arts District — arte independente, gastronomia e cultura em Oak Cliff",
                    "Deep Ellum — bairro histórico de jazz e blues com dezenas de murais gigantes",
                    "Klyde Warren Park — parque urbano suspenso sobre uma rodovia, com food trucks diários",
                    "Dallas Museum of Art — entrada gratuita, uma das coleções permanentes mais completas do sul"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Uptown Dallas — walkable, vida noturna intensa e restaurantes de qualidade",
                    "Deep Ellum — boêmio, histórico e a 10 min do downtown de Uber",
                    "Arlington — cidade do AT&T Stadium, hotéis especializados em eventos esportivos"
                ]
            },
            "safety": {
                "level": "safe",
                "tips": [
                    "Dallas em julho chega a 40°C — hidrate-se constantemente e use protetor solar",
                    "Oak Cliff e Far East Dallas têm áreas que requerem mais cautela à noite",
                    "Carro é essencial — Dallas foi projetada para automóveis, não para pedestres"
                ],
                "emergencyNumbers": [
                    "911"
                ]
            }
        },
        "stadiumYearBuilt": 2009,
        "stadiumCost": "US$ 1.3 Bi",
        "historicFact": "Conhecido como o 'Jerry World', possui um dos maiores telões do planeta.",
        "gdp": "Hub de logística, telecomunicações e energia. PIB est. $600B.",
        "wcMatches": 9,
        "wcRole": "Semi-final"
    },
    {
        "id": "usa-atl",
        "name": "Atlanta",
        "countryCode": "USA",
        "population": "6.3 milhões",
        "description": "A joia do sul, berço da Coca-Cola e dos direitos civis.",
        "highlights": [
            "Centro da CNN",
            "Aquário Gigante",
            "Arquitetura Moderna"
        ],
        "stadiumName": "Mercedes-Benz Stadium",
        "stadiumId": "mercedes-benz",
        "stadiumCapacity": 71000,
        "image": "https://images.unsplash.com/photo-1522778119026-d647f0565c6a",
        "geoCoordinates": [
            33.7553,
            -84.4006
        ],
        "curiosities": [
            "O teto retrátil do Mercedes-Benz Stadium abre como uma íris de câmera fotográfica em apenas 8 minutos.",
            "O aeroporto Hartsfield-Jackson de Atlanta é o mais movimentado do mundo há mais de 20 anos consecutivos.",
            "Atlanta sediou os Jogos Olímpicos de 1996 — o parque olímpico Centennial é um legado visitável.",
            "Atlanta foi fundada em 1837 como terminal ferroviário e se chamava 'Terminus' por isso.",
            "A Coca-Cola foi inventada em Atlanta em 1886 por um farmacêutico chamado John Stith Pemberton.",
            "O bairro Sweet Auburn foi o berço do movimento dos direitos civis — Martin Luther King Jr. nasceu aqui."
        ],
        "weather": "Junho/Julho: Médias de 32°C / 21°C. Úmido com tempestades.",
        "travelGuide": {
            "heroImage": "https://images.unsplash.com/photo-1522778119026-d647f0565c6a",
            "transport": {
                "airport": "Hartsfield-Jackson (ATL)",
                "publicTransport": "MARTA liga aeroporto ao centro de forma simples.",
                "taxiUber": "Uber e Lyft amplamente disponíveis em todas as sedes."
            },
            "gastronomy": {
                "title": "Culinária Local",
                "dishes": [
                    {
                        "name": "Frango Frito Sulista",
                        "description": "Clássico crocante com waffles.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Peach Cobbler",
                        "description": "Sobremesa de pêssego, símbolo da Geórgia.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Pimento Cheese",
                        "description": "Sanduíche de queijo cremoso apimentado.",
                        "priceLevel": "medium"
                    }
                ],
                "tips": [
                    "O Sweet Auburn Market é o mais diverso e autêntico da cidade, com vendedores independentes",
                    "Soul food (frango frito, mac & cheese, collard greens) é uma experiência cultural obrigatória",
                    "Atlanta tem a maior concentração de restaurantes de culinária africana autêntica dos EUA"
                ]
            },
            "tourism": {
                "topAttractions": [
                    {
                        "name": "Aquário da Geórgia",
                        "description": "Um dos maiores do mundo com tubarões-baleia."
                    },
                    {
                        "name": "World of Coca-Cola",
                        "description": "Museu da bebida com degustação global."
                    },
                    {
                        "name": "Parque Martin Luther King Jr.",
                        "description": "História dos direitos civis."
                    }
                ],
                "hiddenGems": [
                    "Krog Street Tunnel — grafites em constante mutação debaixo de um viaduto, fotografia incrível",
                    "Cascade Springs Nature Preserve — floresta densa de 135 acres dentro da cidade, com cascatas",
                    "The Varsity — drive-in com funcionamento desde 1928, lanche obrigatório antes dos jogos",
                    "BeltLine Eastside Trail — trilha urbana de 33km com arte pública ao longo do trajeto"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Midtown Atlanta — museus, Piedmont Park e acesso fácil ao MARTA",
                    "Old Fourth Ward — próximo ao BeltLine, histórico e muito vibrante",
                    "Buckhead — luxo, compras de alto padrão e os melhores restaurantes da cidade"
                ]
            },
            "safety": {
                "level": "caution",
                "tips": [
                    "O centro de Atlanta (Downtown) tem áreas com alto índice de crimes — evite caminhar à noite",
                    "MARTA é seguro durante o dia — prefira apps de transporte após as 22h",
                    "Midtown e Buckhead são os bairros mais seguros e recomendados para turistas"
                ],
                "emergencyNumbers": [
                    "911"
                ]
            }
        },
        "stadiumYearBuilt": 2017,
        "stadiumCost": "US$ 1.6 Bi",
        "historicFact": "Teto retrátil inovador que abre como uma lente de câmera.",
        "gdp": "Hub global de transporte e mídia (Delta, CNN). PIB est. $450B.",
        "wcMatches": 8,
        "wcRole": "Semi-final"
    },
    {
        "id": "usa-mia",
        "name": "Miami",
        "countryCode": "USA",
        "population": "6.2 milhões",
        "description": "Porta de entrada latina, festa, sol e o efeito Messi.",
        "highlights": [
            "South Beach",
            "Wynwood Walls",
            "Influência Latina"
        ],
        "stadiumName": "Hard Rock Stadium",
        "stadiumId": "hard-rock",
        "stadiumCapacity": 64767,
        "image": "https://images.unsplash.com/photo-1506729623306-b5a934d88b53",
        "geoCoordinates": [
            25.958,
            -80.2389
        ],
        "curiosities": [
            "Miami tem a maior coleção de arquitetura Art Déco preservada do mundo — mais de 800 edifícios.",
            "É a única grande cidade dos EUA fundada por uma mulher: Julia Tuttle, em 1896.",
            "O bairro Wynwood era uma zona industrial abandonada — hoje é o maior museu de street art a céu aberto.",
            "Miami tem mais de 80 idiomas falados e é genuinamente bilíngue — inglês e espanhol são igualmente oficiais na prática.",
            "O Porto de Miami é o maior porto de cruzeiros do mundo em número de passageiros.",
            "A comunidade brasileira de Miami é uma das maiores fora do Brasil — estima-se 300 mil brasucas na região."
        ],
        "weather": "Junho/Julho: Médias de 33°C / 26°C. Tropical e úmido.",
        "travelGuide": {
            "heroImage": "https://images.unsplash.com/photo-1506729623306-b5a934d88b53",
            "transport": {
                "airport": "Miami Intl (MIA) / FLL",
                "publicTransport": "Metromover grátis no centro. Alugar carro é bom.",
                "taxiUber": "Uber e Lyft amplamente disponíveis em todas as sedes."
            },
            "gastronomy": {
                "title": "Culinária Local",
                "dishes": [
                    {
                        "name": "Cuban Sandwich",
                        "description": "Presunto, porco, queijo e picles.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Stone Crab Claws",
                        "description": "Patas de caranguejo gigantes e frescas.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Key Lime Pie",
                        "description": "Torta ácida de limão típica da Flórida.",
                        "priceLevel": "medium"
                    }
                ],
                "tips": [
                    "Little Havana (8ª rua) é o coração gastronômico — café cubano com tostada custa US$3",
                    "Evite comer na Ocean Drive — preços turísticos inflados e qualidade abaixo da média",
                    "Farmers market de Coconut Grove aos sábados tem os melhores produtos frescos da Flórida"
                ]
            },
            "tourism": {
                "topAttractions": [
                    {
                        "name": "Distrito Art Déco",
                        "description": "Arquitetura icônica e cores pastéis."
                    },
                    {
                        "name": "Vizcaya Museum",
                        "description": "Vila histórica com jardins europeus."
                    },
                    {
                        "name": "Everglades",
                        "description": "Safári aquático em pântanos tropicais."
                    }
                ],
                "hiddenGems": [
                    "Wynwood Walls — ao redor das walls principais há galerias gratuitas e restaurantes únicos",
                    "Coconut Grove — o bairro mais antigo de Miami, com atmosfera boêmia e arborizada",
                    "Bill Baggs Cape Florida — praia preservada na extremidade de Key Biscayne, quase sem turistas",
                    "Little Haiti — culinária caribenha autêntica e murais vibrantes no bairro mais original de Miami"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Brickell — moderno, próximo ao downtown, Metromover gratuito conecta tudo",
                    "South Beach — experiência máxima de Miami, preços elevados mas atmosfera imbatível",
                    "Coconut Grove — tranquilo, arborizado e ideal para famílias com crianças"
                ]
            },
            "safety": {
                "level": "safe",
                "tips": [
                    "Liberty City e Overtown têm altos índices de crime — evite completamente",
                    "O calor e a umidade de julho são extremos — hidrate-se e use protetor solar frequentemente",
                    "Cuidado com raios nas praias entre 14h e 17h — tempestades de verão são repentinas"
                ],
                "emergencyNumbers": [
                    "911"
                ]
            }
        },
        "stadiumYearBuilt": 1987,
        "stadiumCost": "US$ 550M (renovação)",
        "historicFact": "Tradicional palco de Super Bowls e agora sede da Copa 2026.",
        "gdp": "Hub de turismo internacional e finanças. PIB est. $350B.",
        "wcMatches": 7,
        "wcRole": "Terceiro Lugar"
    },
    {
        "id": "can-tor",
        "name": "Toronto",
        "countryCode": "CAN",
        "population": "6.7 milhões",
        "description": "A metrópole mais diversa do mundo e motor econômico do Canadá.",
        "highlights": [
            "CN Tower",
            "Multiculturalismo",
            "BMO Field"
        ],
        "stadiumName": "BMO Field",
        "stadiumId": "bmo-field",
        "stadiumCapacity": 45736,
        "image": "https://images.unsplash.com/photo-1502016222102-47b82eaa4a3c",
        "geoCoordinates": [
            43.6332,
            -79.4186
        ],
        "curiosities": [
            "Toronto é considerada a cidade mais diversa do mundo — mais de 200 idiomas são falados regularmente.",
            "O CN Tower (553m) foi a estrutura mais alta do mundo de 1976 até 2010, quando foi superada pelo Burj Khalifa.",
            "Toronto tem o maior sistema de corredores subterrâneos do mundo — 30km de galerias chamadas 'PATH'.",
            "O BMO Field passou por reformas para a Copa e a cidade criou um Fan Zone especial para o Mundial.",
            "O bairro Kensington Market surgiu como mercado judaico no início do século XX — hoje é totalmente multicultural.",
            "A Universidade de Toronto é constantemente ranqueada entre as 20 melhores do mundo."
        ],
        "weather": "Junho/Julho: Médias de 27°C / 17°C. Agradável e ensolarado.",
        "travelGuide": {
            "heroImage": "https://images.unsplash.com/photo-1502016222102-47b82eaa4a3c",
            "transport": {
                "airport": "Toronto Pearson (YYZ)",
                "publicTransport": "TTC (Metrô/Bondes) é excelente. UP Express do aeroporto.",
                "taxiUber": "Uber e Lyft amplamente disponíveis em todas as sedes."
            },
            "gastronomy": {
                "title": "Culinária Local",
                "dishes": [
                    {
                        "name": "Poutine",
                        "description": "Batatas fritas com queijo coalho e gravy.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Peameal Bacon",
                        "description": "Sanduíche de lombo curado com milho.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Butter Tarts",
                        "description": "Pastelaria doce e amanteigada clássica.",
                        "priceLevel": "medium"
                    }
                ],
                "tips": [
                    "Poutine (batata frita com queijo coalho e molho) é o prato canadense — Smoke's Poutinerie tem 20+ variações",
                    "O Chinatown de Toronto é um dos mais autênticos do mundo — dim sum no domingo de manhã",
                    "Preço médio de jantar em restaurante: CAD $25-50 por pessoa sem bebidas"
                ]
            },
            "tourism": {
                "topAttractions": [
                    {
                        "name": "CN Tower",
                        "description": "Estrutura icônica com piso de vidro."
                    },
                    {
                        "name": "Distillery District",
                        "description": "Vila vitoriana com arte e gastronomia."
                    },
                    {
                        "name": "Royal Ontario Museum",
                        "description": "Museu de história natural e cultura mundial."
                    }
                ],
                "hiddenGems": [
                    "Distillery District — complexo vitoriano de tijolos reconvertido em galerias, restaurantes e arte",
                    "Toronto Islands — fuga urbana com praias e trilhas a 15 min de ferry do centro",
                    "Kensington Market — bairro boêmio com vendedores de 30+ países, o mais multicultural da cidade",
                    "The Annex — bairro universitário com livrarias, cafés e a vibe intelectual de Toronto"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Downtown Core — perto de tudo, acesso direto ao metrô TTC",
                    "Distillery District — charme histórico, restaurantes boutique e a 20 min do BMO Field",
                    "Queen West — criativo, animado e o melhor custo-benefício do centro"
                ]
            },
            "safety": {
                "level": "safe",
                "tips": [
                    "Toronto é uma das cidades mais seguras do mundo — andar a pé à noite é tranquilo na maioria dos bairros",
                    "O inverno pode surpreender — junho/julho são excelentes mas leve camada para a noite",
                    "Atenção com bicicletas e patinetes nas ciclovias — o tráfego é respeitoso mas intenso"
                ],
                "emergencyNumbers": [
                    "911"
                ]
            }
        },
        "stadiumYearBuilt": 2007,
        "stadiumCost": "CAD 150M+",
        "historicFact": "Casa da seleção canadense e está sendo expandido para a Copa.",
        "gdp": "Centro financeiro do Canadá (TSX). PIB est. $400B.",
        "wcMatches": 6,
        "wcRole": "Fase de Grupos"
    },
    {
        "id": "can-van",
        "name": "Vancouver",
        "countryCode": "CAN",
        "population": "2.7 milhões",
        "description": "Onde as montanhas encontram o Oceano Pacífico. Clima moderado.",
        "highlights": [
            "Stanley Park",
            "Cenários de Cinema",
            "Natureza"
        ],
        "stadiumName": "BC Place",
        "stadiumId": "bc-place",
        "stadiumCapacity": 54500,
        "image": "https://images.unsplash.com/photo-1559511260-66a654ae982a",
        "geoCoordinates": [
            49.2768,
            -123.112
        ],
        "curiosities": [
            "Vancouver aparece constantemente nos rankings das cidades mais habitáveis e mais bonitas do mundo.",
            "Stanley Park (405 hectares) tem quase o dobro do tamanho do Central Park de Nova York.",
            "O BC Place terá capacidade ampliada para a Copa 2026 e um novo sistema de iluminação espetacular.",
            "Vancouver é a cidade mais cara do Canadá para moradia — mais cara que Toronto em custo por metro quadrado.",
            "A área de Richmond, no sul de Vancouver, tem a maior concentração de restaurantes chineses autênticos fora da Ásia.",
            "Grouse Mountain, a 15 minutos do centro, tem trilhas, esqui e uma família de ursos como atração."
        ],
        "weather": "Junho/Julho: Médias de 22°C / 13°C. Verão fresco.",
        "travelGuide": {
            "heroImage": "https://images.unsplash.com/photo-1559511260-66a654ae982a",
            "transport": {
                "airport": "Vancouver Intl (YVR)",
                "publicTransport": "SkyTrain liga aeroporto ao centro de forma automática.",
                "taxiUber": "Uber e Lyft amplamente disponíveis em todas as sedes."
            },
            "gastronomy": {
                "title": "Culinária Local",
                "dishes": [
                    {
                        "name": "Salmão do Pacífico",
                        "description": "Grelhado em tábuas de cedro.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Butter Chicken",
                        "description": "Reflexo da forte comunidade sul-asiática.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Nanaimo Bars",
                        "description": "Doce em camadas sem cozimento.",
                        "priceLevel": "medium"
                    }
                ],
                "tips": [
                    "O Public Market de Granville Island é obrigatório — chegue antes das 10h para evitar filas",
                    "Vancouver tem o melhor dim sum fora de Hong Kong — vá ao bairro Richmond no domingo",
                    "Salmão do Pacífico selvagem e halibut fresco são baratos e excepcionais nos mercados locais"
                ]
            },
            "tourism": {
                "topAttractions": [
                    {
                        "name": "Stanley Park",
                        "description": "O pulmão verde cercado pelo mar."
                    },
                    {
                        "name": "Capilano Bridge",
                        "description": "Ponte suspensa épica sobre um cânion."
                    },
                    {
                        "name": "Granville Island",
                        "description": "Mercado público com arte local."
                    }
                ],
                "hiddenGems": [
                    "Granville Island — mercado público com artistas locais, cervejarias e frutos do mar frescos",
                    "Deep Cove — vilarejo costeiro com caiaques, trilhas e tranquilidade, a 40 min de carro",
                    "East Van (Mount Pleasant) — cervejarias artesanais, murais e o melhor café da cidade",
                    "Lynn Canyon — alternativa gratuita ao Capilano Suspension Bridge, igualmente impressionante"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Yaletown — moderno, design, restaurantes sofisticados e próximo ao BC Place",
                    "Gastown — histórico, pedras paralelepípedos e o relógio a vapor famoso",
                    "Kitsilano — praias, yoga, cafés e a vibe mais autenticamente 'Vancouver'"
                ]
            },
            "safety": {
                "level": "caution",
                "tips": [
                    "O bairro Downtown Eastside tem problemas sérios de drogas — evite a área",
                    "Vancouver é muito segura para turistas fora do Downtown Eastside",
                    "Verão é tempo perfeito — leve camada leve para noites, pode refrescar rápido"
                ],
                "emergencyNumbers": [
                    "911"
                ]
            }
        },
        "stadiumYearBuilt": 1983,
        "stadiumCost": "CAD 563M (renovação)",
        "historicFact": "Sediou a final da Copa Feminina 2015 e Olimpíadas de Inverno 2010.",
        "gdp": "Hub de tecnologia, cinema e comércio marítimo. PIB est. $150B.",
        "wcMatches": 7,
        "wcRole": "Oitavas de Final"
    },
    {
        "id": "mex-mty",
        "name": "Monterrey",
        "countryCode": "MEX",
        "population": "5.3 milhões",
        "description": "O motor industrial do México cercado por montanhas surreais.",
        "highlights": [
            "Cerro de la Silla",
            "Parque Fundidora",
            "Modernidade"
        ],
        "stadiumName": "Estádio BBVA",
        "stadiumId": "bbva",
        "stadiumCapacity": 53500,
        "image": "https://images.unsplash.com/photo-1541445763567-c25965b9319b",
        "geoCoordinates": [
            25.6686,
            -100.2449
        ],
        "curiosities": [
            "Monterrey é o centro industrial e econômico do México — siderurgia, cimento e manufatura são a base.",
            "O Estadio BBVA é considerado um dos mais modernos e bonitos da América Latina, inaugurado em 2015.",
            "A Serra de Santa Catarina e o Cerro de la Silla criam um horizonte dramático e único ao redor da cidade.",
            "A temperatura em Monterrey em junho pode passar de 40°C — o mais quente dentre as sedes mexicanas.",
            "Monterrey tem o índice de educação superior mais alto do México — chamada de 'a cidade mais americanizada' do país.",
            "A cerveja Carta Blanca (1890) e a Tecate têm origem aqui — Monterrey é a capital cervejeira do México."
        ],
        "weather": "Junho/Julho: Médias de 35°C / 23°C. Quente e semiárido.",
        "travelGuide": {
            "heroImage": "https://images.unsplash.com/photo-1541445763567-c25965b9319b",
            "transport": {
                "airport": "Monterrey Intl (MTY)",
                "publicTransport": "Taxis e Uber são comuns. Metrorrey disponível.",
                "taxiUber": "Uber e Lyft amplamente disponíveis em todas as sedes."
            },
            "gastronomy": {
                "title": "Culinária Local",
                "dishes": [
                    {
                        "name": "Cabrito",
                        "description": "Cordeiro jovem assado lentamente.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Machaca",
                        "description": "Carne seca desfiada com ovos.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Gloria",
                        "description": "Doce de leite e nozes típico.",
                        "priceLevel": "medium"
                    }
                ],
                "tips": [
                    "Monterrey é a capital do cabrito assado — Restaurante El Rey del Cabrito serve desde 1959",
                    "Tacos de trompo (espeto vertical de porco) são diferentes dos do centro do país e deliciosos",
                    "A cerveja Carta Blanca e a Tecate têm origem em Monterrey — aprecie geladas"
                ]
            },
            "tourism": {
                "topAttractions": [
                    {
                        "name": "Macroplaza",
                        "description": "Uma das maiores praças urbanas do mundo."
                    },
                    {
                        "name": "Parque Chipinque",
                        "description": "Trilhas na Sierra Madre com vista da cidade."
                    },
                    {
                        "name": "Grutas de García",
                        "description": "Sistema de cavernas antigas."
                    }
                ],
                "hiddenGems": [
                    "Barrio Antiguo — centro histórico colonial com casas coloridas e vida noturna local autêntica",
                    "Chipinque Ecological Park — trilhas nas montanhas da Sierra Madre a apenas 20 min do centro",
                    "Parque Fundidora — antiga usina siderúrgica reconvertida em parque urbano com museus e eventos",
                    "Bioparque Estrella — uma das melhores experiências de safári da América Latina"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "San Pedro Garza García — o bairro mais seguro e sofisticado, com restaurantes estrelados",
                    "Barrio Antiguo — perto do centro histórico e da vida cultural da cidade",
                    "Valle Oriente — moderno, shoppings e próximo ao Estadio BBVA"
                ]
            },
            "safety": {
                "level": "caution",
                "tips": [
                    "Monterrey melhorou muito em segurança — os bairros turísticos são tranquilos",
                    "Evite deslocamentos noturnos de carro por áreas desconhecidas — use sempre apps de transporte",
                    "San Pedro Garza García é o município mais seguro e recomendado para turistas"
                ],
                "emergencyNumbers": [
                    "911"
                ]
            }
        },
        "stadiumYearBuilt": 2015,
        "stadiumCost": "US$ 200M",
        "historicFact": "Conhecido como o 'Gigante de Aço' com vista para as montanhas.",
        "gdp": "Capital industrial do México (aço, vidro). PIB est. $140B.",
        "wcMatches": 4,
        "wcRole": "Fase de Grupos"
    },
    {
        "id": "mex-gdl",
        "name": "Guadalajara",
        "countryCode": "MEX",
        "population": "5.3 milhões",
        "description": "A alma do México: Terra do Mariachi e da Tequila.",
        "highlights": [
            "Cultura Mariachi",
            "Hospício Cabañas",
            "Tlaquepaque"
        ],
        "stadiumName": "Estádio Akron",
        "stadiumId": "akron",
        "stadiumCapacity": 48071,
        "image": "https://images.unsplash.com/photo-1563294340-9a40536d5e08",
        "geoCoordinates": [
            20.682,
            -103.4624
        ],
        "curiosities": [
            "Guadalajara é a cidade natal do tequila, do mariachi e do charreada — símbolos máximos da cultura mexicana.",
            "A Arena Akron é um dos estádios mais sustentáveis da América Latina, com projeto arquitetônico premiado.",
            "O Centro Histórico de Guadalajara tem a segunda maior coleção de arte colonial barroca das Américas.",
            "A cidade é chamada de 'La Perla del Occidente' (A Pérola do Ocidente) pelos próprios mexicanos.",
            "Tlaquepaque e Tonalá, municípios ao lado de Guadalajara, produzem 40% dos artesanatos exportados pelo México.",
            "O Lago de Chapala, a 45km, é o maior lago do México e uma das colônias de expatriados mais numerosas da América Latina."
        ],
        "weather": "Junho/Julho: Médias de 31°C / 18°C. Quente com chuvas.",
        "travelGuide": {
            "heroImage": "https://images.unsplash.com/photo-1563294340-9a40536d5e08",
            "transport": {
                "airport": "Miguel Hidalgo (GDL)",
                "publicTransport": "Trens leves e táxis de ponto são as melhores opções.",
                "taxiUber": "Uber e Lyft amplamente disponíveis em todas as sedes."
            },
            "gastronomy": {
                "title": "Culinária Local",
                "dishes": [
                    {
                        "name": "Tortas Ahogadas",
                        "description": "Sanduíche 'afogado' em molho de pimenta.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Birria",
                        "description": "Ensopado rico em especiarias.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Jericalla",
                        "description": "Sobremesa tipo flan caramelizado.",
                        "priceLevel": "medium"
                    }
                ],
                "tips": [
                    "Birria (ensopado de cabra) é o prato máximo de Guadalajara — La Chata é a referência desde 1942",
                    "Mercado San Juan de Dios tem 3 andares de gastronomia e artesanato jaliscense autêntico",
                    "Tejuino — feito de milho fermentado com limão e sal — é a bebida local única que você não encontra em outro lugar"
                ]
            },
            "tourism": {
                "topAttractions": [
                    {
                        "name": "Catedral de Guadalajara",
                        "description": "Ícone arquitetônico colonial."
                    },
                    {
                        "name": "Tlaquepaque",
                        "description": "Vila de artesãos e mariachis."
                    },
                    {
                        "name": "Hospício Cabañas",
                        "description": "Murais históricos tombados pela UNESCO."
                    }
                ],
                "hiddenGems": [
                    "Tlaquepaque — vila artesanal colonial com cerâmica, vidro soprado e prata local de altíssima qualidade",
                    "Lago de Chapala — maior lago do México a 45 min, com colônias de expatriados e paisagem deslumbrante",
                    "Tonalá — capital dos artesanatos mexicanos com feiras impressionantes às quintas e domingos",
                    "Bosque Los Colomos — reserva natural urbana com trilhas e piscinas de fontes naturais"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Providencia — a zona mais cosmopolita e segura, com cafés e restaurantes internacionais",
                    "Tlaquepaque — charmosa, artesanal e ideal para turistas culturais",
                    "Zapopan — moderno, próximo à Arena Akron, bem estruturado para visitantes"
                ]
            },
            "safety": {
                "level": "caution",
                "tips": [
                    "Guadalajara é mais tranquila para turistas do que a reputação do México sugere",
                    "Evite certas zonas periféricas — Providencia e Tlaquepaque são completamente seguras",
                    "Use Uber ou InDriver — nunca pegue táxi na rua"
                ],
                "emergencyNumbers": [
                    "911"
                ]
            }
        },
        "stadiumYearBuilt": 2010,
        "stadiumCost": "US$ 200M",
        "historicFact": "Sua arquitetura parece um vulcão coroado por uma nuvem.",
        "gdp": "Hub cultural, tecnológico e agroindustrial. PIB est. $100B.",
        "wcMatches": 4,
        "wcRole": "Fase de Grupos"
    },
    {
        "id": "usa-hou",
        "name": "Houston",
        "countryCode": "USA",
        "population": "7.5 milhões",
        "description": "Espaço, energia e diversidade. A 'Space City'.",
        "highlights": [
            "NASA Space Center",
            "Culinária Étnica",
            "Energia"
        ],
        "stadiumName": "NRG Stadium",
        "stadiumId": "nrg",
        "stadiumCapacity": 72220,
        "image": "https://images.unsplash.com/photo-1522083165195-3424ed129620",
        "geoCoordinates": [
            29.6847,
            -95.4107
        ],
        "curiosities": [
            "Houston tem o maior complexo médico do mundo — o Texas Medical Center reúne mais de 60 hospitais.",
            "O Centro Espacial Johnson da NASA em Houston controla TODOS os voos tripulados americanos desde 1961.",
            "Houston é a cidade mais diversa dos EUA — mais de 145 idiomas são falados, ultrapassando Nova York.",
            "O NRG Stadium tem teto retrátil e foi o maior domo do mundo quando inaugurado em 2002.",
            "A comunidade vietnamita de Houston é a maior fora do Vietnã — com um 'Little Saigon' completo.",
            "Houston não tem código de zoneamento urbano — a única grande cidade dos EUA sem regras de uso do solo."
        ],
        "weather": "Junho/Julho: Médias de 34°C / 24°C. Muito calor e umidade.",
        "travelGuide": {
            "heroImage": "https://images.unsplash.com/photo-1522083165195-3424ed129620",
            "transport": {
                "airport": "George Bush (IAH) / Hobby",
                "publicTransport": "Carro é essencial. METRORail serve o centro.",
                "taxiUber": "Uber e Lyft amplamente disponíveis em todas as sedes."
            },
            "gastronomy": {
                "title": "Culinária Local",
                "dishes": [
                    {
                        "name": "Tex-Mex Breakfast Tacos",
                        "description": "Tortilhas com chouriço e ovo.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Crawfish Boil",
                        "description": "Lagostins cozidos com milho e batatas.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Kolaches",
                        "description": "Pastéis com salsicha de influência tcheca.",
                        "priceLevel": "medium"
                    }
                ],
                "tips": [
                    "Houston tem a culinária vietnamita mais autêntica fora do Vietnã — bairro Midtown é o epicentro",
                    "Tex-Mex de Houston tem mais influência mexicana real do que o de Dallas",
                    "Whataburger é uma instituição texana — hamburger de madrugada obrigatório"
                ]
            },
            "tourism": {
                "topAttractions": [
                    {
                        "name": "NASA Space Center",
                        "description": "Centro oficial de visitantes e controle de missão."
                    },
                    {
                        "name": "Museum District",
                        "description": "Complexo com 19 museus de arte e ciência."
                    },
                    {
                        "name": "Buffalo Bayou Park",
                        "description": "Trilhas urbanas e arte moderna."
                    }
                ],
                "hiddenGems": [
                    "The Menil Collection — museu de arte gratuito com obras de Picasso, surrealistas e arte tribal",
                    "Houston Heights — bairro histórico com casas vitorianas, antiquários e restaurantes independentes",
                    "Buffalo Bayou Park — parque urbano 6km às margens do bayou com esculturas e gruta de morcegos",
                    "Space Center Houston — o centro de controle de missões da NASA está aberto ao público"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Midtown Houston — animado, walkable e genuinamente multicultural",
                    "Montrose — o bairro mais boêmio, artístico e com a melhor cena gastronômica",
                    "Medical Center area — conveniente para o NRG, hotéis com bom custo-benefício"
                ]
            },
            "safety": {
                "level": "caution",
                "tips": [
                    "Houston em julho chega a 38°C com umidade extrema — hidrate-se constantemente",
                    "Algumas áreas do Third Ward e Northeast Houston têm índices altos de crime",
                    "Midtown e Montrose são completamente seguros para explorar a pé durante o dia"
                ],
                "emergencyNumbers": [
                    "911"
                ]
            }
        },
        "stadiumYearBuilt": 2002,
        "stadiumCost": "US$ 449M",
        "historicFact": "Primeiro estádio da NFL com teto retrátil funcional.",
        "gdp": "Capital mundial da energia (óleo e gás). PIB est. $500B.",
        "wcMatches": 7,
        "wcRole": "Oitavas de Final"
    },
    {
        "id": "usa-kc",
        "name": "Kansas City",
        "countryCode": "USA",
        "population": "2.4 milhões",
        "description": "O coração apaixonado dos EUA e capital mundial do BBQ.",
        "highlights": [
            "Kansas City BBQ",
            "Jazz",
            "Estádio Barulhento"
        ],
        "stadiumName": "Arrowhead Stadium",
        "stadiumId": "arrowhead",
        "stadiumCapacity": 76416,
        "image": "https://images.unsplash.com/photo-1541445763567-c25965b9319b",
        "geoCoordinates": [
            39.0489,
            -94.4839
        ],
        "curiosities": [
            "Kansas City tem mais fontes por habitante do que qualquer cidade do mundo, exceto Roma — são mais de 200.",
            "O Arrowhead Stadium detém o recorde Guinness de estádio mais barulhento do mundo, com 142,2 dB registrados.",
            "Kansas City está em dois estados simultaneamente — Missouri e Kansas — dividida pelo Rio Missouri.",
            "O BBQ estilo Kansas City é reconhecido como uma das quatro grandes tradições de churrasco americano.",
            "O jazz bebop foi desenvolvido aqui nos anos 1930-40, no 18th & Vine District, por Charlie Parker e outros.",
            "Kansas City tem mais ristaurantes de BBQ per capita do que qualquer cidade norte-americana."
        ],
        "weather": "Junho/Julho: Médias de 32°C / 21°C. Quente e úmido.",
        "travelGuide": {
            "heroImage": "https://images.unsplash.com/photo-1541445763567-c25965b9319b",
            "transport": {
                "airport": "MCI Intl",
                "publicTransport": "Carro recomendado. Ônibus ligam pontos-chave.",
                "taxiUber": "Uber e Lyft amplamente disponíveis em todas as sedes."
            },
            "gastronomy": {
                "title": "Culinária Local",
                "dishes": [
                    {
                        "name": "Burnt Ends",
                        "description": "Ponta de brisket defumada e crocante.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Sanduíche de Carne Moída",
                        "description": "Clássico temperado no pão.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "KC Strip Steak",
                        "description": "Corte de carne grelhado à perfeição.",
                        "priceLevel": "medium"
                    }
                ],
                "tips": [
                    "BBQ de Kansas City é considerado por muitos o melhor dos EUA — usa molho tomatado adocicado único",
                    "Joe's Kansas City Bar-B-Que foi eleito melhor BBQ do mundo por diversas publicações especializadas",
                    "Burnt ends (pontas do brisket caramelizadas) foram inventados aqui — pedido absolutamente obrigatório"
                ]
            },
            "tourism": {
                "topAttractions": [
                    {
                        "name": "Museu da 1ª Guerra Mundial",
                        "description": "Memorial e trincheiras replicadas."
                    },
                    {
                        "name": "Museu Nelson-Atkins",
                        "description": "Arte e esculturas icônicas ao ar livre."
                    },
                    {
                        "name": "Distrito de Jazz 18th & Vine",
                        "description": "Berço do jazz e museu do beisebol negro."
                    }
                ],
                "hiddenGems": [
                    "18th & Vine Historic District — berço do jazz americano Kansas City style, com museu interativo",
                    "Westport — o bairro mais antigo da cidade, com bares históricos e janelas estilo saloon",
                    "Nelson-Atkins Museum of Art — uma das melhores coleções dos EUA, entrada gratuita",
                    "Union Station — imponente estação ferroviária de 1914 reconvertida em museu de ciências"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Country Club Plaza — shopping ao ar livre com arquitetura espanhola, o mais famoso dos EUA",
                    "Crossroads Arts District — galerias, cervejarias artesanais e restaurantes criativos",
                    "Leawood KS — do lado Kansas, próximo ao Arrowhead Stadium, familiar e bem organizado"
                ]
            },
            "safety": {
                "level": "caution",
                "tips": [
                    "Kansas City tem áreas de alta criminalidade no leste da cidade — mantenha-se na área turística",
                    "Plaza e Crossroads são completamente seguras, especialmente durante o dia",
                    "Arrowhead Stadium fica em zona industrial — vá de carro ou app de transporte"
                ],
                "emergencyNumbers": [
                    "911"
                ]
            }
        },
        "stadiumYearBuilt": 1972,
        "stadiumCost": "US$ 43M (Original)",
        "historicFact": "Recorde mundial de barulho em estádio (142.2 dB).",
        "gdp": "Hub agroindustrial e de tecnologia em saúde. PIB est. $150B.",
        "wcMatches": 6,
        "wcRole": "Quartas de Final"
    },
    {
        "id": "usa-phi",
        "name": "Filadélfia",
        "countryCode": "USA",
        "population": "6.3 milhões",
        "description": "Berço da democracia americana e história da independência.",
        "highlights": [
            "Liberty Bell",
            "Rocky Steps",
            "História"
        ],
        "stadiumName": "Lincoln Financial Field",
        "stadiumId": "linc",
        "stadiumCapacity": 69176,
        "image": "https://images.unsplash.com/photo-1524143890288-726915e61df6",
        "geoCoordinates": [
            39.9008,
            -75.1675
        ],
        "curiosities": [
            "Philadelphia foi a primeira capital dos Estados Unidos — a Constituição Americana foi assinada aqui em 1787.",
            "O Lincoln Financial Field tem a maior instalação de energia solar de um estádio na NFL — totalmente autossuficiente.",
            "Os degraus do Philadelphia Museum of Art ficaram famosos globalmente após o filme Rocky (1976).",
            "Philly criou o cheesesteak, o soft pretzel e o water ice — três ícones gastronômicos americanos.",
            "O Reading Terminal Market funciona ininterruptamente desde 1893 — o mercado público mais antigo dos EUA.",
            "A Filadélfia teve o primeiro hospital americano (1751), a primeira escola de medicina e a primeira biblioteca pública."
        ],
        "weather": "Junho/Julho: Médias de 30°C / 20°C. Quente e umidade.",
        "travelGuide": {
            "heroImage": "https://images.unsplash.com/photo-1524143890288-726915e61df6",
            "transport": {
                "airport": "Philadelphia Intl (PHL)",
                "publicTransport": "SEPTA (Trens e metrô) é muito funcional.",
                "taxiUber": "Uber e Lyft amplamente disponíveis em todas as sedes."
            },
            "gastronomy": {
                "title": "Culinária Local",
                "dishes": [
                    {
                        "name": "Philly Cheesesteak",
                        "description": "Carne, queijo e cebola no pão italiano.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Soft Pretzel",
                        "description": "Lanche de rua salgado com mostarda.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Water Ice",
                        "description": "Refresco tipo raspadinha de frutas.",
                        "priceLevel": "medium"
                    }
                ],
                "tips": [
                    "Cheesesteak é levado muito a sério — Geno's vs Pat's é a rivalidade gastronômica mais famosa da América",
                    "O Italian Market da 9ª rua é o mercado ao ar livre mais antigo e autêntico dos EUA",
                    "Soft pretzels quentes são vendidos nas esquinas por US$1,50 — o melhor lanche rápido de Philly"
                ]
            },
            "tourism": {
                "topAttractions": [
                    {
                        "name": "Liberty Bell",
                        "description": "Símbolo histórico da liberdade."
                    },
                    {
                        "name": "Independence Hall",
                        "description": "Onde foi assinada a independência dos EUA."
                    },
                    {
                        "name": "Reading Terminal Market",
                        "description": "Mercado gastronômico gigante."
                    }
                ],
                "hiddenGems": [
                    "Eastern State Penitentiary — prisão histórica gótica de 1829 com tours noturno e exposições de arte",
                    "Reading Terminal Market — mercado público em operação contínua desde 1893, o mais antigo dos EUA",
                    "Mummers Museum — cultura única e bizarra de Philly, os Mummers desfilam toda virada de ano",
                    "Magic Gardens de Isaiah Zagar — mosaico insano de garrafas e azulejos cobrindo becos inteiros"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Center City — coração da cidade, tudo a pé, ótimo acesso ao transporte SEPTA",
                    "South Philly — área italiana histórica, próxima ao Lincoln Financial Field",
                    "Old City — colonial, restaurantes e bares, à sombra da Independence Hall"
                ]
            },
            "safety": {
                "level": "caution",
                "tips": [
                    "Kensington é a área de maior risco — evite completamente",
                    "Center City, Old City e South Philly são seguros para turistas durante o dia",
                    "O centro de Philly tem boa iluminação e movimento — seguro para caminhar à noite nas áreas principais"
                ],
                "emergencyNumbers": [
                    "911"
                ]
            }
        },
        "stadiumYearBuilt": 2003,
        "stadiumCost": "US$ 512M",
        "historicFact": "Energia 100% verde gerada por painéis solares locais.",
        "gdp": "Hub farmacêutico, de saúde e educação (UPenn). PIB est. $500B.",
        "wcMatches": 6,
        "wcRole": "Oitavas de Final"
    },
    {
        "id": "usa-sea",
        "name": "Seattle",
        "countryCode": "USA",
        "population": "4.1 milhões",
        "description": "Natureza exuberante, café e tecnologia. Berço do Grunge.",
        "highlights": [
            "Space Needle",
            "Amazon/Microsoft",
            "Sounders FC"
        ],
        "stadiumName": "Lumen Field",
        "stadiumId": "lumen",
        "stadiumCapacity": 69000,
        "image": "https://images.unsplash.com/photo-1542125387-c712848890cb",
        "geoCoordinates": [
            47.5952,
            -122.3316
        ],
        "curiosities": [
            "Seattle tem o apelido de 'Emerald City' pela vegetação exuberante que permanece verde o ano todo.",
            "O Lumen Field era considerado o estádio mais barulhento do mundo antes de Kansas City bater o recorde.",
            "Seattle tem o maior consumo de café per capita dos EUA — e a Starbucks foi fundada aqui em 1971.",
            "A Space Needle (184m) foi construída em 13 meses para a Expo 62 e sobreviveu a dois terremotos significativos.",
            "Seattle é a sede de Amazon, Boeing e Microsoft — o Silicon Valley do noroeste americano.",
            "O Pike Place Market funciona desde 1907 e tem um ritual famoso: os peixeiros jogam salmões de um lado para o outro."
        ],
        "weather": "Junho/Julho: Médias de 23°C / 13°C. Verão ameno com chuvas leves.",
        "travelGuide": {
            "heroImage": "https://images.unsplash.com/photo-1542125387-c712848890cb",
            "transport": {
                "airport": "Sea-Tac (SEA)",
                "publicTransport": "Link Light Rail excelente do aeroporto ao centro.",
                "taxiUber": "Uber e Lyft amplamente disponíveis em todas as sedes."
            },
            "gastronomy": {
                "title": "Culinária Local",
                "dishes": [
                    {
                        "name": "Salmon Chowder",
                        "description": "Ensopado de salmão fresco do Pacífico.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Caranguejo Dungeness",
                        "description": "Especialidade marinha local.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Seattle-style Teriyaki",
                        "description": "Prato de fusão asiática local.",
                        "priceLevel": "medium"
                    }
                ],
                "tips": [
                    "Salmão selvagem do Alasca e Dungeness crab são mais baratos e melhores em Seattle do que em qualquer outro lugar",
                    "Starbucks original no Pike Place Market vale a fila — mas explore as centenas de torrefações locais independentes",
                    "Salumi Artisan Cured Meats — fila de uma hora para o melhor sanduíche de salame do mundo"
                ]
            },
            "tourism": {
                "topAttractions": [
                    {
                        "name": "Space Needle",
                        "description": "Torre futurista com vista 360°."
                    },
                    {
                        "name": "Pike Place Market",
                        "description": "Mercado de peixes e flores histórico."
                    },
                    {
                        "name": "Chihuly Garden",
                        "description": "Exposição de esculturas em vidro únicas."
                    }
                ],
                "hiddenGems": [
                    "Pike Place Market — muito além dos peixes voadores: 200+ vendedores artesanais e a primeira Starbucks",
                    "Capitol Hill — bairro LGBTQ+ com a melhor cena de música ao vivo de Seattle",
                    "Chihuly Garden and Glass — instalação monumental de vidro soprado ao lado da Space Needle, hipnótico",
                    "Fremont Troll — escultura gigante debaixo da ponte Aurora, símbolo do bairro mais excêntrico de Seattle"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "South Lake Union — moderno, próximo à Amazon HQ, restaurantes de alto nível",
                    "Capitol Hill — diverso, animado e com acesso fácil de Link Light Rail",
                    "Belltown — central, próximo ao Pike Place e à cena noturna"
                ]
            },
            "safety": {
                "level": "caution",
                "tips": [
                    "O bairro SODO tem esvaziamento noturno — o Lumen Field fica aqui, use app de transporte",
                    "Pike Place e Capitol Hill são muito seguros — ótimos para explorar a pé",
                    "Verão em Seattle é magnífico — raramente passa dos 27°C, sem umidade excessiva"
                ],
                "emergencyNumbers": [
                    "911"
                ]
            }
        },
        "stadiumYearBuilt": 2002,
        "stadiumCost": "US$ 430M",
        "historicFact": "Atmosfera única com uma das torcidas mais barulhentas da MLS.",
        "gdp": "Hub de inovação tecnológica e aeroespacial. PIB est. $500B.",
        "wcMatches": 6,
        "wcRole": "Oitavas de Final"
    },
    {
        "id": "usa-sf",
        "name": "San Francisco Bay Area",
        "countryCode": "USA",
        "population": "7.8 milhões",
        "description": "O coração da inovação e do Vale do Silício.",
        "highlights": [
            "Golden Gate",
            "Silicon Valley",
            "Tecnologia"
        ],
        "stadiumName": "Levi's Stadium",
        "stadiumId": "levis",
        "stadiumCapacity": 68500,
        "image": "https://images.unsplash.com/photo-1501594907352-04cda38ebc29",
        "geoCoordinates": [
            37.4033,
            -121.9694
        ],
        "curiosities": [
            "O Levi's Stadium é alimentado 100% por energia renovável — o primeiro estádio neutro em carbono da NFL.",
            "O Vale do Silício fica no sul da Baía — São Francisco em si é sede de Salesforce, Twitter e muitas startups.",
            "As correntes frias do Pacífico mantêm São Francisco a apenas 14°C de temperatura média em julho — mais frio que Boston.",
            "O Golden Gate Bridge usa 129km de cabos de aço e levou 4 anos para ser construído (1933-1937).",
            "A bactéria Lactobacillus sanfranciscensis, encontrada apenas aqui, dá ao sourdough local um sabor único no mundo.",
            "Alcatraz, a 2,5km da costa, foi a prisão de segurança máxima mais famosa do mundo até 1963."
        ],
        "weather": "Junho/Julho: Médias de 22°C / 13°C. Verão fresco e nublado.",
        "travelGuide": {
            "heroImage": "https://images.unsplash.com/photo-1501594907352-04cda38ebc29",
            "transport": {
                "airport": "SFO / SJC / OAK",
                "publicTransport": "Caltrain e BART ligam as cidades da baía.",
                "taxiUber": "Uber e Lyft amplamente disponíveis em todas as sedes."
            },
            "gastronomy": {
                "title": "Culinária Local",
                "dishes": [
                    {
                        "name": "Cioppino",
                        "description": "Ensopado de frutos do mar clássico de SF.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Sourdough Bread",
                        "description": "Pão de fermentação natural famoso.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Clam Chowder no Pão",
                        "description": "Servido dentro do sourdough.",
                        "priceLevel": "medium"
                    }
                ],
                "tips": [
                    "O burrito Mission-style (com arroz dentro) foi inventado aqui — La Taqueria é a referência desde 1973",
                    "O sourdough de SF tem sabor único impossível de replicar fora da região por causa da bactéria local Lactobacillus sanfranciscensis",
                    "Ferry Building Farmers Market às terças e sábados tem os melhores ingredientes orgânicos da Califórnia"
                ]
            },
            "tourism": {
                "topAttractions": [
                    {
                        "name": "Ponte Golden Gate",
                        "description": "Símbolo icônico dos Estados Unidos."
                    },
                    {
                        "name": "Ilha de Alcatraz",
                        "description": "Antiga prisão de segurança máxima."
                    },
                    {
                        "name": "Fisherman's Wharf",
                        "description": "Leões-marinhos e gastronomia costeira."
                    }
                ],
                "hiddenGems": [
                    "Ferry Building Marketplace — mercado gourmet na orla com o melhor café, queijo e frutos do mar da baía",
                    "Muir Woods — redwoods milenares (até 800 anos) a 45 min, chegue antes das 9h para evitar lotação",
                    "Tartine Bakery na Mission District — considerada por muitos a melhor padaria do continente americano",
                    "Lands End Trail — trilha costeira de 5km entre ruínas e vista do Golden Gate, praticamente desconhecida"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Mission District — a mais animada, diversa e gastronômica de todas as opções",
                    "SoMa (South of Market) — próxima ao Levi's de ônibus ou BART, hotéis de custo médio",
                    "Palo Alto — Silicon Valley, próximo ao estádio, hotéis boutique de alto padrão"
                ]
            },
            "safety": {
                "level": "caution",
                "tips": [
                    "Tenderloin e partes do SOMA têm problemas sérios de segurança — evite à noite",
                    "Mission, Castro e Haight-Ashbury são seguros e vibrantes para explorar",
                    "O frio surpreende — SF em julho tem média de 14°C, sempre leve uma jaqueta"
                ],
                "emergencyNumbers": [
                    "911"
                ]
            }
        },
        "stadiumYearBuilt": 2014,
        "stadiumCost": "US$ 1.3 Bi",
        "historicFact": "Um dos estádios mais sustentáveis com certificação LEED Gold.",
        "gdp": "Capital mundial da tecnologia e inovação. PIB est. $600B+",
        "wcMatches": 6,
        "wcRole": "Fase de Grupos"
    },
    {
        "id": "usa-bos",
        "name": "Boston",
        "countryCode": "USA",
        "population": "4.9 milhões",
        "description": "História colonial, elite acadêmica e o charme da Nova Inglaterra.",
        "highlights": [
            "Freedom Trail",
            "Harvard",
            "Clam Chowder"
        ],
        "stadiumName": "Gillette Stadium",
        "stadiumId": "gillette",
        "stadiumCapacity": 65878,
        "image": "https://images.unsplash.com/photo-1490237014491-8aa29811ea56",
        "geoCoordinates": [
            42.0909,
            -71.2643
        ],
        "curiosities": [
            "Boston tem as universidades mais importantes do planeta: Harvard (1636) e MIT estão aqui, a 10 min do centro.",
            "O Gillette Stadium foi palco dos New England Patriots de Tom Brady em 6 títulos de Super Bowl.",
            "A Maratona de Boston (1897) é a mais antiga do mundo e a mais difícil de se qualificar — exige tempo mínimo.",
            "O Boston Tea Party de 1773 — protesto contra impostos britânicos — deflagrou a Revolução Americana.",
            "O sistema de metrô de Boston (The T) é o mais antigo dos EUA, inaugurado em 1897.",
            "Boston tem a maior concentração de estudantes universitários do mundo — 250 mil em 35 universidades."
        ],
        "weather": "Junho/Julho: Médias de 28°C / 18°C. Verão ameno e agradável.",
        "travelGuide": {
            "heroImage": "https://images.unsplash.com/photo-1490237014491-8aa29811ea56",
            "transport": {
                "airport": "Logan Intl (BOS)",
                "publicTransport": "Metrô 'T' é histórico e as distâncias são curtas.",
                "taxiUber": "Uber e Lyft amplamente disponíveis em todas as sedes."
            },
            "gastronomy": {
                "title": "Culinária Local",
                "dishes": [
                    {
                        "name": "Clam Chowder",
                        "description": "Versão cremosa da Nova Inglaterra.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Lobster Roll",
                        "description": "Sanduíche de lagosta manteigada no pão tostado.",
                        "priceLevel": "medium"
                    },
                    {
                        "name": "Boston Cream Pie",
                        "description": "Bolo com creme e cobertura de chocolate.",
                        "priceLevel": "medium"
                    }
                ],
                "tips": [
                    "New England Clam Chowder cremoso é obrigatório — Neptune Oyster ou Legal Sea Foods são as referências",
                    "Lobster Roll frio com maionese é o sanduíche mais icônico — Mike's Pastry no North End para cannolis de sobremesa",
                    "Harpoon Brewery é a mais antiga de Boston — tours e degustação às sextas e sábados"
                ]
            },
            "tourism": {
                "topAttractions": [
                    {
                        "name": "Freedom Trail",
                        "description": "Caminhada por 16 locais históricos da Revolução."
                    },
                    {
                        "name": "Fenway Park",
                        "description": "Estádio mais antigo da MLB (Beisebol)."
                    },
                    {
                        "name": "Universidade Harvard",
                        "description": "Tour pelo campus da universidade mais prestigiada."
                    }
                ],
                "hiddenGems": [
                    "Arnold Arboretum — jardim botânico gratuito de 107 hectares em Jamaica Plain, visitado por apenas locais",
                    "Isabella Stewart Gardner Museum — villa italiana com Rembrandt, Vermeer e um jardim central deslumbrante",
                    "Roslindale Village — bairro local com farmers market e cafés independentes, sem turistas",
                    "Charles River Esplanade — caminhada às margens do rio com vista de Cambridge e do MIT"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Back Bay — central, elegante e com as melhores conexões ao metrô Green Line",
                    "Foxborough — cidade do Gillette Stadium, hotéis especializados em eventos do estádio, mais econômico",
                    "Cambridge — universitário, intelectual e com restaurantes étnicos de primeira linha"
                ]
            },
            "safety": {
                "level": "safe",
                "tips": [
                    "Boston é uma das cidades mais seguras dos EUA para turistas",
                    "Roxbury tem áreas com índice de crime mais alto — mantenha-se nos bairros turísticos",
                    "O inverno de Boston é extremo — em junho/julho o clima é perfeito, entre 20°C e 27°C"
                ],
                "emergencyNumbers": [
                    "911"
                ]
            }
        },
        "stadiumYearBuilt": 2002,
        "stadiumCost": "US$ 325M",
        "historicFact": "Coração do New England Patriots durante sua era de ouro.",
        "gdp": "Hub global de biotecnologia e educação. PIB est. $500B.",
        "wcMatches": 7,
        "wcRole": "Quartas de Final"
    }
];

export const hostCountries: HostCountry[] = [
    {
        code: "MEX",
        name: "México",
        flag: "🇲🇽",
        description: "O México se tornará o primeiro país a sediar a Copa do Mundo três vezes.",
        capital: "Cidade do México",
        population: "~128 milhões",
        currency: "Peso Mexicano (MXN)",
        footballHistory: "Anfitrião em 1970 e 1986. Berço de Pelé e Maradona campeões.",
        travelTips: ["Prove os tacos legítimos.", "Cuidado com a altitude na Cidade do México."],
        cities: rawCities.filter(c => c.countryCode === 'MEX'),
        gdp: "US$ 1.3 Trilhões",
        wcParticipations: 17
    },
    {
        code: "USA",
        name: "Estados Unidos",
        flag: "🇺🇸",
        description: "Os EUA voltam a sediar a Copa após 1994, agora com 11 cidades.",
        capital: "Washington, D.C.",
        population: "~334 milhões",
        currency: "Dólar Americano (USD)",
        footballHistory: "O esporte cresceu muito desde 94. MLS é hoje uma grande liga.",
        travelTips: ["Alugue um carro para distâncias longas.", "O seguro viagem é altamente recomendado."],
        cities: rawCities.filter(c => c.countryCode === 'USA'),
        gdp: "US$ 23 Trilhões",
        wcParticipations: 11
    },
    {
        code: "CAN",
        name: "Canadá",
        flag: "🇨🇦",
        description: "Primeira vez que o Canadá sedia o mundial masculino.",
        capital: "Ottawa",
        population: "~39 milhões",
        currency: "Dólar Canadense (CAD)",
        footballHistory: "Geração de ouro com Alphonso Davies levando país à Copa.",
        travelTips: ["Prepare-se para o clima variável no litoral.", "O transporte público em Toronto é exemplar."],
        cities: rawCities.filter(c => c.countryCode === 'CAN'),
        gdp: "US$ 2 Trilhões",
        wcParticipations: 2
    }
];

export const generalCuriosities = [
    { title: "Copa Gigante", description: "A primeira com 48 seleções e 104 jogos.", icon: "Globe" },
    { title: "Três Anfitriões", description: "EUA, México e Canadá dividem a sede pela primeira vez.", icon: "Map" },
    { title: "Sustentabilidade", description: "Vários estádios utilizam energia 100% renovável.", icon: "Leaf" }
];
