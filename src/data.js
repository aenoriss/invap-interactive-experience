// The four areas of the 2071 catalogue, each with its product.
//
// `facts` only restate what each product's own text says, so nothing is claimed twice
// in two different ways. `parts` name three places on the model for the labels that follow
// it as it turns: either a point in the model file's own coordinates (`at`, Y up), or the
// parts whose material name fits a pattern (`match`), labelled at their middle or their top.
export const AREAS = [
  {
    id: 'habitat',
    title: 'Hábitat',
    theme: 'Biología',
    body: 'Cuando pensamos en el espacio solemos hacerlo como un lugar frío y desolado. Conocé cómo INVAP está cambiando esta realidad, llevando la Tierra a los colonos más distantes.',
    header: 'Llevando la Tierra al espacio',
    device: 'Elmapu',
    kind: 'Domo ecológico',
    text: 'Los Domos Ecológicos Elmapu representan el pináculo de la ingeniería en terraformación. Dentro de ellos un ecosistema controlado imita las condiciones de vida en la Tierra y permite a los colonos disfrutar de un estándar de vida elevado en los confines del sistema solar.',
    facts: ['Ecosistema controlado', 'Condiciones de la Tierra', 'Para colonias lejanas'],
    model: '/models/elmapu.glb',
    view: { from: [1.1, 0.62, 1.25], lift: 0.08, close: 0.4 },
    parts: [{ label: 'Domo geodésico', at: [0, 2.9, 0] }, { label: 'Ecosistema', at: [-0.9, 0.6, -0.5] }, { label: 'Esclusa', at: [4.3, 0.2, 0] }],
  },
  {
    id: 'transporte',
    title: 'Transporte',
    theme: 'Ascensor espacial',
    body: 'El espacio siempre ha cautivado la imaginación humana. Lo que antes era un sueño hoy es posible. Descubrí cómo INVAP te permite ir a donde nadie se atrevió.',
    header: 'Desafiando la última frontera',
    device: 'Patoruzú',
    kind: 'Nave de carga interestelar',
    text: 'Nuestro proceso de manufactura híbrido combina la producción terrestre de módulos altamente complejos con avanzadas técnicas de ensamblaje en órbita lunar. Esto nos permite ofrecer costos insuperables, posicionándonos como uno de los principales productores de naves de carga interestelar en el mundo.',
    facts: ['Módulos hechos en la Tierra', 'Ensamblaje en órbita lunar', 'Carga interestelar'],
    model: '/models/patoruzu.glb',
    view: { from: [1.2, 0.45, 1.0], lift: 0, close: 0.62 },
    parts: [{ label: 'Anillos de impulso', match: '^Coil', pick: 'top' }, { label: 'Puente de mando', match: 'Cockpit_Window|Command_Top_Windows' }, { label: 'Motores', match: '^Thruster_Nozzles' }],
  },
  {
    id: 'comunicacion',
    title: 'Comunicación',
    theme: 'Red universal',
    body: 'El universo se ha convertido en un sistema interconectado e INVAP se encuentra en el centro de este nuevo paradigma. Descubrí cómo conectamos los puntos más remotos de la galaxia.',
    header: 'Conectando las estrellas',
    device: 'Mafalda II',
    kind: 'Satélite de comunicación',
    text: 'El Satélite de Comunicación de Alta Frecuencia Mafalda II se ha convertido en el estándar para la transmisión en el espacio. Orbitando en las proximidades de las principales colonias humanas recibe datos por radiofrecuencia y los retransmite mediante un complejo proceso de entrelazamiento cuántico que supera las limitaciones que impone la velocidad de la luz y permite el desarrollo de la Internet Universal.',
    facts: ['Recibe por radiofrecuencia', 'Retransmite por entrelazamiento cuántico', 'Internet Universal'],
    model: '/models/mafalda.glb',
    view: { from: [0.8, 0.6, 1.35], lift: 0.05, close: 0.74 },
    parts: [{ label: 'Antena principal', at: [-0.6, 2.75, 0] }, { label: 'Paneles solares', at: [3.15, 0, 0] }, { label: 'Relé cuántico', at: [0.32, 1.52, -0.3] }],
  },
  {
    id: 'energia',
    title: 'Energía',
    theme: 'Fusión compacta',
    body: 'La colonización del espacio será alimentada por nuevas tecnologías que producirán energía de manera limpia y segura, brindando mayor autonomía en la exploración del cosmos.',
    header: 'Iluminando el cosmos',
    device: 'Reactor Antu',
    kind: 'Reactor de fusión',
    text: 'Los Reactores Antu producen grandes cantidades de energía a través del proceso de fusión nuclear. Esto los vuelve más eficientes y seguros que las alternativas convencionales. Su diminuto tamaño permite implementarlos en naves y estaciones espaciales de pequeña envergadura. El mantenimiento requerido es ínfimo, por lo que incrementa ampliamente la autonomía del viaje estelar.',
    facts: ['Fusión nuclear', 'Para naves y estaciones pequeñas', 'Mantenimiento ínfimo'],
    model: '/models/antu.glb',
    view: { from: [1.15, 0.35, 1.2], lift: 0, close: 0.66 },
    plasma: 'Reactor_Core',            // the parts drawn as moving plasma, by material name
    parts: [{ label: 'Núcleo', match: 'Reactor_Core' }, { label: 'Aletas de enfriamiento', match: 'Cooling_Fins$', pick: 'side' }, { label: 'Tuberías', match: 'Reactor_Pipes', pick: 'top' }],
  },
]
