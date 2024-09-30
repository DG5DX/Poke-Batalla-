<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="column q-pa-md" style="background-color: rgba(224, 213, 213, 0.75);">

        <div v-if="!enJuego">
          <q-card class="q-pa-md q-mb-md" flat bordered>
            <q-card-section>
              <div class="text-h6">
                <q-icon name="gamepad" /> ¡Bienvenido al combate Pokémon!
              </div>
              <div class="q-pa-md">
                <q-input v-model="rondas" label="¿Cuántas rondas jugarán?" type="number" />
              </div>
            </q-card-section>
            <q-card-actions align="right">
              <q-btn label="Comenzar Juego" icon="play_circle" color="primary" @click="iniciar_juego" />
            </q-card-actions>
          </q-card>
        </div>

        <div v-else>
          <div class="menu q-mt-md">
            <h2 class="titulo">Elige la estadística para combatir:</h2>
            <q-select v-model="estadistica_seleccionada" :options="opciones_estadisticas"
              label="" />
            <q-btn-group push class="opciones">
              <q-btn label="Generar Pokémon" icon="autorenew" color="primary" @click="generarPokemones"
                class="q-mt-md" />
              <q-btn label="Combatir" icon="sports_kabaddi" color="primary" @click="combatir"
                :disable="!Positivo_Combatir || cargando" class="q-mt-md">
                <q-spinner v-if="cargando" size="sm" color="white" />
              </q-btn>
              <q-btn label="Finalizar Juego" icon="flag" color="negative" @click="finalizarJuego" class="q-mt-md" />
            </q-btn-group>
          </div>

          <div class="puntajes q-mt-md">
            <div class="puntaje">
              <h4>Jugador 1 = {{ puntaje_jugador1 }}</h4>
            </div>
            <div class="puntaje">
              <h4>Jugador 2 = {{ puntaje_jugador2 }}</h4>
            </div>
          </div>

          <div class="q-gutter-xs q-mt-md cards-container">
            <q-card v-for="(pokemon, index) in pokemones" :key="index"
              :class="{ 'ganador': ganadorRonda === index + 1, 'perdedor': ganadorRonda !== index + 1 && ganadorRonda !== null }"
              class="info-pokemon q-pa-md" flat bordered :style="{ background: pokemon.color }">
              <q-card-section class="card-section" style="width: 50%; height: 50%;">
                <h2 class="nombre">{{ pokemon.nombre }}</h2>
                <img :src="pokemon.imagen" alt="Imagen del Pokémon" class="pokemon-img" />
                <div class="estadistica" v-if="mostrar_estadisticas">
                  <h4 class="stat">{{ estadistica_seleccionada }}: {{ pokemon.estadistica }}</h4>
                  <q-linear-progress :value="pokemon.estadistica / 255" color="primary" rounded />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <q-notification v-model="mostrar_resultado" :message="resultadoRonda" :color="color_resultado"
          position="top" timeout="3000" @hide="ocultarNotificacion" />
        <q-dialog v-model="alerta_final">
          <q-card>
            <q-card-section>
              <div class="text-h6">¡Fin del juego!</div>
              <p>{{ mensaje_final }}</p>
            </q-card-section>
            <q-card-actions align="right">
              <q-btn label="Volver al Menú" icon="restart_alt" color="primary" @click="resetearJuego" />
            </q-card-actions>
          </q-card>
        </q-dialog>

        <q-dialog v-model="cargando">
          <q-card class="q-pa-md" style="width: 300px; text-align: center;">
            <q-spinner size="50px" />
            <p>Enfrentando Pokemones...</p>
          </q-card>
        </q-dialog>

      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import axios from 'axios';

const $q = useQuasar();

const enJuego = ref(false);
const rondas = ref(3);
const opciones_estadisticas = ref(["hp", "attack", "defense", "speed"]);
const estadistica_seleccionada = ref(opciones_estadisticas.value[0]); // Valor predeterminado
const pokemones = ref([]);
const mostrar_resultado = ref(false);
const color_resultado = ref("positive");
const alerta_final = ref(false);
const mensaje_final = ref("");
const cargando = ref(false);
const rondaActual = ref(0);
const puntaje_jugador1 = ref(0);
const puntaje_jugador2 = ref(0);
const ganadorRonda = ref(null);
const Positivo_Combatir = ref(false);
const mostrar_estadisticas = ref(false);
const resultadoRonda = ref("");
const animacionEnCurso = ref(false);

function iniciar_juego() {
  if (!rondas.value || rondas.value <= 0) {
    $q.notify({ type: 'negative', message: 'Por favor, ingrese un número válido de rondas.' });
    return;
  }
  enJuego.value = true;
  resetJuego();
}

async function generarPokemones() {
  mostrar_estadisticas.value = false;
  Positivo_Combatir.value = false;
  ganadorRonda.value = null;
  mostrar_resultado.value = false;

  const pokemon1 = await generarPokemon();
  const pokemon2 = await generarPokemon();

  if (pokemon1 && pokemon2) {
    pokemones.value = [pokemon1, pokemon2];
    Positivo_Combatir.value = true;
  }
}

