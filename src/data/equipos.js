// Mapeo de equipos de Primera División Argentina (COMPLETO con todos los archivos disponibles)
export const EQUIPOS_PRIMERA = [
  { nombre: "Aldosivi", archivo: "aldosivi", escudo: "/primeradivision/aldosivi.png" },
  { nombre: "Argentinos Juniors", archivo: "argentinos", escudo: "/primeradivision/argentinos.png" },
  { nombre: "Atlético Tucumán", archivo: "atleticotucuman", escudo: "/primeradivision/atleticotucuman.png" },
  { nombre: "Banfield", archivo: "banfield", escudo: "/primeradivision/banfield.png" },
  { nombre: "Barracas Central", archivo: "barracas", escudo: "/primeradivision/barracas.png" },
  { nombre: "Belgrano", archivo: "belgrano", escudo: "/primeradivision/belgrano.png" },
  { nombre: "Boca Juniors", archivo: "boca", escudo: "/primeradivision/boca.png" },
  { nombre: "Central Córdoba", archivo: "centralcordoba", escudo: "/primeradivision/centralcordoba.png" },
  { nombre: "Defensa y Justicia", archivo: "defensa", escudo: "/primeradivision/defensa.png" },
  { nombre: "Estudiantes", archivo: "estudiantes", escudo: "/primeradivision/estudiantes.png" },
  { nombre: "Estudiantes (Alternativo)", archivo: "estudiantes2", escudo: "/primeradivision/estudiantes2.png" },
  { nombre: "Gimnasia y Esgrima La Plata", archivo: "gimnasia", escudo: "/primeradivision/gimnasia.png" },
  { nombre: "Godoy Cruz", archivo: "godoycruz", escudo: "/primeradivision/godoycruz.png" },
  { nombre: "Huracán", archivo: "huracan", escudo: "/primeradivision/huracan.png" },
  { nombre: "Independiente", archivo: "independiente", escudo: "/primeradivision/independiente.png" },
  { nombre: "Independiente (Alternativo)", archivo: "independiente2", escudo: "/primeradivision/independiente2.png" },
  { nombre: "Independiente Rivadavia", archivo: "independienteriv", escudo: "/primeradivision/independienteriv.png" },
  { nombre: "Instituto", archivo: "instituto", escudo: "/primeradivision/instituto.png" },
  { nombre: "Lanús", archivo: "lanus", escudo: "/primeradivision/lanus.png" },
  { nombre: "Newell's Old Boys", archivo: "newells", escudo: "/primeradivision/newells.png" },
  { nombre: "Platense", archivo: "platense", escudo: "/primeradivision/platense.png" },
  { nombre: "Racing Club", archivo: "racing", escudo: "/primeradivision/racing.png" },
  { nombre: "Racing (Alternativo)", archivo: "racing2", escudo: "/primeradivision/racing2.png" },
  { nombre: "Deportivo Riestra", archivo: "riestra", escudo: "/primeradivision/riestra.png" },
  { nombre: "River Plate", archivo: "river", escudo: "/primeradivision/river.png" },
  { nombre: "Rosario Central", archivo: "rosariocentral", escudo: "/primeradivision/rosariocentral.png" },
  { nombre: "San Lorenzo", archivo: "sanlorenzo", escudo: "/primeradivision/sanlorenzo.png" },
  { nombre: "San Martín de San Juan", archivo: "sanmartinsj", escudo: "/primeradivision/sanmartinsj.png" },
  { nombre: "Sarmiento", archivo: "sarmiento", escudo: "/primeradivision/sarmiento.png" },
  { nombre: "Talleres", archivo: "talleres", escudo: "/primeradivision/talleres.png" },
  { nombre: "Tigre", archivo: "tigre", escudo: "/primeradivision/tigre.png" },
  { nombre: "Unión", archivo: "union", escudo: "/primeradivision/union.png" },
  { nombre: "Vélez Sarsfield", archivo: "velez", escudo: "/primeradivision/velez.png" }
]

// Función para obtener escudo por nombre de equipo
export const getEscudoByTeam = (teamName) => {
  const equipo = EQUIPOS_PRIMERA.find(eq => eq.nombre === teamName)
  return equipo ? equipo.escudo : null
}

// Función para obtener equipo por archivo
export const getTeamByArchivo = (archivo) => {
  const equipo = EQUIPOS_PRIMERA.find(eq => eq.archivo === archivo)
  return equipo ? equipo.nombre : null
}