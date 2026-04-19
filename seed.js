const SD=[
  {id:'d01',date:'21 jun',fecha:'2026-06-21',label:'Buenos Aires → Amsterdam',city:'transito',order:1,events:[
    {tipo:'vuelo',hora:'14:40',fecha:'2026-06-21',titulo:'KLM · EZE → AMS',pago:'si',extras:{aerolinea:'KLM',numero:'KL702',origen:'EZE — Ministro Pistarini, Buenos Aires',destino:'AMS — Amsterdam Schiphol',salida:'14:40',llegada:'08:45',duracion:'13h 05m',terminal:'',escala:'Sin escala — vuelo directo',pnr:'BWCTB7',clase:'Economy',equipaje:'23Kg Maleta + 10Kg Carry-On',notas:'Emitir tickets antes del 22/04/2026'}},
    {tipo:'traslado',hora:'08:45',fecha:'2026-06-22',titulo:'Traslado Schiphol → hotel',pago:'na',extras:{origen:'AMS — Schiphol Terminal 3',destino:'Hotel Amsterdam',mapsO:'',mapsD:'',medio:'Taxi / Uber',llegada:'',duracion:'30 min',precio:'€40 aprox.',conf:'',notas:'Recoger equipaje primero · Terminal 3'}}
  ]},
  {id:'d02',date:'22 jun',fecha:'2026-06-22',label:'Amsterdam — llegada y primer paseo',city:'amsterdam',order:2,events:[
    {tipo:'hotel',hora:'09:00',fecha:'2026-06-22',titulo:'Check-in hotel Amsterdam',pago:'no',extras:{nombre:'',ciudad:'Amsterdam',dir:'Amsterdam Centro',maps:'',cinFecha:'2026-06-22',cinHora:'09:00',coutFecha:'2026-06-24',coutHora:'11:00',conf:'',tel:'',notas:'Early check-in a confirmar · Solicitar habitaciones contiguas'}},
    {tipo:'actividad',hora:'11:00',fecha:'2026-06-22',titulo:'Recorrido en bicicleta — canales',pago:'na',extras:{lugar:'Centro histórico, Amsterdam',maps:'',horafin:'14:00',precio:'€15/persona',conf:'',proveedor:'',link:'',notas:'Alquilar en el hotel o en MacBike'}},
    {tipo:'restaurante',hora:'19:00',fecha:'2026-06-22',titulo:'Cena barrio Jordaan',pago:'no',extras:{nombre:'',dir:'Barrio Jordaan, Amsterdam',maps:'',cocina:'',precio:'',conf:'',reserva:'Pendiente de reserva',link:'',notas:''}}
  ]},
  {id:'d03',date:'23 jun',fecha:'2026-06-23',label:'Amsterdam — museos y cultura',city:'amsterdam',order:3,events:[
    {tipo:'actividad',hora:'09:30',fecha:'2026-06-23',titulo:'Rijksmuseum',pago:'no',extras:{lugar:'Museumstraat 1, Amsterdam',maps:'https://maps.google.com/?q=Rijksmuseum+Amsterdam',horafin:'12:30',precio:'€22.50/persona',conf:'',proveedor:'',link:'https://www.rijksmuseum.nl',notas:'Reservar entradas online con anticipación'}},
    {tipo:'actividad',hora:'14:00',fecha:'2026-06-23',titulo:'Vondelpark — tarde libre',pago:'na',extras:{lugar:'Vondelpark, Amsterdam',maps:'',horafin:'16:00',precio:'Gratis',conf:'',proveedor:'',link:'',notas:''}},
    {tipo:'restaurante',hora:'20:00',fecha:'2026-06-23',titulo:'Cena barrio De Pijp',pago:'no',extras:{nombre:'',dir:'Barrio De Pijp, Amsterdam',maps:'',cocina:'',precio:'',conf:'',reserva:'Pendiente de reserva',link:'',notas:'Cerca del Mercado Albert Cuyp'}}
  ]},
  {id:'d04',date:'24 jun',fecha:'2026-06-24',label:'Amsterdam → Atenas',city:'transito',order:4,events:[
    {tipo:'traslado',hora:'06:00',fecha:'2026-06-24',titulo:'Traslado aeropuerto Schiphol',pago:'na',extras:{origen:'Hotel Amsterdam',destino:'AMS — Schiphol',mapsO:'',mapsD:'',medio:'Tren',llegada:'06:30',duracion:'20 min',precio:'€5',conf:'',notas:'Tren desde Amsterdam Centraal · Salir temprano'}},
    {tipo:'vuelo',hora:'08:45',fecha:'2026-06-24',titulo:'Vuelo AMS → ATH',pago:'no',extras:{aerolinea:'',numero:'',origen:'AMS — Amsterdam Schiphol',destino:'ATH — El. Venizelos, Atenas',salida:'08:45',llegada:'13:30',duracion:'3h 45m',terminal:'',escala:'Sin escala',pnr:'',clase:'Economy',equipaje:'',notas:'Vuelo pendiente de reservar'}},
    {tipo:'traslado',hora:'13:30',fecha:'2026-06-24',titulo:'Metro aeropuerto → hotel',pago:'na',extras:{origen:'ATH — El. Venizelos',destino:'Hotel Atenas',mapsO:'',mapsD:'',medio:'Metro',llegada:'14:15',duracion:'40 min',precio:'€10',conf:'',notas:'Línea 3 — Azul hasta Syntagma'}},
    {tipo:'hotel',hora:'15:00',fecha:'2026-06-24',titulo:'Check-in Atenas',pago:'no',extras:{nombre:'',ciudad:'Atenas',dir:'Zona Monastiraki / Syntagma',maps:'',cinFecha:'2026-06-24',cinHora:'15:00',coutFecha:'2026-06-27',coutHora:'11:00',conf:'',tel:'',notas:''}}
  ]},
  {id:'d05',date:'25–26 jun',fecha:'2026-06-25',label:'Atenas — Acrópolis, Plaka y museos',city:'grecia',order:5,events:[
    {tipo:'actividad',hora:'08:00',fecha:'2026-06-25',titulo:'Acrópolis de Atenas',pago:'no',extras:{lugar:'Acrópolis, Atenas',maps:'https://maps.google.com/?q=Acropolis+Athens',horafin:'11:00',precio:'€20/persona',conf:'',proveedor:'',link:'https://etickets.tap.gr',notas:'Entradas comprar online · Llevar agua y sombrero · Ir temprano'}},
    {tipo:'restaurante',hora:'12:00',fecha:'2026-06-25',titulo:'Almuerzo en Plaka',pago:'na',extras:{nombre:'',dir:'Barrio Plaka, Atenas',maps:'',cocina:'Griega tradicional',precio:'€20/persona',conf:'',reserva:'Sin reserva — entrar directo',link:'',notas:''}},
    {tipo:'actividad',hora:'16:00',fecha:'2026-06-25',titulo:'Museo Arqueológico Nacional',pago:'no',extras:{lugar:'28is Oktovriou 44, Atenas',maps:'',horafin:'18:00',precio:'€12/persona',conf:'',proveedor:'',link:'',notas:'Colección de oro micénico'}},
    {tipo:'actividad',hora:'10:00',fecha:'2026-06-26',titulo:'Barrio Monastiraki y mercado de pulgas',pago:'na',extras:{lugar:'Monastiraki, Atenas',maps:'',horafin:'13:00',precio:'Gratis',conf:'',proveedor:'',link:'',notas:'Sábado es el mejor día para el mercado'}}
  ]},
  {id:'d06',date:'27 jun',fecha:'2026-06-27',label:'Atenas → Mykonos',city:'grecia',order:6,events:[
    {tipo:'traslado',hora:'08:00',fecha:'2026-06-27',titulo:'Ferry o vuelo Atenas → Mykonos',pago:'no',extras:{origen:'Atenas (Pireo o Rafina)',destino:'Mykonos',mapsO:'',mapsD:'',medio:'Ferry',llegada:'10:00',duracion:'2-5h según opción',precio:'€30–80/persona',conf:'',notas:'Ferry rápido desde Rafina (2h) o lento desde Pireo (5h) · Reservar con anticipación'}},
    {tipo:'hotel',hora:'14:00',fecha:'2026-06-27',titulo:'Check-in Mykonos',pago:'no',extras:{nombre:'',ciudad:'Mykonos',dir:'Mykonos Town o Platis Gialos',maps:'',cinFecha:'2026-06-27',cinHora:'14:00',coutFecha:'2026-06-29',coutHora:'11:00',conf:'',tel:'',notas:'Temporada alta — reservar ya'}}
  ]},
  {id:'d07',date:'28 jun',fecha:'2026-06-28',label:'Mykonos — playas y pueblo',city:'grecia',order:7,events:[
    {tipo:'actividad',hora:'10:00',fecha:'2026-06-28',titulo:'Playas de Mykonos',pago:'na',extras:{lugar:'Paradise Beach o Super Paradise',maps:'',horafin:'16:00',precio:'Gratis + tumbonas',conf:'',proveedor:'',link:'',notas:'Super Paradise es más tranquila · Llegar temprano en verano'}},
    {tipo:'actividad',hora:'18:00',fecha:'2026-06-28',titulo:'Atardecer en Little Venice',pago:'na',extras:{lugar:'Little Venice, Mykonos Town',maps:'',horafin:'20:00',precio:'Gratis',conf:'',proveedor:'',link:'',notas:'El atardecer más famoso de Mykonos · Llegar 30 min antes'}},
    {tipo:'restaurante',hora:'21:00',fecha:'2026-06-28',titulo:'Cena en Mykonos Town',pago:'no',extras:{nombre:'',dir:'Mykonos Town',maps:'',cocina:'Griega, mariscos',precio:'€40/persona',conf:'',reserva:'Pendiente de reserva',link:'',notas:''}}
  ]},
  {id:'d08',date:'29 jun',fecha:'2026-06-29',label:'Mykonos → Naxos',city:'grecia',order:8,events:[
    {tipo:'traslado',hora:'09:00',fecha:'2026-06-29',titulo:'Ferry Mykonos → Naxos',pago:'no',extras:{origen:'Puerto de Mykonos',destino:'Puerto de Naxos',mapsO:'',mapsD:'',medio:'Ferry',llegada:'10:00',duracion:'45 min',precio:'€20/persona',conf:'',notas:'Varias salidas al día · SeaJets o Blue Star'}},
    {tipo:'hotel',hora:'12:00',fecha:'2026-06-29',titulo:'Check-in Naxos',pago:'no',extras:{nombre:'',ciudad:'Naxos',dir:'Naxos Town (Chora)',maps:'',cinFecha:'2026-06-29',cinHora:'12:00',coutFecha:'2026-07-02',coutHora:'11:00',conf:'',tel:'',notas:'3 noches · La isla más grande de las Cícladas'}}
  ]},
  {id:'d09',date:'30 jun–1 jul',fecha:'2026-06-30',label:'Naxos — playas y aldeas',city:'grecia',order:9,events:[
    {tipo:'actividad',hora:'09:00',fecha:'2026-06-30',titulo:'Playa Agios Prokopios',pago:'na',extras:{lugar:'Agios Prokopios, Naxos',maps:'',horafin:'13:00',precio:'Gratis',conf:'',proveedor:'',link:'',notas:'Una de las mejores playas de Grecia · Arena blanca y agua turquesa'}},
    {tipo:'actividad',hora:'15:00',fecha:'2026-06-30',titulo:'Aldeas de montaña — Halki y Apiranthos',pago:'na',extras:{lugar:'Interior de Naxos',maps:'',horafin:'19:00',precio:'Gratis',conf:'',proveedor:'',link:'',notas:'Alquilar auto o ATV · Apiranthos es de mármol blanco'}},
    {tipo:'actividad',hora:'09:00',fecha:'2026-07-01',titulo:'Portara — Templo de Apolo',pago:'na',extras:{lugar:'Naxos Town',maps:'',horafin:'11:00',precio:'Gratis',conf:'',proveedor:'',link:'',notas:'Vista increíble del atardecer desde aquí'}}
  ]},
  {id:'d10',date:'2 jul',fecha:'2026-07-02',label:'Naxos → Koufonisia',city:'grecia',order:10,events:[
    {tipo:'traslado',hora:'09:00',fecha:'2026-07-02',titulo:'Ferry Naxos → Koufonisia',pago:'no',extras:{origen:'Puerto de Naxos',destino:'Koufonisia (Ano Koufonisi)',mapsO:'',mapsD:'',medio:'Ferry',llegada:'10:00',duracion:'1h',precio:'€15/persona',conf:'',notas:'SeaJets · Isla pequeñísima y muy auténtica'}},
    {tipo:'hotel',hora:'12:00',fecha:'2026-07-02',titulo:'Check-in Koufonisia',pago:'no',extras:{nombre:'',ciudad:'Koufonisia',dir:'Koufonisia',maps:'',cinFecha:'2026-07-02',cinHora:'12:00',coutFecha:'2026-07-03',coutHora:'10:00',conf:'',tel:'',notas:'1 noche · Reservar cuanto antes — poca oferta hotelera'}}
  ]},
  {id:'d11',date:'2–3 jul',fecha:'2026-07-02',label:'Koufonisia — la joya secreta',city:'grecia',order:11,events:[
    {tipo:'actividad',hora:'10:00',fecha:'2026-07-02',titulo:'Playas de Koufonisia',pago:'na',extras:{lugar:'Pori Beach, Koufonisia',maps:'',horafin:'17:00',precio:'Gratis',conf:'',proveedor:'',link:'',notas:'Pori es la más linda · 30 min caminando o en bote'}},
    {tipo:'actividad',hora:'17:00',fecha:'2026-07-02',titulo:'Paseo en bote por las calas',pago:'no',extras:{lugar:'Koufonisia',maps:'',horafin:'20:00',precio:'€20/persona',conf:'',proveedor:'',link:'',notas:'Tour en bote a las calas y aguas cristalinas'}}
  ]},
  {id:'d12',date:'3 jul',fecha:'2026-07-03',label:'Koufonisia → Paros / Antiparos',city:'grecia',order:12,events:[
    {tipo:'traslado',hora:'09:00',fecha:'2026-07-03',titulo:'Ferry Koufonisia → Paros',pago:'no',extras:{origen:'Koufonisia',destino:'Paros (Parikia)',mapsO:'',mapsD:'',medio:'Ferry',llegada:'11:00',duracion:'2h',precio:'€25/persona',conf:'',notas:''}},
    {tipo:'hotel',hora:'13:00',fecha:'2026-07-03',titulo:'Check-in Paros',pago:'no',extras:{nombre:'',ciudad:'Paros',dir:'Naoussa o Parikia, Paros',maps:'',cinFecha:'2026-07-03',cinHora:'13:00',coutFecha:'2026-07-06',coutHora:'11:00',conf:'',tel:'',notas:'3 noches · Base para explorar también Antiparos'}}
  ]},
  {id:'d13',date:'4–5 jul',fecha:'2026-07-04',label:'Paros & Antiparos — islas hermanas',city:'grecia',order:13,events:[
    {tipo:'actividad',hora:'10:00',fecha:'2026-07-04',titulo:'Naoussa — pueblo de pescadores',pago:'na',extras:{lugar:'Naoussa, Paros',maps:'',horafin:'13:00',precio:'Gratis',conf:'',proveedor:'',link:'',notas:'El pueblo más pintoresco de Paros · Callejuelas de mármol'}},
    {tipo:'traslado',hora:'10:00',fecha:'2026-07-05',titulo:'Ferry a Antiparos (ida y vuelta)',pago:'na',extras:{origen:'Parikia, Paros',destino:'Antiparos',mapsO:'',mapsD:'',medio:'Ferry',llegada:'10:10',duracion:'10 min',precio:'€2',conf:'',notas:'Ferries cada hora · Isla pequeña y tranquila'}},
    {tipo:'actividad',hora:'11:00',fecha:'2026-07-05',titulo:'Antiparos — pueblo y playas',pago:'na',extras:{lugar:'Antiparos',maps:'',horafin:'17:00',precio:'Gratis',conf:'',proveedor:'',link:'',notas:'Mucho más tranquila que Paros · Ambiente relajado'}}
  ]},
  {id:'d14',date:'6 jul',fecha:'2026-07-06',label:'Paros → Milos',city:'grecia',order:14,events:[
    {tipo:'traslado',hora:'09:00',fecha:'2026-07-06',titulo:'Ferry Paros → Milos',pago:'no',extras:{origen:'Paros (Parikia)',destino:'Milos (Adamas)',mapsO:'',mapsD:'',medio:'Ferry',llegada:'11:00',duracion:'2h',precio:'€30/persona',conf:'',notas:'SeaJets o Blue Star · Reservar con anticipación'}},
    {tipo:'hotel',hora:'13:00',fecha:'2026-07-06',titulo:'Check-in Milos',pago:'no',extras:{nombre:'',ciudad:'Milos',dir:'Adamas o Plaka, Milos',maps:'',cinFecha:'2026-07-06',cinHora:'13:00',coutFecha:'2026-07-09',coutHora:'11:00',conf:'',tel:'',notas:'3 noches · Una de las islas más bellas de Grecia'}}
  ]},
  {id:'d15',date:'7–8 jul',fecha:'2026-07-07',label:'Milos — la isla de los colores',city:'grecia',order:15,events:[
    {tipo:'actividad',hora:'09:00',fecha:'2026-07-07',titulo:'Sarakiniko — playa de piedra blanca lunar',pago:'na',extras:{lugar:'Sarakiniko, Milos',maps:'',horafin:'12:00',precio:'Gratis',conf:'',proveedor:'',link:'',notas:'Paisaje único en el mundo · Ir temprano antes del calor'}},
    {tipo:'actividad',hora:'14:00',fecha:'2026-07-07',titulo:'Tour en barco — cuevas y playas',pago:'no',extras:{lugar:'Puerto de Adamas, Milos',maps:'',horafin:'18:00',precio:'€50/persona',conf:'',proveedor:'',link:'',notas:'Las mejores playas solo se llegan en bote · Kleftiko y Tsigrado'}},
    {tipo:'actividad',hora:'18:00',fecha:'2026-07-08',titulo:'Atardecer desde Plaka',pago:'na',extras:{lugar:'Plaka, Milos',maps:'',horafin:'20:00',precio:'Gratis',conf:'',proveedor:'',link:'',notas:'Vistas 360° de la isla y el mar'}}
  ]},
  {id:'d16',date:'9 jul',fecha:'2026-07-09',label:'Milos → Santorini',city:'grecia',order:16,events:[
    {tipo:'traslado',hora:'09:00',fecha:'2026-07-09',titulo:'Ferry Milos → Santorini',pago:'no',extras:{origen:'Milos (Adamas)',destino:'Santorini (Thira)',mapsO:'',mapsD:'',medio:'Ferry',llegada:'12:00',duracion:'3h',precio:'€35/persona',conf:'',notas:'SeaJets directo · Reservar con mucha anticipación — alta temporada'}},
    {tipo:'hotel',hora:'14:00',fecha:'2026-07-09',titulo:'Check-in Santorini',pago:'no',extras:{nombre:'',ciudad:'Santorini',dir:'Oia o Fira, Santorini',maps:'',cinFecha:'2026-07-09',cinHora:'14:00',coutFecha:'2026-07-11',coutHora:'11:00',conf:'',tel:'',notas:'2 noches · Vista caldera si es posible · Reservar ya'}},
    {tipo:'actividad',hora:'19:30',fecha:'2026-07-09',titulo:'Atardecer en Oia',pago:'na',extras:{lugar:'Oia, Santorini',maps:'',horafin:'21:00',precio:'Gratis',conf:'',proveedor:'',link:'',notas:'Llegar 30–45 min antes — muy concurrido en julio'}}
  ]},
  {id:'d17',date:'10 jul',fecha:'2026-07-10',label:'Santorini — caldera y playas volcánicas',city:'grecia',order:17,events:[
    {tipo:'actividad',hora:'10:00',fecha:'2026-07-10',titulo:'Playa Perissa o Kamari',pago:'na',extras:{lugar:'Perissa, Santorini',maps:'',horafin:'13:00',precio:'Gratis',conf:'',proveedor:'',link:'',notas:'Arena volcánica negra · ATV para ir de Perissa a Kamari'}},
    {tipo:'actividad',hora:'15:00',fecha:'2026-07-10',titulo:'Tour en barco — caldera y volcán',pago:'no',extras:{lugar:'Puerto de Santorini',maps:'',horafin:'19:00',precio:'€35/persona',conf:'',proveedor:'',link:'',notas:'Aguas termales + volcán activo · Reservar grupalmente'}},
    {tipo:'restaurante',hora:'20:00',fecha:'2026-07-10',titulo:'Cena con vista a la caldera',pago:'no',extras:{nombre:'',dir:'Fira o Oia, Santorini',maps:'',cocina:'Griega, mariscos',precio:'€50/persona',conf:'',reserva:'Pendiente de reserva',link:'',notas:'Reservar mesa con anticipación — alta temporada'}}
  ]},
  {id:'d18',date:'11 jul',fecha:'2026-07-11',label:'Santorini → Estambul',city:'transito',order:18,events:[
    {tipo:'traslado',hora:'13:00',fecha:'2026-07-11',titulo:'Traslado aeropuerto Santorini',pago:'na',extras:{origen:'Hotel Santorini',destino:'JTR — Aeropuerto Santorini',mapsO:'',mapsD:'',medio:'Taxi / Bus',llegada:'13:30',duracion:'20 min',precio:'€15',conf:'',notas:''}},
    {tipo:'vuelo',hora:'15:40',fecha:'2026-07-11',titulo:'Turkish Airlines · ATH → IST',pago:'si',extras:{aerolinea:'Turkish Airlines',numero:'',origen:'ATH — Atenas El. Venizelos',destino:'IST — Aeropuerto Estambul',salida:'15:40',llegada:'17:20',duracion:'1h 40m',terminal:'',escala:'Sin escala — vuelo directo',pnr:'R4CMMB',clase:'Economy Q',equipaje:'Confirmar allowance',notas:'Puede requerir conexión desde JTR via Atenas'}},
    {tipo:'hotel',hora:'19:00',fecha:'2026-07-11',titulo:'Check-in Estambul',pago:'no',extras:{nombre:'',ciudad:'Estambul',dir:'Sultanahmet, Estambul',maps:'',cinFecha:'2026-07-11',cinHora:'19:00',coutFecha:'2026-07-13',coutHora:'11:00',conf:'',tel:'',notas:'Zona histórica — todo a pie'}}
  ]},
  {id:'d19',date:'12 jul',fecha:'2026-07-12',label:'Estambul — entre dos continentes',city:'turquia',order:19,events:[
    {tipo:'actividad',hora:'09:00',fecha:'2026-07-12',titulo:'Mezquita Azul + Hagia Sophia',pago:'no',extras:{lugar:'Sultanahmet, Estambul',maps:'https://maps.google.com/?q=Hagia+Sophia+Istanbul',horafin:'12:00',precio:'Hagia Sophia: €15 / Mezquita: Gratis',conf:'',proveedor:'',link:'',notas:'Cubrir hombros y cabeza · Reservar Hagia Sophia online'}},
    {tipo:'actividad',hora:'13:00',fecha:'2026-07-12',titulo:'Gran Bazar',pago:'na',extras:{lugar:'Kapalıçarşı, Estambul',maps:'',horafin:'15:00',precio:'Gratis — negociar!',conf:'',proveedor:'',link:'',notas:'Más de 4000 tiendas · Especias, alfombras, cerámica'}},
    {tipo:'actividad',hora:'17:00',fecha:'2026-07-12',titulo:'Crucero atardecer Bósforo',pago:'no',extras:{lugar:'Embarcadero Eminönü',maps:'',horafin:'19:00',precio:'€20/persona',conf:'',proveedor:'',link:'',notas:'Entre Europa y Asia · Reservar con anticipación'}},
    {tipo:'restaurante',hora:'21:00',fecha:'2026-07-12',titulo:'Cena en Karaköy',pago:'na',extras:{nombre:'',dir:'Barrio Karaköy, Estambul',maps:'',cocina:'Mariscos y meze turco',precio:'€35/persona',conf:'',reserva:'Pendiente de reserva',link:'',notas:''}}
  ]},
  {id:'d20',date:'13 jul',fecha:'2026-07-13',label:'Estambul → Capadocia',city:'turquia',order:20,events:[
    {tipo:'vuelo',hora:'08:00',fecha:'2026-07-13',titulo:'Vuelo Estambul → Capadocia',pago:'no',extras:{aerolinea:'Turkish Airlines / Pegasus',numero:'',origen:'IST o SAW — Estambul',destino:'NAV o ASR — Capadocia',salida:'08:00',llegada:'09:30',duracion:'1h 30m',terminal:'',escala:'Sin escala',pnr:'',clase:'Economy',equipaje:'',notas:'Aeropuerto Nevşehir (NAV) o Kayseri (ASR)'}},
    {tipo:'traslado',hora:'09:30',fecha:'2026-07-13',titulo:'Traslado aeropuerto → hotel Capadocia',pago:'na',extras:{origen:'Aeropuerto Capadocia',destino:'Hotel Göreme',mapsO:'',mapsD:'',medio:'Transfer privado',llegada:'10:15',duracion:'45 min',precio:'€20',conf:'',notas:''}},
    {tipo:'hotel',hora:'12:00',fecha:'2026-07-13',titulo:'Check-in Capadocia',pago:'no',extras:{nombre:'',ciudad:'Capadocia',dir:'Göreme o Üçhisar, Capadocia',maps:'',cinFecha:'2026-07-13',cinHora:'12:00',coutFecha:'2026-07-14',coutHora:'10:00',conf:'',tel:'',notas:'1 noche · Cave hotel recomendado · Reservar ya'}}
  ]},
  {id:'d21',date:'14 jul',fecha:'2026-07-14',label:'Capadocia — chimeneas de hadas',city:'turquia',order:21,events:[
    {tipo:'actividad',hora:'05:00',fecha:'2026-07-14',titulo:'Paseo en globo aerostático',pago:'no',extras:{lugar:'Göreme, Capadocia',maps:'',horafin:'07:00',precio:'€150–200/persona',conf:'',proveedor:'Butterfly Balloons / Kapadokya Balloons',link:'',notas:'Salida al amanecer 05:00–06:00 · La experiencia más icónica de Capadocia · Reservar con meses de anticipación'}},
    {tipo:'actividad',hora:'10:00',fecha:'2026-07-14',titulo:'Göreme Open Air Museum',pago:'no',extras:{lugar:'Göreme, Capadocia',maps:'',horafin:'12:00',precio:'€15/persona',conf:'',proveedor:'',link:'',notas:'Iglesias rupestres con frescos bizantinos'}},
    {tipo:'actividad',hora:'14:00',fecha:'2026-07-14',titulo:'Valle de Pasabag — chimeneas de hadas',pago:'na',extras:{lugar:'Pasabag, Capadocia',maps:'',horafin:'16:00',precio:'Gratis',conf:'',proveedor:'',link:'',notas:'Las formaciones rocosas más fotogénicas · ATV o jeep'}}
  ]},
  {id:'d22',date:'15 jul',fecha:'2026-07-15',label:'Capadocia → Buenos Aires',city:'transito',order:22,events:[
    {tipo:'traslado',hora:'06:00',fecha:'2026-07-15',titulo:'Traslado al aeropuerto',pago:'na',extras:{origen:'Hotel Capadocia',destino:'NAV o ASR — Aeropuerto Capadocia',mapsO:'',mapsD:'',medio:'Transfer privado',llegada:'06:45',duracion:'45 min',precio:'€20',conf:'',notas:'Salir con tiempo suficiente'}},
    {tipo:'vuelo',hora:'08:00',fecha:'2026-07-15',titulo:'Vuelo Capadocia → Estambul',pago:'no',extras:{aerolinea:'Turkish Airlines / Pegasus',numero:'',origen:'NAV o ASR — Capadocia',destino:'IST — Aeropuerto Estambul',salida:'08:00',llegada:'09:30',duracion:'1h 30m',terminal:'',escala:'',pnr:'',clase:'Economy',equipaje:'',notas:'Vuelo de conexión hacia EZE'}},
    {tipo:'vuelo',hora:'10:45',fecha:'2026-07-15',titulo:'Turkish Airlines · IST → EZE',pago:'si',extras:{aerolinea:'Turkish Airlines',numero:'',origen:'IST — Aeropuerto Estambul',destino:'EZE — Ministro Pistarini, Buenos Aires',salida:'10:45',llegada:'22:25',duracion:'17h 40m',terminal:'',escala:'Directo',pnr:'R4CMMB',clase:'Economy Q',equipaje:'Confirmar allowance',notas:'Llegada Buenos Aires 22:25 del 15 jul'}}
  ]}
];

