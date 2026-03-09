
// ARENA CUP - SEDES DATA (MASTER)
// Este arquivo é gerado automaticamente. Não edite manualmente.

export interface HostCity {
    id: string;
    name: string;
    country: string;
    countryCode: 'USA' | 'MEX' | 'CAN';
    population: string;
    description: string;
    highlights: string[];
    stadium: {
        name: string;
        id: string;
        capacity: number;
        yearBuilt: number;
        cost: string;
        historicFact: string;
        image: string;
    };
    travel: {
        airport: string;
        transport: string;
        dishes: { name: string; description: string }[];
        attractions: { name: string; description: string }[];
    };
    trivia: string[];
    economics: string;
    coordinates: [number, number];
}

export const hostCities: HostCity[] = [
    {
        "id": "mex-cdmx",
        "name": "Cidade do México",
        "country": "México",
        "countryCode": "MEX",
        "population": "22 milhões",
        "description": "A metrópole que pulsa futebol. Única cidade a receber três aberturas de Copa.",
        "highlights": [
            "Estádio Azteca",
            "História Asteca",
            "Gastronomia"
        ],
        "stadium": {
            "name": "Estádio Azteca",
            "id": "azteca",
            "capacity": 83000,
            "yearBuilt": 1966,
            "cost": "US$ 260M (ajustado)",
            "historicFact": "Palco dos gols de Pelé em 70 e da 'Mão de Deus' de Maradona em 86.",
            "image": "https://images.unsplash.com/photo-1512813195386-6cf811ad3542"
        },
        "travel": {
            "airport": "Benito Juárez (MEX)",
            "transport": "Metrô e Metrobús eficientes e econômicos.",
            "dishes": [
                {
                    "name": "Tacos al Pastor",
                    "description": "Carne de porco marinada com abacaxi."
                },
                {
                    "name": "Mole Poblano",
                    "description": "Molho complexo de pimenta e chocolate."
                }
            ],
            "attractions": [
                {
                    "name": "Zócalo",
                    "description": "O coração histórico da cidade."
                },
                {
                    "name": "Teotihuacán",
                    "description": "Pirâmides antigas a 1h da cidade."
                }
            ]
        },
        "trivia": [
            "A cidade afunda cerca de 10cm por ano.",
            "Possui a maior quantidade de museus das Américas."
        ],
        "economics": "Principal hub financeiro e cultural da América Latina.",
        "coordinates": [
            19.3029,
            -99.1505
        ]
    },
    {
        "id": "usa-ny",
        "name": "Nova York / Nova Jersey",
        "country": "EUA",
        "countryCode": "USA",
        "population": "20 milhões",
        "description": "A capital do mundo e sede da Grande Final em 19 de julho de 2026.",
        "highlights": [
            "Sede da Final",
            "Empire State",
            "Multiculturalismo"
        ],
        "stadium": {
            "name": "MetLife Stadium",
            "id": "metlife",
            "capacity": 82500,
            "yearBuilt": 2010,
            "cost": "US$ 1.6 Bi",
            "historicFact": "Sede de dois times da NFL e local da final da Copa América Centenário.",
            "image": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48"
        },
        "travel": {
            "airport": "Newark (EWR) / JFK / LaGuardia",
            "transport": "Rede de metrô 24h em NY e trens NJ Transit.",
            "dishes": [
                {
                    "name": "NY Pizza",
                    "description": "Fatia fina e crocante clássica."
                },
                {
                    "name": "Cheesecake",
                    "description": "A sobremesa mais icônica da cidade."
                }
            ],
            "attractions": [
                {
                    "name": "Times Square",
                    "description": "O cruzamento mais brilhante do mundo."
                },
                {
                    "name": "Central Park",
                    "description": "Oásis verde no meio da selva de pedra."
                }
            ]
        },
        "trivia": [
            "Mais de 800 línguas são faladas na Grande NY.",
            "A estátua da liberdade foi presente da França."
        ],
        "economics": "Centro financeiro global (Wall Street).",
        "coordinates": [
            40.8128,
            -74.0742
        ]
    },
    {
        "id": "usa-la",
        "name": "Los Angeles",
        "country": "EUA",
        "countryCode": "USA",
        "population": "13 milhões",
        "description": "Cinema, praias e inovação. A capital do entretenimento.",
        "highlights": [
            "Hollywood",
            "SoFi Stadium",
            "Pacific Coast"
        ],
        "stadium": {
            "name": "SoFi Stadium",
            "id": "sofi",
            "capacity": 70240,
            "yearBuilt": 2020,
            "cost": "US$ 5.5 Bi",
            "historicFact": "O estádio mais caro do mundo, com uma tela de 360 graus épica.",
            "image": "https://images.unsplash.com/photo-1580655653885-65763b2597d0"
        },
        "travel": {
            "airport": "LAX",
            "transport": "Uber/Lyft recomendados. Metrô em expansão.",
            "dishes": [
                {
                    "name": "Fish Tacos",
                    "description": "Influência do sul da Califórnia."
                },
                {
                    "name": "In-N-Out Burger",
                    "description": "Cadeia de hambúrguer cult da região."
                }
            ],
            "attractions": [
                {
                    "name": "Santa Monica Pier",
                    "description": "Roda gigante clássica à beira mar."
                },
                {
                    "name": "Griffith Observatory",
                    "description": "Vista panorâmica do letreiro de Hollywood."
                }
            ]
        },
        "trivia": [
            "O letreiro de Hollywood dizia originalmente 'Hollywoodland'.",
            "LA sediará as Olimpíadas em 2028."
        ],
        "economics": "Indústria aeroespacial, moda e, claro, entretenimento.",
        "coordinates": [
            33.9534,
            -118.3392
        ]
    },
    {
        "id": "usa-dal",
        "name": "Dallas",
        "country": "EUA",
        "countryCode": "USA",
        "population": "7.6 milhões",
        "description": "Metrópole texana que receberá o maior número de jogos da Copa (9 jogos).",
        "highlights": [
            "AT&T Stadium",
            "Churrasco Texano",
            "Texas Size"
        ],
        "stadium": {
            "name": "AT&T Stadium",
            "id": "att-stadium",
            "capacity": 80000,
            "yearBuilt": 2009,
            "cost": "US$ 1.3 Bi",
            "historicFact": "Conhecido como o 'Jerry World', possui um dos maiores telões do planeta.",
            "image": "https://images.unsplash.com/photo-1544274431-7e8c3df1b80c"
        },
        "travel": {
            "airport": "DFW Intl",
            "transport": "Necessário alugar carro. DART leve para o centro.",
            "dishes": [
                {
                    "name": "Texas BBQ",
                    "description": "Peito de boi (brisket) defumado por horas."
                },
                {
                    "name": "Pecan Pie",
                    "description": "Torta de nozes típica do sul."
                }
            ],
            "attractions": [
                {
                    "name": "Dealey Plaza",
                    "description": "Local histórico de John F. Kennedy."
                },
                {
                    "name": "Reunion Tower",
                    "description": "Torre com vista 360 da cidade."
                }
            ]
        },
        "trivia": [
            "Muitos jogos serão sediados em estádio de teto fechado devido ao calor.",
            "O Texas foi um país independente por 9 anos."
        ],
        "economics": "Energia, telecomunicações e pecuária.",
        "coordinates": [
            32.7473,
            -97.0945
        ]
    },
    {
        "id": "usa-atl",
        "name": "Atlanta",
        "country": "EUA",
        "countryCode": "USA",
        "population": "6.1 milhões",
        "description": "A joia do sul, berço da Coca-Cola e dos direitos civis.",
        "highlights": [
            "Centro da CNN",
            "Aquário Gigante",
            "Arquitetura Moderna"
        ],
        "stadium": {
            "name": "Mercedes-Benz Stadium",
            "id": "mercedes-benz",
            "capacity": 71000,
            "yearBuilt": 2017,
            "cost": "US$ 1.6 Bi",
            "historicFact": "Teto retrátil inovador que abre como uma lente de câmera.",
            "image": "https://images.unsplash.com/photo-1522778119026-d647f0565c6a"
        },
        "travel": {
            "airport": "Hartsfield-Jackson (ATL)",
            "transport": "MARTA liga aeroporto ao centro de forma simples.",
            "dishes": [
                {
                    "name": "Fried Chicken",
                    "description": "O melhor do sul dos Estados Unidos."
                },
                {
                    "name": "Peach Cobbler",
                    "description": "Sobremesa de pêssego, símbolo da Geórgia."
                }
            ],
            "attractions": [
                {
                    "name": "World of Coca-Cola",
                    "description": "Museu da bebida mais famosa do mundo."
                },
                {
                    "name": "Georgia Aquarium",
                    "description": "Um dos maiores aquários de água salgada."
                }
            ]
        },
        "trivia": [
            "O aeroporto de Atlanta é o mais movimentado do mundo.",
            "Cidade natal de Martin Luther King Jr."
        ],
        "economics": "Logística, mídia e distribuição global.",
        "coordinates": [
            33.7553,
            -84.4006
        ]
    },
    {
        "id": "usa-mia",
        "name": "Miami",
        "country": "EUA",
        "countryCode": "USA",
        "population": "6.2 milhões",
        "description": "Porta de entrada latina, festa, sol e o efeito Messi.",
        "highlights": [
            "South Beach",
            "Wynwood Walls",
            "Influência Latina"
        ],
        "stadium": {
            "name": "Hard Rock Stadium",
            "id": "hard-rock",
            "capacity": 65000,
            "yearBuilt": 1987,
            "cost": "US$ 550M (renovação)",
            "historicFact": "Tradicional palco de Super Bowls e agora sede da Copa 2026.",
            "image": "https://images.unsplash.com/photo-1506729623306-b5a934d88b53"
        },
        "travel": {
            "airport": "Miami Intl (MIA) / FLL",
            "transport": "Metromover grátis no centro. Alugar carro é bom.",
            "dishes": [
                {
                    "name": "Cuban Sandwich",
                    "description": "Presunto, porco assado, queijo e picles."
                },
                {
                    "name": "Stone Crab Claws",
                    "description": "Especialidade marinha sazonal."
                }
            ],
            "attractions": [
                {
                    "name": "Art Deco District",
                    "description": "Arquitetura colorida e histórica."
                },
                {
                    "name": "Little Havana",
                    "description": "Cultura cubana vibrante e café forte."
                }
            ]
        },
        "trivia": [
            "Miami tem a maior concentração de bancos internacionais nos EUA.",
            "Foi fundada por uma mulher, Julia Tuttle."
        ],
        "economics": "Turismo, finanças e cruzeiros (Capital mundial dos cruzeiros).",
        "coordinates": [
            25.958,
            -80.2389
        ]
    },
    {
        "id": "can-tor",
        "name": "Toronto",
        "country": "Canadá",
        "countryCode": "CAN",
        "population": "6.3 milhões",
        "description": "A metrópole mais diversa do mundo e motor econômico do Canadá.",
        "highlights": [
            "CN Tower",
            "Multiculturalismo",
            "BMO Field"
        ],
        "stadium": {
            "name": "BMO Field",
            "id": "bmo-field",
            "capacity": 45000,
            "yearBuilt": 2007,
            "cost": "CAD 150M",
            "historicFact": "Casa da seleção canadense e em constante expansão.",
            "image": "https://images.unsplash.com/photo-1502016222102-47b82eaa4a3c"
        },
        "travel": {
            "airport": "Toronto Pearson (YYZ)",
            "transport": "TTC (Metrô/Bondes) é excelente. UP Express do aeroporto.",
            "dishes": [
                {
                    "name": "Peameal Bacon Sandwich",
                    "description": "Bacon de lombo curado com milho."
                },
                {
                    "name": "Diverse Cuisines",
                    "description": "Comida de quase todos os países do mundo."
                }
            ],
            "attractions": [
                {
                    "name": "CN Tower",
                    "description": "Uma das estruturas mais altas do planeta."
                },
                {
                    "name": "Distillery District",
                    "description": "Vila charmosa exclusiva para pedestres."
                }
            ]
        },
        "trivia": [
            "Toronto tem a maior rede de túneis subterrâneos do mundo (PATH).",
            "Mais de 50% dos residentes nasceram fora do Canadá."
        ],
        "economics": "Serviços financeiros, tecnologia e mineração.",
        "coordinates": [
            43.6332,
            -79.4186
        ]
    },
    {
        "id": "can-van",
        "name": "Vancouver",
        "country": "Canadá",
        "countryCode": "CAN",
        "population": "2.6 milhões",
        "description": "Onde as montanhas encontram o Oceano Pacífico.",
        "highlights": [
            "Stanley Park",
            "Cenários de Cinema",
            "Natureza"
        ],
        "stadium": {
            "name": "BC Place",
            "id": "bc-place",
            "capacity": 54500,
            "yearBuilt": 1983,
            "cost": "CAD 563M (renovação)",
            "historicFact": "Sediou a final da Copa Feminina 2015 e abertura das Olimpíadas de Inverno 2010.",
            "image": "https://images.unsplash.com/photo-1559511260-66a654ae982a"
        },
        "travel": {
            "airport": "Vancouver Intl (YVR)",
            "transport": "SkyTrain liga aeroporto ao centro de forma automatizada.",
            "dishes": [
                {
                    "name": "Pacific Salmon",
                    "description": "O salmão mais fresco que você pode provar."
                },
                {
                    "name": "JapaDog",
                    "description": "Hot dog com toppings japoneses criado aqui."
                }
            ],
            "attractions": [
                {
                    "name": "Stanley Park",
                    "description": "O pulmão verde cercado por água."
                },
                {
                    "name": "Capilano Suspension Bridge",
                    "description": "Ponte suspensa épica na floresta."
                }
            ]
        },
        "trivia": [
            "É conhecida como 'Hollywood North' devido à indústria cinematográfica.",
            "Vancouver raramente tem neve pesada no centro, apesar das montanhas próximas."
        ],
        "economics": "Comércio marítimo, cinema e tecnologia sustentável.",
        "coordinates": [
            49.2768,
            -123.112
        ]
    },
    {
        "id": "mex-mty",
        "name": "Monterrey",
        "country": "México",
        "countryCode": "MEX",
        "population": "5.3 milhões",
        "description": "O motor industrial do México cercado por montanhas surreais.",
        "highlights": [
            "Cerro de la Silla",
            "Parque Fundidora",
            "Modernidade"
        ],
        "stadium": {
            "name": "Estádio BBVA",
            "id": "bbva",
            "capacity": 53500,
            "yearBuilt": 2015,
            "cost": "US$ 200M",
            "historicFact": "Conhecido como o 'Gigante de Aço' e eleito um dos mais bonitos do mundo.",
            "image": "https://images.unsplash.com/photo-1541445763567-c25965b9319b"
        },
        "travel": {
            "airport": "Monterrey Intl (MTY)",
            "transport": "Uso de táxis e Uber é comum. Metrorrey disponível.",
            "dishes": [
                {
                    "name": "Cabrito",
                    "description": "Carro chefe da culinária regia."
                },
                {
                    "name": "Arrachera",
                    "description": "Corte de carne grelhado muito suculento."
                }
            ],
            "attractions": [
                {
                    "name": "Macroplaza",
                    "description": "Uma das maiores praças do mundo."
                },
                {
                    "name": "Paseo Santa Lucía",
                    "description": "Canal navegável artificial ligando parques."
                }
            ]
        },
        "trivia": [
            "É a cidade com o maior PIB per capita do México.",
            "O Cerro de la Silla é um monumento natural protegido."
        ],
        "economics": "Siderurgia, manufatura e tecnologia.",
        "coordinates": [
            25.6686,
            -100.2449
        ]
    },
    {
        "id": "mex-gdl",
        "name": "Guadalajara",
        "country": "México",
        "countryCode": "MEX",
        "population": "5 milhões",
        "description": "A alma do México: Terra do Mariachi e da Tequila.",
        "highlights": [
            "Cultura Mariachi",
            "Hospício Cabañas",
            "Tlaquepaque"
        ],
        "stadium": {
            "name": "Estádio Akron",
            "id": "akron",
            "capacity": 49850,
            "yearBuilt": 2010,
            "cost": "US$ 200M",
            "historicFact": "Sua arquitetura parece um vulcão coroado por uma nuvem.",
            "image": "https://images.unsplash.com/photo-1563294340-9a40536d5e08"
        },
        "travel": {
            "airport": "Miguel Hidalgo (GDL)",
            "transport": "Trens leves cruzam a cidade. Táxis de ponto recomendados.",
            "dishes": [
                {
                    "name": "Tortas Ahogadas",
                    "description": "Sanduíche 'afogado' em molho de pimenta."
                },
                {
                    "name": "Birria",
                    "description": "Ensopado de carne rico em especiarias."
                }
            ],
            "attractions": [
                {
                    "name": "Catedral de Guadalajara",
                    "description": "Ícone arquitetônico no centro."
                },
                {
                    "name": "Tlaquepaque",
                    "description": "Bairro artístico famoso por cerâmicas."
                }
            ]
        },
        "trivia": [
            "É chamada de 'Silicon Valley' do México devido às empresas de tech.",
            "O mariachi nasceu aqui."
        ],
        "economics": "Logística, tecnologia, têxtil e tequila.",
        "coordinates": [
            20.682,
            -103.4624
        ]
    },
    {
        "id": "usa-hou",
        "name": "Houston",
        "country": "EUA",
        "countryCode": "USA",
        "population": "7.1 milhões",
        "description": "Espaço, energia e diversidade. A 'Space City'.",
        "highlights": [
            "NASA Space Center",
            "Culinária Étnica",
            "Energia"
        ],
        "stadium": {
            "name": "NRG Stadium",
            "id": "nrg",
            "capacity": 72220,
            "yearBuilt": 2002,
            "cost": "US$ 449M",
            "historicFact": "Primeiro estádio da NFL com teto retrátil real.",
            "image": "https://images.unsplash.com/photo-1522083165195-3424ed129620"
        },
        "travel": {
            "airport": "George Bush (IAH) / Hobby",
            "transport": "Carro é quase mandatório. METRORail no centro.",
            "dishes": [
                {
                    "name": "Tex-Mex",
                    "description": "Fusão perfeita de Texas e México."
                },
                {
                    "name": "Viet-Cajun Crawfish",
                    "description": "Exemplo único da diversidade da cidade."
                }
            ],
            "attractions": [
                {
                    "name": "Space Center Houston",
                    "description": "Centro oficial de visitantes da NASA."
                },
                {
                    "name": "Museum District",
                    "description": "Concentração épica de museus de arte e ciência."
                }
            ]
        },
        "trivia": [
            "Houston é a cidade com a maior diversidade étnica dos EUA.",
            "Possui o maior centro médico do mundo."
        ],
        "economics": "Capital mundial da energia (óleo e gás).",
        "coordinates": [
            29.6847,
            -95.4107
        ]
    },
    {
        "id": "usa-kc",
        "name": "Kansas City",
        "country": "EUA",
        "countryCode": "USA",
        "population": "2.2 milhões",
        "description": "O coração apaixonado dos EUA e capital mundial do BBQ.",
        "highlights": [
            "Kansas City BBQ",
            "Jazz",
            "Estádio mais barulhento"
        ],
        "stadium": {
            "name": "Arrowhead Stadium",
            "id": "arrowhead",
            "capacity": 76416,
            "yearBuilt": 1972,
            "cost": "US$ 43M (Original)",
            "historicFact": "Detém o recorde mundial do Guinness pelo barulho mais alto em um estádio.",
            "image": "https://images.unsplash.com/photo-1541445763567-c25965b9319b"
        },
        "travel": {
            "airport": "MCI Intl",
            "transport": "Necessário carro. Ônibus local serve as rotas principais.",
            "dishes": [
                {
                    "name": "KC Style BBQ",
                    "description": "Carne defumada com molho rico e adocicado."
                },
                {
                    "name": "Burnt Ends",
                    "description": "O 'ouro' do churrasco de Kansas City."
                }
            ],
            "attractions": [
                {
                    "name": "Nelson-Atkins Museum",
                    "description": "Famoso pelas esculturas de petecas no jardim."
                },
                {
                    "name": "Country Club Plaza",
                    "description": "Shopping outdoor icônico."
                }
            ]
        },
        "trivia": [
            "Conhecida como a 'Cidade das Fontes' (tem mais fontes que Roma).",
            "É uma cidade que se divide entre os estados de Kansas e Missouri."
        ],
        "economics": "Agronegócio, logística e tecnologia em saúde.",
        "coordinates": [
            39.0489,
            -94.4839
        ]
    },
    {
        "id": "usa-phi",
        "name": "Filadélfia",
        "country": "EUA",
        "countryCode": "USA",
        "population": "6.2 milhões",
        "description": "Berço da democracia americana e sede do Sétimo Artigo.",
        "highlights": [
            "Liberty Bell",
            "Rocky Steps",
            "História"
        ],
        "stadium": {
            "name": "Lincoln Financial Field",
            "id": "linc",
            "capacity": 69176,
            "yearBuilt": 2003,
            "cost": "US$ 512M",
            "historicFact": "Conhecido como o 'Linc', é alimentado 100% por energia verde.",
            "image": "https://images.unsplash.com/photo-1524143890288-726915e61df6"
        },
        "travel": {
            "airport": "Philadelphia Intl (PHL)",
            "transport": "SEPTA (Trens e metrô) é muito funcional para turistas.",
            "dishes": [
                {
                    "name": "Philly Cheesesteak",
                    "description": "Carne picada com queijo e cebola no pão italiano."
                },
                {
                    "name": "Soft Pretzel",
                    "description": "Lanche de rua essencial da cidade."
                }
            ],
            "attractions": [
                {
                    "name": "Independence Hall",
                    "description": "Onde a declaração de independência foi assinada."
                },
                {
                    "name": "Museum of Art",
                    "description": "Famoso pelas escadas do filme Rocky."
                }
            ]
        },
        "trivia": [
            "Foi a primeira capital dos Estados Unidos.",
            "Possui a maior quantidade de murais ao ar livre do país."
        ],
        "economics": "Educação, saúde e manufatura hi-tech.",
        "coordinates": [
            39.9008,
            -75.1675
        ]
    },
    {
        "id": "usa-sea",
        "name": "Seattle",
        "country": "EUA",
        "countryCode": "USA",
        "population": "4 milhões",
        "description": "Natureza exuberante, café e tecnologia na costa noroeste.",
        "highlights": [
            "Space Needle",
            "Amazon/Microsoft",
            "Sounders FC"
        ],
        "stadium": {
            "name": "Lumen Field",
            "id": "lumen",
            "capacity": 69000,
            "yearBuilt": 2002,
            "cost": "US$ 430M",
            "historicFact": "Vibração de futebol europeu no coração dos EUA com torcida ensandecida.",
            "image": "https://images.unsplash.com/photo-1542125387-c712848890cb"
        },
        "travel": {
            "airport": "Sea-Tac (SEA)",
            "transport": "Link Light Rail excelente entre aeroporto e estádio/centro.",
            "dishes": [
                {
                    "name": "Dungeness Crab",
                    "description": "Caranguejo fresco do pacífico."
                },
                {
                    "name": "Starbucks Coffee",
                    "description": "Visite a loja nº 1 no Pike Place Market."
                }
            ],
            "attractions": [
                {
                    "name": "Space Needle",
                    "description": "O ícone futurista com vista incrível."
                },
                {
                    "name": "Pike Place Market",
                    "description": "Mercado histórico de peixes e flores."
                }
            ]
        },
        "trivia": [
            "Cidade onde nasceu o Grunge (Nirvana, Pearl Jam).",
            "Foi a primeira grande cidade americana a legalizar o ridesharing."
        ],
        "economics": "Cloud computing, aeroespacial e exportação marítima.",
        "coordinates": [
            47.5952,
            -122.3316
        ]
    },
    {
        "id": "usa-sf",
        "name": "São Francisco / Santa Clara",
        "country": "EUA",
        "countryCode": "USA",
        "population": "4.7 milhões",
        "description": "No coração do Vale do Silício, onde o futuro é criado.",
        "highlights": [
            "Golden Gate",
            "Silicon Valley",
            "Píer 39"
        ],
        "stadium": {
            "name": "Levi's Stadium",
            "id": "levis",
            "capacity": 68500,
            "yearBuilt": 2014,
            "cost": "US$ 1.3 Bi",
            "historicFact": "Um dos estádios mais tecnológicos e eco-friendly do mundo.",
            "image": "https://images.unsplash.com/photo-1501594907352-04cda38ebc29"
        },
        "travel": {
            "airport": "SFO / SJC / OAK",
            "transport": "BART e Caltrain ligam a Baía. Caro optar por Uber solo.",
            "dishes": [
                {
                    "name": "Sourdough Bread",
                    "description": "Pão de fermentação natural clássico."
                },
                {
                    "name": "Clam Chowder",
                    "description": "Ensopado de mariscos servido no pão."
                }
            ],
            "attractions": [
                {
                    "name": "Golden Gate Bridge",
                    "description": "A ponte mais fotografada do mundo."
                },
                {
                    "name": "Alcatraz",
                    "description": "A famosa prisão desativada no meio da baía."
                }
            ]
        },
        "trivia": [
            "A Golden Gate é pintada de 'International Orange' constante.",
            "A cidade foi construída sobre colinas e navios enterrados."
        ],
        "economics": "Epicentro global de inovação e capital de risco.",
        "coordinates": [
            37.4032,
            -121.9698
        ]
    },
    {
        "id": "usa-bos",
        "name": "Boston / Foxborough",
        "country": "EUA",
        "countryCode": "USA",
        "population": "4.9 milhões",
        "description": "Tradição acadêmica, esportiva e a alma da Nova Inglaterra.",
        "highlights": [
            "Harvard/MIT",
            "Freedom Trail",
            "Fanáticos Esportivos"
        ],
        "stadium": {
            "name": "Gillette Stadium",
            "id": "gillette",
            "capacity": 65878,
            "yearBuilt": 2002,
            "cost": "US$ 325M",
            "historicFact": "Palco das glórias de Tom Brady e agora hub da Copa 2026.",
            "image": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f"
        },
        "travel": {
            "airport": "Logan Intl (BOS)",
            "transport": "O 'T' (metrô) é o mais antigo dos EUA e muito prático.",
            "dishes": [
                {
                    "name": "Lobster Roll",
                    "description": "Sanduíche de lagosta fresco e amanteigado."
                },
                {
                    "name": "New England Clam Chowder",
                    "description": "Ensopado cremoso de mariscos."
                }
            ],
            "attractions": [
                {
                    "name": "Freedom Trail",
                    "description": "Caminhada por 16 sites históricos revolucionários."
                },
                {
                    "name": "Fenway Park",
                    "description": "O estádio de baseball mais antigo dos EUA."
                }
            ]
        },
        "trivia": [
            "Boston abriu a primeira escola pública dos EUA em 1635.",
            "O metrô de Boston foi o primeiro do país (1897)."
        ],
        "economics": "Biotecnologia, educação de elite e finanças.",
        "coordinates": [
            42.0909,
            -71.2643
        ]
    }
];