async function generarPokemon() {
  const randomId = Math.floor(Math.random() * 1025) + 1;
  try {
    const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);

    return {
      nombre: data.name,
      imagen: data.sprites.other['official-artwork'].front_default,
      numero: data.id,
      estadistica: data.stats.find(stat => stat.stat.name === estadistica_seleccionada.value)?.base_stat || 0,
      color: obtenerColorTipo(data.types)
    };
  } catch (error) {
    console.error("Error al obtener Pokémon:", error);
    return null;
  }
}

function obtenerColorTipo(tipos) {
  const coloresTipos = {
    fire: '#f08030',
    water: '#6890f0',
    grass: '#78c850',
    electric: '#f8d030',
    ice: '#98d8d8',
    fighting: '#c03028',
    poison: '#a040a0',
    ground: '#e0c068',
    flying: '#a890f0',
    psychic: '#f85888',
    bug: '#a8b820',
    rock: '#b8a038',
    ghost: '#705898',
    dragon: '#7038f8',
    dark: '#705848',
    steel: '#b8b8d0',
    fairy: '#f0b6bc',
    normal: '#a8a878'
  };
  return tipos.length > 1
    ? `linear-gradient(90deg, ${coloresTipos[tipos[0].type.name]}, ${coloresTipos[tipos[1].type.name]})`
    : coloresTipos[tipos[0].type.name];
}

function combatir() {
  if (!estadistica_seleccionada.value) {
    $q.notify({ type: 'negative', message: '¡Por favor selecciona una estadística para combatir!' });
    return;
  }

  mostrar_resultado.value = false;
  cargando.value = true;
  Positivo_Combatir.value = false;
  animacionEnCurso.value = true;

  setTimeout(() => {
    const Estadistica1 = pokemones.value[0].estadistica;
    const Estadistica2 = pokemones.value[1].estadistica;

    if (Estadistica1 > Estadistica2) {
      puntaje_jugador1.value++;
      resultadoRonda.value = "¡El jugador 1 ganó esta ronda!";
      color_resultado.value = "positive";
      ganadorRonda.value = 1;
    } else if (Estadistica1 < Estadistica2) {
      puntaje_jugador2.value++;
      resultadoRonda.value = "¡El jugador 2 ganó esta ronda!";
      color_resultado.value = "positive";
      ganadorRonda.value = 2;
    } else {
      resultadoRonda.value = "¡Es un empate!";
      color_resultado.value = "warning";
      ganadorRonda.value = null;
    }

    $q.notify({
      type: color_resultado.value,
      message: resultadoRonda.value,
      timeout: 3000,
      position: "top"
    });

    mostrar_resultado.value = true;
    cargando.value = false;
    rondaActual.value++;

    if (rondaActual.value >= rondas.value) {
      finalizarJuego();
    }
    setTimeout(() => {
      animacionEnCurso.value = false;
      mostrar_estadisticas.value = true;
    }, 300);
  }, 3000);
}

function finalizarJuego() {
  mensaje_final.value = puntaje_jugador1.value > puntaje_jugador2.value
    ? '¡El jugador 1 ganó el juego!'
    : puntaje_jugador1.value < puntaje_jugador2.value
      ? '¡El jugador 2 ganó el juego!'
      : '¡El juego ha terminado en empate!';
  alerta_final.value = true;
}

function resetearJuego() {
  alerta_final.value = false;
  enJuego.value = false;
  resetJuego();
}

function resetJuego() {
  rondaActual.value = 0;
  puntaje_jugador1.value = 0;
  puntaje_jugador2.value = 0;
  estadistica_seleccionada.value = opciones_estadisticas.value[0]; // Reiniciar a valor predeterminado
  mostrar_estadisticas.value = false;
  ganadorRonda.value = null;
  mostrar_resultado.value = false;
}

function ocultarNotificacion() {
  mostrar_resultado.value = false;
}
</script>


<style scoped>
.cards-container{
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  margin: 0%;
}
.menu{
  display: grid;
  justify-content: center;
  justify-items: center;
}
.titulo{
  margin: 10px;
}
.puntajes{
  display: flex;
  justify-content: space-around;
  margin: 0%
}
.titulo{
  margin-bottom: 10px;
}
.nombre{
  margin: 0%;
}
.stat{
  margin: 0%;
}
.info-pokemon{
  text-align: center;
  padding: 20px;
  width: 50vh;
}
.pokemon-img{
  max-width: 350px;
}
.ganador{
  transform: scale(1.1);
  transition: transform 0.3s ease;
}
.perdedor{
  transform: scale(0.9);
  transition: transform 0.3s ease;
}

@media (max-width: 520px){
  .q-pa-md{
    background-color: rgba(224, 213, 213, 0.75);
    margin: 0%;
    align-content: center;
    padding: 0px;
  }
  .cards-container{
    flex-direction: column;
    align-items: center;
  }
  .info-pokemon{
    width: 90%;
    margin-bottom: 20px;
  }
  .pokemon-img{
    max-width: 300px;
  }
  .q-btn-group{
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .q-btn{
    width: 100%;
    margin-bottom: 10px;
  }
}
</style>