const SH=[
  {id:'h1',name:'Hotel Amsterdam',city:'Amsterdam',cc:'p-amsterdam',cinFecha:'2026-06-22',cinHora:'09:00',coutFecha:'2026-06-24',coutHora:'11:00',conf:'',noch:'2 noches',dir:'',maps:'',tel:'',hab:'2 habitaciones dobles',desayuno:'',plat:'',link:'',obs:'Solicitar habitaciones contiguas. Early check-in a confirmar.',pago:'no',order:1},
  {id:'h2',name:'Hotel Atenas',city:'Atenas · Monastiraki / Syntagma',cc:'p-grecia',cinFecha:'2026-06-24',cinHora:'15:00',coutFecha:'2026-06-27',coutHora:'11:00',conf:'',noch:'3 noches',dir:'',maps:'',tel:'',hab:'2 habitaciones dobles',desayuno:'',plat:'',link:'',obs:'Cerca del metro y de Plaka.',pago:'no',order:2},
  {id:'h3',name:'Hotel / Villa Mykonos',city:'Mykonos Town o Platis Gialos',cc:'p-grecia',cinFecha:'2026-06-27',cinHora:'14:00',coutFecha:'2026-06-29',coutHora:'11:00',conf:'',noch:'2 noches',dir:'',maps:'',tel:'',hab:'2 habitaciones',desayuno:'',plat:'',link:'',obs:'Temporada alta — reservar ya.',pago:'no',order:3},
  {id:'h4',name:'Hotel Naxos',city:'Naxos Town (Chora)',cc:'p-grecia',cinFecha:'2026-06-29',cinHora:'12:00',coutFecha:'2026-07-02',coutHora:'11:00',conf:'',noch:'3 noches',dir:'',maps:'',tel:'',hab:'2 habitaciones',desayuno:'',plat:'',link:'',obs:'Naxos Town (Chora) recomendado.',pago:'no',order:4},
  {id:'h5',name:'Hotel Koufonisia',city:'Koufonisia',cc:'p-grecia',cinFecha:'2026-07-02',cinHora:'12:00',coutFecha:'2026-07-03',coutHora:'10:00',conf:'',noch:'1 noche',dir:'',maps:'',tel:'',hab:'2 habitaciones',desayuno:'',plat:'',link:'',obs:'Poca oferta hotelera — reservar con mucha anticipación.',pago:'no',order:5},
  {id:'h6',name:'Hotel Paros',city:'Naoussa o Parikia, Paros',cc:'p-grecia',cinFecha:'2026-07-03',cinHora:'13:00',coutFecha:'2026-07-06',coutHora:'11:00',conf:'',noch:'3 noches',dir:'',maps:'',tel:'',hab:'2 habitaciones',desayuno:'',plat:'',link:'',obs:'Naoussa o Parikia recomendado.',pago:'no',order:6},
  {id:'h7',name:'Hotel Milos',city:'Adamas o Plaka, Milos',cc:'p-grecia',cinFecha:'2026-07-06',cinHora:'13:00',coutFecha:'2026-07-09',coutHora:'11:00',conf:'',noch:'3 noches',dir:'',maps:'',tel:'',hab:'2 habitaciones',desayuno:'',plat:'',link:'',obs:'Adamas o Plaka. Cave house recomendado.',pago:'no',order:7},
  {id:'h8',name:'Hotel / Villa Santorini',city:'Oia o Fira, Santorini',cc:'p-grecia',cinFecha:'2026-07-09',cinHora:'14:00',coutFecha:'2026-07-11',coutHora:'11:00',conf:'',noch:'2 noches',dir:'',maps:'',tel:'',hab:'2 habitaciones',desayuno:'',plat:'',link:'',obs:'Vista caldera si es posible. Temporada altísima — reservar ya.',pago:'no',order:8},
  {id:'h9',name:'Hotel Estambul',city:'Sultanahmet, Estambul',cc:'p-turquia',cinFecha:'2026-07-11',cinHora:'19:00',coutFecha:'2026-07-13',coutHora:'11:00',conf:'',noch:'2 noches',dir:'',maps:'',tel:'',hab:'2 habitaciones',desayuno:'',plat:'',link:'',obs:'Zona histórica, todo a pie.',pago:'no',order:9},
  {id:'h10',name:'Cave Hotel Capadocia',city:'Göreme, Capadocia',cc:'p-turquia',cinFecha:'2026-07-13',cinHora:'12:00',coutFecha:'2026-07-14',coutHora:'10:00',conf:'',noch:'1 noche',dir:'',maps:'',tel:'',hab:'2 habitaciones cave',desayuno:'',plat:'',link:'',obs:'Cave hotel recomendado. Reservar el globo aerostático al mismo tiempo.',pago:'no',order:10}
];

