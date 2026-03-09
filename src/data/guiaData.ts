
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
            "O Estádio Azteca será o primeiro a sediar três jogos de abertura.",
            "A cidade afunda cerca de 10-30cm por ano.",
            "Possui a maior quantidade de museus das Américas."
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
                    "Não deixe de provar os pratos locais em mercados tradicionais.",
                    "A gorjeta sugerida nos EUA é de 18-20%."
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
                    "Passeios alternativos pela manhã",
                    "Vista privilegiada do pôr do sol local"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Centro da Cidade",
                    "Áreas próximas ao estádio"
                ]
            },
            "safety": {
                "level": "safe",
                "tips": [
                    "Mantenha atenção dobrada em locais de grande aglomeração.",
                    "Siga as orientações das autoridades locais nos estádios."
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
            "O MetLife Stadium será rebatizado para a final devido às regras da FIFA.",
            "Mais de 800 línguas são faladas na Grande NY.",
            "NY tem mais arranha-céus que qualquer outra cidade global."
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
                    "Não deixe de provar os pratos locais em mercados tradicionais.",
                    "A gorjeta sugerida nos EUA é de 18-20%."
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
                    "Passeios alternativos pela manhã",
                    "Vista privilegiada do pôr do sol local"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Centro da Cidade",
                    "Áreas próximas ao estádio"
                ]
            },
            "safety": {
                "level": "safe",
                "tips": [
                    "Mantenha atenção dobrada em locais de grande aglomeração.",
                    "Siga as orientações das autoridades locais nos estádios."
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
            "O teto do SoFi Stadium é translúcido para entrada de luz natural.",
            "LA sediará as Olimpíadas em 2028 pela terceira vez.",
            "O letreiro de Hollywood dizia originalmente 'Hollywoodland'."
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
                    "Não deixe de provar os pratos locais em mercados tradicionais.",
                    "A gorjeta sugerida nos EUA é de 18-20%."
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
                    "Passeios alternativos pela manhã",
                    "Vista privilegiada do pôr do sol local"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Centro da Cidade",
                    "Áreas próximas ao estádio"
                ]
            },
            "safety": {
                "level": "safe",
                "tips": [
                    "Mantenha atenção dobrada em locais de grande aglomeração.",
                    "Siga as orientações das autoridades locais nos estádios."
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
            "O telão do estádio é tão grande que teve que ser considerado no design.",
            "Dallas terá o maior hub de transporte para torcedores.",
            "Muitos jogos serão em teto fechado devido ao calor texano."
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
                    "Não deixe de provar os pratos locais em mercados tradicionais.",
                    "A gorjeta sugerida nos EUA é de 18-20%."
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
                    "Passeios alternativos pela manhã",
                    "Vista privilegiada do pôr do sol local"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Centro da Cidade",
                    "Áreas próximas ao estádio"
                ]
            },
            "safety": {
                "level": "safe",
                "tips": [
                    "Mantenha atenção dobrada em locais de grande aglomeração.",
                    "Siga as orientações das autoridades locais nos estádios."
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
            "O teto retrátil abre em apenas 8 minutos.",
            "O aeroporto de Atlanta é o mais movimentado do mundo.",
            "Sede dos Jogos Olímpicos de 1996."
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
                    "Não deixe de provar os pratos locais em mercados tradicionais.",
                    "A gorjeta sugerida nos EUA é de 18-20%."
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
                    "Passeios alternativos pela manhã",
                    "Vista privilegiada do pôr do sol local"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Centro da Cidade",
                    "Áreas próximas ao estádio"
                ]
            },
            "safety": {
                "level": "safe",
                "tips": [
                    "Mantenha atenção dobrada em locais de grande aglomeração.",
                    "Siga as orientações das autoridades locais nos estádios."
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
            "Miami tem a maior coleção mundial de arquitetura Art Déco.",
            "É a única grande cidade dos EUA fundada por uma mulher.",
            "Conhecida como a capital mundial dos cruzeiros."
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
                    "Não deixe de provar os pratos locais em mercados tradicionais.",
                    "A gorjeta sugerida nos EUA é de 18-20%."
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
                    "Passeios alternativos pela manhã",
                    "Vista privilegiada do pôr do sol local"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Centro da Cidade",
                    "Áreas próximas ao estádio"
                ]
            },
            "safety": {
                "level": "safe",
                "tips": [
                    "Mantenha atenção dobrada em locais de grande aglomeração.",
                    "Siga as orientações das autoridades locais nos estádios."
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
            "Mais de 180 línguas e dialetos são falados em Toronto.",
            "A rede PATH é a maior galeria subterrânea do mundo.",
            "Mais de 50% dos residentes nasceram fora do Canadá."
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
                    "Não deixe de provar os pratos locais em mercados tradicionais.",
                    "A gorjeta sugerida nos EUA é de 18-20%."
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
                    "Passeios alternativos pela manhã",
                    "Vista privilegiada do pôr do sol local"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Centro da Cidade",
                    "Áreas próximas ao estádio"
                ]
            },
            "safety": {
                "level": "safe",
                "tips": [
                    "Mantenha atenção dobrada em locais de grande aglomeração.",
                    "Siga as orientações das autoridades locais nos estádios."
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
            "O Stanley Park é maior que o Central Park de NY.",
            "Conhecida como 'Hollywood North' pela indústria de cinema.",
            "Raramente neva pesado no centro da cidade."
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
                    "Não deixe de provar os pratos locais em mercados tradicionais.",
                    "A gorjeta sugerida nos EUA é de 18-20%."
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
                    "Passeios alternativos pela manhã",
                    "Vista privilegiada do pôr do sol local"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Centro da Cidade",
                    "Áreas próximas ao estádio"
                ]
            },
            "safety": {
                "level": "safe",
                "tips": [
                    "Mantenha atenção dobrada em locais de grande aglomeração.",
                    "Siga as orientações das autoridades locais nos estádios."
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
            "O estádio BBVA é considerado um dos mais belos do mundo.",
            "Monterrey tem o maior PIB per capita do México.",
            "O Cerro de la Silla é um monumento natural icônico."
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
                    "Não deixe de provar os pratos locais em mercados tradicionais.",
                    "A gorjeta sugerida nos EUA é de 18-20%."
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
                    "Passeios alternativos pela manhã",
                    "Vista privilegiada do pôr do sol local"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Centro da Cidade",
                    "Áreas próximas ao estádio"
                ]
            },
            "safety": {
                "level": "safe",
                "tips": [
                    "Mantenha atenção dobrada em locais de grande aglomeração.",
                    "Siga as orientações das autoridades locais nos estádios."
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
            "O mariachi e a tequila nasceram nesta região.",
            "O estádio é movido a energia solar.",
            "Sediou jogos das Copas de 1970 e 1986."
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
                    "Não deixe de provar os pratos locais em mercados tradicionais.",
                    "A gorjeta sugerida nos EUA é de 18-20%."
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
                    "Passeios alternativos pela manhã",
                    "Vista privilegiada do pôr do sol local"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Centro da Cidade",
                    "Áreas próximas ao estádio"
                ]
            },
            "safety": {
                "level": "safe",
                "tips": [
                    "Mantenha atenção dobrada em locais de grande aglomeração.",
                    "Siga as orientações das autoridades locais nos estádios."
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
            "Houston é a cidade com maior diversidade étnica dos EUA.",
            "Centro das famosas missões Apollo da NASA.",
            "Possui o maior centro médico do mundo."
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
                    "Não deixe de provar os pratos locais em mercados tradicionais.",
                    "A gorjeta sugerida nos EUA é de 18-20%."
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
                    "Passeios alternativos pela manhã",
                    "Vista privilegiada do pôr do sol local"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Centro da Cidade",
                    "Áreas próximas ao estádio"
                ]
            },
            "safety": {
                "level": "safe",
                "tips": [
                    "Mantenha atenção dobrada em locais de grande aglomeração.",
                    "Siga as orientações das autoridades locais nos estádios."
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
            "Conhecida como 'Cidade das Fontes' (mais que Roma).",
            "A cidade se estende por dois estados (MO e KS).",
            "Invenção dos 'Burnt Ends' aconteceu aqui."
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
                    "Não deixe de provar os pratos locais em mercados tradicionais.",
                    "A gorjeta sugerida nos EUA é de 18-20%."
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
                    "Passeios alternativos pela manhã",
                    "Vista privilegiada do pôr do sol local"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Centro da Cidade",
                    "Áreas próximas ao estádio"
                ]
            },
            "safety": {
                "level": "safe",
                "tips": [
                    "Mantenha atenção dobrada em locais de grande aglomeração.",
                    "Siga as orientações das autoridades locais nos estádios."
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
            "Primeira capital oficial dos Estados Unidos.",
            "A escadaria do filme Rocky é um ponto viral de fotos.",
            "Possui a maior quantidade de murais urbanos do país."
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
                    "Não deixe de provar os pratos locais em mercados tradicionais.",
                    "A gorjeta sugerida nos EUA é de 18-20%."
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
                    "Passeios alternativos pela manhã",
                    "Vista privilegiada do pôr do sol local"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Centro da Cidade",
                    "Áreas próximas ao estádio"
                ]
            },
            "safety": {
                "level": "safe",
                "tips": [
                    "Mantenha atenção dobrada em locais de grande aglomeração.",
                    "Siga as orientações das autoridades locais nos estádios."
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
            "Primeira loja da Starbucks abriu aqui em 1971.",
            "Sede da Amazon e da Microsoft.",
            "O grunge (Nirvana, Pearl Jam) nasceu nos clubes de Seattle."
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
                    "Não deixe de provar os pratos locais em mercados tradicionais.",
                    "A gorjeta sugerida nos EUA é de 18-20%."
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
                    "Passeios alternativos pela manhã",
                    "Vista privilegiada do pôr do sol local"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Centro da Cidade",
                    "Áreas próximas ao estádio"
                ]
            },
            "safety": {
                "level": "safe",
                "tips": [
                    "Mantenha atenção dobrada em locais de grande aglomeração.",
                    "Siga as orientações das autoridades locais nos estádios."
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
            "Levi's Stadium é totalmente movido por painéis solares.",
            "O Vale do Silício é a sede global da Apple e Google.",
            "A neblina matinal é tão comum que tem nome: Karl."
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
                    "Não deixe de provar os pratos locais em mercados tradicionais.",
                    "A gorjeta sugerida nos EUA é de 18-20%."
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
                    "Passeios alternativos pela manhã",
                    "Vista privilegiada do pôr do sol local"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Centro da Cidade",
                    "Áreas próximas ao estádio"
                ]
            },
            "safety": {
                "level": "safe",
                "tips": [
                    "Mantenha atenção dobrada em locais de grande aglomeração.",
                    "Siga as orientações das autoridades locais nos estádios."
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
            "A revolta do chá em Boston desencadeou a Revolução Americana.",
            "Possui o primeiro metrô construído nos EUA.",
            "Harvard é a universidade mais antiga do país (1636)."
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
                    "Não deixe de provar os pratos locais em mercados tradicionais.",
                    "A gorjeta sugerida nos EUA é de 18-20%."
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
                    "Passeios alternativos pela manhã",
                    "Vista privilegiada do pôr do sol local"
                ]
            },
            "accommodation": {
                "avgHotelPrice": "US$ 180 - 450 / noite",
                "avgAirbnbPrice": "US$ 120 - 250 / noite",
                "bestAreas": [
                    "Centro da Cidade",
                    "Áreas próximas ao estádio"
                ]
            },
            "safety": {
                "level": "safe",
                "tips": [
                    "Mantenha atenção dobrada em locais de grande aglomeração.",
                    "Siga as orientações das autoridades locais nos estádios."
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