const SC=[
  {id:'c1',group:'Documentos y visados',text:'Pasaportes vigentes (mín. 6 meses tras el regreso — vence después del 15 ene 2027)',order:1},
  {id:'c2',group:'Documentos y visados',text:'e-Visa de Turquía tramitada online — evisa.gov.tr (USD 65/persona)',order:2},
  {id:'c3',group:'Documentos y visados',text:'Confirmaciones de vuelo descargadas en PDF',order:3},
  {id:'c4',group:'Documentos y visados',text:'Seguro de viaje contratado para los 4',order:4},
  {id:'c5',group:'Reservas y entradas',text:'Tickets KLM emitidos antes del 22/04/2026',order:1},
  {id:'c6',group:'Reservas y entradas',text:'Vuelo AMS → ATH reservado (24 jun)',order:2},
  {id:'c7',group:'Reservas y entradas',text:'Vuelo IST → Capadocia reservado (13 jul)',order:3},
  {id:'c8',group:'Reservas y entradas',text:'Vuelo Capadocia → IST reservado (15 jul)',order:4},
  {id:'c9',group:'Reservas y entradas',text:'Ferry Atenas → Mykonos reservado (27 jun)',order:5},
  {id:'c10',group:'Reservas y entradas',text:'Entradas Acrópolis compradas online',order:6},
  {id:'c11',group:'Reservas y entradas',text:'Entradas Rijksmuseum compradas online',order:7},
  {id:'c12',group:'Reservas y entradas',text:'Tour barco caldera Santorini reservado',order:8},
  {id:'c13',group:'Reservas y entradas',text:'Globo aerostático Capadocia reservado (con meses de anticipación)',order:9},
  {id:'c14',group:'Reservas y entradas',text:'Crucero atardecer Bósforo reservado',order:10},
  {id:'c15',group:'Hoteles',text:'Amsterdam — reservado ✓',order:1},
  {id:'c16',group:'Hoteles',text:'Atenas — reservado',order:2},
  {id:'c17',group:'Hoteles',text:'Mykonos — reservado',order:3},
  {id:'c18',group:'Hoteles',text:'Naxos — reservado',order:4},
  {id:'c19',group:'Hoteles',text:'Koufonisia — reservado (¡urgente!)',order:5},
  {id:'c20',group:'Hoteles',text:'Paros — reservado',order:6},
  {id:'c21',group:'Hoteles',text:'Milos — reservado',order:7},
  {id:'c22',group:'Hoteles',text:'Santorini — reservado',order:8},
  {id:'c23',group:'Hoteles',text:'Estambul — reservado',order:9},
  {id:'c24',group:'Hoteles',text:'Capadocia — reservado',order:10},
  {id:'c25',group:'Antes de salir',text:'Check-in online vuelo KLM (24hs antes — 20 jun)',order:1},
  {id:'c26',group:'Antes de salir',text:'Mapas offline descargados (Google Maps)',order:2},
  {id:'c27',group:'Antes de salir',text:'SIM internacional o eSIM activada (Europa + Turquía)',order:3},
  {id:'c28',group:'Antes de salir',text:'Euros y liras turcas en efectivo',order:4},
  {id:'c29',group:'Antes de salir',text:'Adaptadores de enchufe tipo C (Europa) y tipo F (Turquía)',order:5},
  {id:'c30',group:'Antes de salir',text:'App Uber / Bolt instalada para traslados',order:6}
];

const SN=[
  {person:'ER',personAv:'av1',personName:'Eugenia Romero',text:'Para Santorini y las islas: reservar todo con mucha anticipación. Julio es temporada altísima. ✨',date:'hace 2 días',ts:Date.now()-172800000},
  {person:'JN',personAv:'av2',personName:'Juan José Noguera',text:'La e-Visa de Turquía la saqué en 5 minutos en evisa.gov.tr. Son USD 65 por persona. Háganla antes de viajar!',date:'ayer',ts:Date.now()-86400000},
  {person:'VS',personAv:'av3',personName:'Valeria Secchi',text:'Para los ferrys entre islas: SeaJets es el más rápido. Reservar con anticipación en verano.',date:'hoy',ts:Date.now()-3600000}
];
export {SD,SH,SC,SN};
